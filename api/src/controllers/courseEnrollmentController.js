const CourseEnrollment = require('../models/CourseEnrollment');
const CourseLessonCompletion = require('../models/CourseLessonCompletion');
const CoursePayment = require('../models/CoursePayment');
const Course = require('../models/Course');
const CourseModule = require('../models/CourseModule');
const CourseLesson = require('../models/CourseLesson');
const User = require('../models/User');
const courseContentService = require('../services/courseContentService');
const { notifyNewEnrollment } = require('../utils/notificationHelper');
const { Op } = require('sequelize');

class CourseEnrollmentController {
  // Enroll in a course
  async enrollCourse(req, res) {
    try {
      const { courseId } = req.params;
      const userId = req.user.id;

      // Check if course exists
      const course = await Course.findOne({
        where: {
          id: courseId,
          status: 'published',
          is_deleted: false
        }
      });

      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found or not available'
        });
      }

      // Check if already enrolled
      const existingEnrollment = await CourseEnrollment.findOne({
        where: { user_id: userId, course_id: courseId }
      });

      if (existingEnrollment) {
        return res.status(400).json({
          success: false,
          message: 'You are already enrolled in this course',
          data: existingEnrollment
        });
      }

      // Kiểm tra khóa học có phí hay không
      const coursePrice = course.price || course.original_price || 0;
      
      if (coursePrice > 0) {
        // Kiểm tra có payment đang pending không
        const pendingPayment = await CoursePayment.findOne({
          where: { 
            user_id: userId, 
            course_id: courseId,
            payment_status: 'pending'
          }
        });

        if (pendingPayment) {
          return res.status(400).json({
            success: false,
            message: 'You have a pending payment for this course. Please wait for confirmation.',
            isPending: true,
            data: {
              courseId: course.id,
              courseTitle: course.title,
              paymentId: pendingPayment.id,
              paymentMethod: pendingPayment.payment_method,
              amount: pendingPayment.amount,
              createdAt: pendingPayment.created_at
            }
          });
        }

        // Khóa học có phí - yêu cầu thanh toán
        return res.status(402).json({
          success: false,
          message: 'This is a paid course. Payment required.',
          requiresPayment: true,
          data: {
            courseId: course.id,
            courseTitle: course.title,
            price: coursePrice,
            originalPrice: course.original_price,
            discount: course.discount
          }
        });
      }

      // Khóa học miễn phí - đăng ký trực tiếp
      const enrollment = await CourseEnrollment.create({
        user_id: userId,
        course_id: courseId,
        enrollment_type: 'free',
        progress: 0,
        status: 'not-started',
        start_date: new Date()
      });

      // Update course student count
      await Course.increment('students', { where: { id: courseId } });

      // Gửi thông báo realtime cho creator về học viên mới đăng ký khóa học miễn phí
      try {
        const student = await User.findByPk(userId, {
          attributes: ['id', 'name', 'email']
        });
        
        if (req.io && student) {
          await notifyNewEnrollment(req.io, course.instructor_id, course, student, 'free');
        }
      } catch (notificationError) {
        console.error('Error sending enrollment notification:', notificationError);
        // Không throw error để không ảnh hưởng đến flow chính
      }

      res.status(201).json({
        success: true,
        message: 'Successfully enrolled in course',
        data: enrollment
      });
    } catch (error) {
      console.error('Error in enrollCourse:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to enroll in course',
        error: error.message
      });
    }
  }

  // Get user's enrollments
  async getMyEnrollments(req, res) {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      const whereClause = { user_id: userId };
      if (status) {
        whereClause.status = status;
      }

      const enrollments = await CourseEnrollment.findAll({
        where: whereClause,
        include: [{
          model: Course,
          as: 'Course',
          attributes: ['id', 'title', 'thumbnail', 'level', 'duration', 'rating', 'students']
        }],
        order: [['updated_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: enrollments
      });
    } catch (error) {
      console.error('Error in getMyEnrollments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch enrollments',
        error: error.message
      });
    }
  }

  // Check enrollment status
  async checkEnrollment(req, res) {
    try {
      const { courseId } = req.params;
      const userId = req.user.id;

      const enrollment = await CourseEnrollment.findOne({
        where: { user_id: userId, course_id: courseId }
      });

      // Kiểm tra payment đang pending
      const pendingPayment = await CoursePayment.findOne({
        where: { 
          user_id: userId, 
          course_id: courseId,
          payment_status: 'pending'
        },
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: {
          isEnrolled: !!enrollment,
          enrollment: enrollment || null,
          hasPendingPayment: !!pendingPayment,
          pendingPayment: pendingPayment ? {
            id: pendingPayment.id,
            amount: pendingPayment.amount,
            paymentMethod: pendingPayment.payment_method,
            createdAt: pendingPayment.created_at
          } : null
        }
      });
    } catch (error) {
      console.error('Error in checkEnrollment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check enrollment',
        error: error.message
      });
    }
  }

  // Get course progress
  async getCourseProgress(req, res) {
    try {
      const { courseId } = req.params;
      const userId = req.user.id;

      // Check enrollment
      const enrollment = await CourseEnrollment.findOne({
        where: { user_id: userId, course_id: courseId }
      });

      if (!enrollment) {
        return res.status(403).json({
          success: false,
          message: 'You are not enrolled in this course'
        });
      }

      // Get completed lessons
      const completedLessonIds = await CourseLessonCompletion.getCompletedLessonIds(userId, courseId);

      // Calculate progress
      const progress = await courseContentService.calculateCourseProgress(userId, courseId, completedLessonIds);

      // Get course structure with progress
      const structure = await courseContentService.getCourseStructureWithProgress(courseId, userId);

      res.status(200).json({
        success: true,
        data: {
          enrollment,
          progress,
          structure,
          completedLessonIds
        }
      });
    } catch (error) {
      console.error('Error in getCourseProgress:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course progress',
        error: error.message
      });
    }
  }

  // Mark lesson as complete
  async completeLesson(req, res) {
    try {
      const { courseId, lessonId } = req.params;
      const userId = req.user.id;
      const { timeSpent = 0 } = req.body;

      console.log(`[completeLesson] User ${userId} completing lesson ${lessonId} in course ${courseId}`);

      // Check enrollment
      const enrollment = await CourseEnrollment.findOne({
        where: { user_id: userId, course_id: courseId }
      });

      if (!enrollment) {
        return res.status(403).json({
          success: false,
          message: 'You must be enrolled in this course to complete lessons'
        });
      }

      console.log(`[completeLesson] Current enrollment progress: ${enrollment.progress}%, status: ${enrollment.status}`);

      // Verify lesson belongs to course
      const lesson = await CourseLesson.findOne({
        include: [{
          model: CourseModule,
          as: 'Module',
          where: { course_id: courseId }
        }],
        where: { id: lessonId }
      });

      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found in this course'
        });
      }

      console.log(`[completeLesson] Lesson found: ${lesson.title}`);

      // Mark lesson as complete (or update if already exists)
      const [completion, created] = await CourseLessonCompletion.findOrCreate({
        where: { user_id: userId, lesson_id: lessonId },
        defaults: {
          user_id: userId,
          course_id: courseId,
          lesson_id: lessonId,
          time_spent: timeSpent,
          completed_at: new Date()
        }
      });

      if (!created) {
        // Update time spent if already completed
        console.log(`[completeLesson] Updating existing completion record`);
        completion.time_spent = timeSpent;
        completion.completed_at = new Date();
        await completion.save();
      } else {
        console.log(`[completeLesson] Created new completion record with ID: ${completion.id}`);
      }

      // Update enrollment status to in-progress if not started
      if (enrollment.status === 'not-started') {
        console.log(`[completeLesson] Updating status from not-started to in-progress`);
        enrollment.status = 'in-progress';
      }

      // Recalculate progress
      console.log(`[completeLesson] Recalculating progress...`);
      const completedLessonIds = await CourseLessonCompletion.getCompletedLessonIds(userId, courseId);
      console.log(`[completeLesson] Completed lesson IDs: [${completedLessonIds.join(', ')}]`);
      
      const progress = await courseContentService.calculateCourseProgress(userId, courseId, completedLessonIds);
      console.log(`[completeLesson] Calculated progress: ${progress.progressPercentage}% (${progress.completedLessons}/${progress.totalLessons})`);

      // Update enrollment progress
      const oldProgress = enrollment.progress;
      enrollment.progress = progress.progressPercentage;
      console.log(`[completeLesson] Updating enrollment progress from ${oldProgress}% to ${enrollment.progress}%`);

      // Check if course is completed
      if (progress.progressPercentage === 100) {
        console.log(`[completeLesson] Course completed! Setting completion date`);
        enrollment.status = 'completed';
        enrollment.completion_date = new Date();
      }

      // Save enrollment changes
      await enrollment.save();
      console.log(`[completeLesson] Enrollment saved successfully`);

      // Reload enrollment to get fresh data
      await enrollment.reload();
      console.log(`[completeLesson] Final enrollment progress in DB: ${enrollment.progress}%`);

      res.status(200).json({
        success: true,
        message: created ? 'Lesson marked as complete' : 'Lesson completion updated',
        data: {
          completion: {
            id: completion.id,
            user_id: completion.user_id,
            course_id: completion.course_id,
            lesson_id: completion.lesson_id,
            time_spent: completion.time_spent,
            completed_at: completion.completed_at
          },
          enrollment: {
            id: enrollment.id,
            user_id: enrollment.user_id,
            course_id: enrollment.course_id,
            progress: enrollment.progress,
            status: enrollment.status,
            start_date: enrollment.start_date,
            completion_date: enrollment.completion_date
          },
          progress
        }
      });
    } catch (error) {
      console.error('Error in completeLesson:', error);
      console.error('Stack trace:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Failed to complete lesson',
        error: error.message
      });
    }
  }

  // Get learning dashboard
  async getLearningDashboard(req, res) {
    try {
      const userId = req.user.id;
      const dashboard = await courseContentService.getUserLearningDashboard(userId);

      res.status(200).json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      console.error('Error in getLearningDashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch learning dashboard',
        error: error.message
      });
    }
  }
}

module.exports = new CourseEnrollmentController();
