const CourseModule = require('../models/CourseModule');
const CourseLesson = require('../models/CourseLesson');
const CourseEnrollment = require('../models/CourseEnrollment');
const CourseReview = require('../models/CourseReview');
const Course = require('../models/Course');
const User = require('../models/User');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const courseContentService = require('../services/courseContentService');
class CourseContentController {
  // ==================== MODULE MANAGEMENT ====================

  // Create a new course module
  async createModule(req, res) {
    try {
      const { course_id } = req.params;
      const { title, position } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Validate required fields
      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'Module title is required'
        });
      }

      // Find the course and check permissions
      const course = await Course.findByPk(course_id);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      // Authorization check
      if (userRole !== 'admin' && course.instructor_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only create modules for your own courses'
        });
      }

      // If no position provided, set it as the next position
      let modulePosition = position;
      if (!modulePosition) {
        const lastModule = await CourseModule.findOne({
          where: { course_id },
          order: [['position', 'DESC']]
        });
        modulePosition = lastModule ? lastModule.position + 1 : 1;
      }

      const moduleData = {
        course_id,
        title,
        position: modulePosition
      };

      const module = await CourseModule.create(moduleData);

      res.status(201).json({
        success: true,
        message: 'Module created successfully',
        data: module
      });
    } catch (error) {
      console.error('Error in createModule:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create module'
      });
    }
  }

  // Get all modules for a course
  async getCourseModules(req, res) {
    try {
      const { course_id } = req.params;
      const includeStats = req.query.include_stats === 'true';

      // Verify course exists
      const course = await Course.findByPk(course_id);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      const modules = await CourseModule.findAll({
        where: { course_id },
        include: [{
          model: CourseLesson,
          as: 'Lessons',
          required: false,
          order: [['position', 'ASC']]
        }],
        order: [['position', 'ASC']]
      });

      // Add statistics if requested
      if (includeStats) {
        for (let module of modules) {
          const lessonCount = await CourseLesson.count({
            where: { module_id: module.id }
          });
          
          const totalDuration = await CourseLesson.sum('duration', {
            where: { module_id: module.id }
          });

          module.dataValues.lessonCount = lessonCount;
          module.dataValues.totalDuration = totalDuration || 0;
        }
      }

      res.status(200).json({
        success: true,
        data: modules
      });
    } catch (error) {
      console.error('Error in getCourseModules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course modules',
        error: error.message
      });
    }
  }

  // Get a single module by ID
  async getModuleById(req, res) {
    try {
      const { module_id } = req.params;
      const includeLessons = req.query.include_lessons === 'true';

      const includeOptions = [];
      if (includeLessons) {
        includeOptions.push({
          model: CourseLesson,
          as: 'Lessons',
          order: [['position', 'ASC']]
        });
      }

      includeOptions.push({
        model: Course,
        as: 'Course',
        attributes: ['id', 'title', 'instructor_id']
      });

      const module = await CourseModule.findByPk(module_id, {
        include: includeOptions
      });

      if (!module) {
        return res.status(404).json({
          success: false,
          message: 'Module not found'
        });
      }

      res.status(200).json({
        success: true,
        data: module
      });
    } catch (error) {
      console.error('Error in getModuleById:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch module',
        error: error.message
      });
    }
  }

  // Update a module
  async updateModule(req, res) {
    try {
      const { module_id } = req.params;
      const updateData = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.created_at;
      delete updateData.updated_at;
      delete updateData.course_id;

      const module = await CourseModule.findOne({
        where: { id: module_id },
        include: [{
          model: Course,
          as: 'Course'
        }]
      });

      if (!module) {
        return res.status(404).json({
          success: false,
          message: 'Module not found'
        });
      }

      // Authorization check
      if (userRole !== 'admin' && module.Course.instructor_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update modules for your own courses'
        });
      }

      await module.update(updateData);

      res.status(200).json({
        success: true,
        message: 'Module updated successfully',
        data: module
      });
    } catch (error) {
      console.error('Error in updateModule:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update module'
      });
    }
  }

  // Delete a module
  async deleteModule(req, res) {
    try {
      const { module_id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const module = await CourseModule.findOne({
        where: { id: module_id },
        include: [{
          model: Course,
          as: 'Course'
        }]
      });

      if (!module) {
        return res.status(404).json({
          success: false,
          message: 'Module not found'
        });
      }

      // Authorization check
      if (userRole !== 'admin' && module.Course.instructor_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete modules for your own courses'
        });
      }

      // Check if module has lessons
      const lessonCount = await CourseLesson.count({
        where: { module_id }
      });

      if (lessonCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete module. It contains ${lessonCount} lessons. Please delete or move the lessons first.`
        });
      }

      await module.destroy();

      res.status(200).json({
        success: true,
        message: 'Module deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteModule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete module',
        error: error.message
      });
    }
  }

  // Reorder modules
  async reorderModules(req, res) {
    try {
      const { course_id } = req.params;
      const { module_orders } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      if (!module_orders || !Array.isArray(module_orders)) {
        return res.status(400).json({
          success: false,
          message: 'module_orders array is required'
        });
      }

      // Find the course and check permissions
      const course = await Course.findByPk(course_id);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      // Authorization check
      if (userRole !== 'admin' && course.instructor_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only reorder modules for your own courses'
        });
      }

      // Update positions
      const transaction = await sequelize.transaction();
      try {
        for (const item of module_orders) {
          await CourseModule.update(
            { position: item.position },
            { 
              where: { 
                id: item.module_id,
                course_id 
              },
              transaction
            }
          );
        }

        await transaction.commit();

        const updatedModules = await CourseModule.findAll({
          where: { course_id },
          order: [['position', 'ASC']]
        });

        res.status(200).json({
          success: true,
          message: 'Modules reordered successfully',
          data: updatedModules
        });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error in reorderModules:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to reorder modules'
      });
    }
  }

  // ==================== LESSON MANAGEMENT ====================

  // Create a new lesson
  async createLesson(req, res) {
    try {
      const { module_id } = req.params;
      const { title, content, duration, position, type } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Validate required fields
      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'Lesson title is required'
        });
      }

      // Find the module and course, check permissions
      const module = await CourseModule.findOne({
        where: { id: module_id },
        include: [{
          model: Course,
          as: 'Course'
        }]
      });

      if (!module) {
        return res.status(404).json({
          success: false,
          message: 'Module not found'
        });
      }

      // Authorization check
      if (userRole !== 'admin' && module.Course.instructor_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only create lessons for your own courses'
        });
      }

      // If no position provided, set it as the next position
      let lessonPosition = position;
      if (!lessonPosition) {
        const lastLesson = await CourseLesson.findOne({
          where: { module_id },
          order: [['position', 'DESC']]
        });
        lessonPosition = lastLesson ? lastLesson.position + 1 : 1;
      }

      const lessonData = {
        module_id,
        title,
        content,
        duration,
        position: lessonPosition,
        type: type || 'document'
      };

      const lesson = await CourseLesson.create(lessonData);

      res.status(201).json({
        success: true,
        message: 'Lesson created successfully',
        data: lesson
      });
    } catch (error) {
      console.error('Error in createLesson:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create lesson'
      });
    }
  }

  // Get all lessons for a module
  async getModuleLessons(req, res) {
    try {
      const { module_id } = req.params;

      // Verify module exists
      const module = await CourseModule.findByPk(module_id);
      if (!module) {
        return res.status(404).json({
          success: false,
          message: 'Module not found'
        });
      }

      const lessons = await CourseLesson.findAll({
        where: { module_id },
        order: [['position', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: lessons
      });
    } catch (error) {
      console.error('Error in getModuleLessons:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch module lessons',
        error: error.message
      });
    }
  }

  // Get all lessons for a course
  async getCourseLessons(req, res) {
    try {
      const { course_id } = req.params;
      const { include_content } = req.query;

      // Verify course exists
      const course = await Course.findByPk(course_id);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      const attributes = include_content === 'true' 
        ? undefined 
        : { exclude: ['content'] };

      const lessons = await CourseLesson.findAll({
        attributes,
        include: [{
          model: CourseModule,
          as: 'Module',
          where: { course_id },
          attributes: ['id', 'title', 'position']
        }],
        order: [['Module', 'position', 'ASC'], ['position', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: lessons
      });
    } catch (error) {
      console.error('Error in getCourseLessons:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course lessons',
        error: error.message
      });
    }
  }

  // Get a single lesson by ID
  async getLessonById(req, res) {
    try {
      const { lesson_id } = req.params;
      const userId = req.user?.id;

      const lesson = await CourseLesson.findOne({
        where: { id: lesson_id },
        include: [{
          model: CourseModule,
          as: 'Module',
          include: [{
            model: Course,
            as: 'Course',
            attributes: ['id', 'title', 'instructor_id', 'is_premium']
          }]
        }]
      });

      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      // Check if user has access to this lesson
      if (lesson.Module.Course.is_premium && userId) {
        const enrollment = await CourseEnrollment.findOne({
          where: {
            user_id: userId,
            course_id: lesson.Module.Course.id
          }
        });

        if (!enrollment && lesson.Module.Course.instructor_id !== userId && req.user?.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'You need to enroll in this course to access this lesson'
          });
        }
      }

      res.status(200).json({
        success: true,
        data: lesson
      });
    } catch (error) {
      console.error('Error in getLessonById:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lesson',
        error: error.message
      });
    }
  }

  // Update a lesson
  async updateLesson(req, res) {
    try {
      const { lesson_id } = req.params;
      const updateData = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.created_at;
      delete updateData.updated_at;
      delete updateData.module_id;

      const lesson = await CourseLesson.findOne({
        where: { id: lesson_id },
        include: [{
          model: CourseModule,
          as: 'Module',
          include: [{
            model: Course,
            as: 'Course'
          }]
        }]
      });

      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      // Authorization check
      if (userRole !== 'admin' && lesson.Module.Course.instructor_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update lessons for your own courses'
        });
      }

      await lesson.update(updateData);

      res.status(200).json({
        success: true,
        message: 'Lesson updated successfully',
        data: lesson
      });
    } catch (error) {
      console.error('Error in updateLesson:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update lesson'
      });
    }
  }

  // Delete a lesson
  async deleteLesson(req, res) {
    try {
      const { lesson_id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const lesson = await CourseLesson.findOne({
        where: { id: lesson_id },
        include: [{
          model: CourseModule,
          as: 'Module',
          include: [{
            model: Course,
            as: 'Course'
          }]
        }]
      });

      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      // Authorization check
      if (userRole !== 'admin' && lesson.Module.Course.instructor_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete lessons for your own courses'
        });
      }

      await lesson.destroy();

      res.status(200).json({
        success: true,
        message: 'Lesson deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteLesson:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete lesson',
        error: error.message
      });
    }
  }

  // Reorder lessons within a module
  async reorderLessons(req, res) {
    try {
      const { module_id } = req.params;
      const { lesson_orders } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      if (!lesson_orders || !Array.isArray(lesson_orders)) {
        return res.status(400).json({
          success: false,
          message: 'lesson_orders array is required'
        });
      }

      // Find the module and check permissions
      const module = await CourseModule.findOne({
        where: { id: module_id },
        include: [{
          model: Course,
          as: 'Course'
        }]
      });

      if (!module) {
        return res.status(404).json({
          success: false,
          message: 'Module not found'
        });
      }

      // Authorization check
      if (userRole !== 'admin' && module.Course.instructor_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only reorder lessons for your own courses'
        });
      }

      // Update positions
      const transaction = await sequelize.transaction();
      try {
        for (const item of lesson_orders) {
          await CourseLesson.update(
            { position: item.position },
            { 
              where: { 
                id: item.lesson_id,
                module_id 
              },
              transaction
            }
          );
        }

        await transaction.commit();

        const updatedLessons = await CourseLesson.findAll({
          where: { module_id },
          order: [['position', 'ASC']]
        });

        res.status(200).json({
          success: true,
          message: 'Lessons reordered successfully',
          data: updatedLessons
        });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error in reorderLessons:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to reorder lessons'
      });
    }
  }

  // ==================== ENROLLMENT MANAGEMENT ====================

  // Enroll in a course
  async enrollInCourse(req, res) {
    try {
      const { course_id } = req.params;
      const userId = req.user.id;
      const userInfo = {
        isPremium: req.user.is_premium || false
      };

      const result = await courseContentService.enrollUserInCourse(userId, course_id, userInfo);

      res.status(201).json({
        success: true,
        message: 'Successfully enrolled in course',
        data: result
      });
    } catch (error) {
      console.error('Error in enrollInCourse:', error);
      
      // Handle specific error types
      if (error.message.includes('already enrolled')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('not found') || error.message.includes('not available')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('Premium membership required')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to enroll in course'
      });
    }
  }

  // Get user's enrolled courses
  async getUserEnrollments(req, res) {
    try {
      const userId = req.user.id;
      const { status, include_course_details } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const whereClause = { user_id: userId };
      if (status) whereClause.status = status;

      const includeOptions = [];
      if (include_course_details === 'true') {
        includeOptions.push({
          model: Course,
          as: 'Course',
          attributes: ['id', 'title', 'thumbnail', 'level', 'duration', 'rating'],
          include: [{
            model: User,
            as: 'Instructor',
            attributes: ['id', 'name', 'avatar_url']
          }]
        });
      }

      const { count, rows: enrollments } = await CourseEnrollment.findAndCountAll({
        where: whereClause,
        include: includeOptions,
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: enrollments,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: limit
        }
      });
    } catch (error) {
      console.error('Error in getUserEnrollments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch enrollments',
        error: error.message
      });
    }
  }

  // Update enrollment progress
  async updateEnrollmentProgress(req, res) {
    try {
      const { course_id } = req.params;
      const { progress, status } = req.body;
      const userId = req.user.id;

      const enrollment = await CourseEnrollment.findOne({
        where: {
          user_id: userId,
          course_id
        }
      });

      if (!enrollment) {
        return res.status(404).json({
          success: false,
          message: 'Enrollment not found'
        });
      }

      const updateData = {};
      if (progress !== undefined) {
        updateData.progress = Math.max(0, Math.min(100, progress));
      }
      if (status) {
        updateData.status = status;
        if (status === 'in-progress' && !enrollment.start_date) {
          updateData.start_date = new Date();
        }
        if (status === 'completed') {
          updateData.completion_date = new Date();
          updateData.progress = 100;
        }
      }

      await enrollment.update(updateData);

      res.status(200).json({
        success: true,
        message: 'Enrollment progress updated',
        data: enrollment
      });
    } catch (error) {
      console.error('Error in updateEnrollmentProgress:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update progress'
      });
    }
  }

  // Unenroll from a course
  async unenrollFromCourse(req, res) {
    try {
      const { course_id } = req.params;
      const userId = req.user.id;

      const enrollment = await CourseEnrollment.findOne({
        where: {
          user_id: userId,
          course_id
        }
      });

      if (!enrollment) {
        return res.status(404).json({
          success: false,
          message: 'Enrollment not found'
        });
      }

      await enrollment.destroy();

      // Update course student count
      await Course.decrement('students', { where: { id: course_id } });

      res.status(200).json({
        success: true,
        message: 'Successfully unenrolled from course'
      });
    } catch (error) {
      console.error('Error in unenrollFromCourse:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unenroll from course',
        error: error.message
      });
    }
  }

  // ==================== REVIEW MANAGEMENT ====================

  // Create or update a course review
  async createOrUpdateReview(req, res) {
    try {
      const { course_id } = req.params;
      const { rating, comment } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating is required and must be between 1 and 5'
        });
      }

      // Check if user is enrolled in the course
      const enrollment = await CourseEnrollment.findOne({
        where: {
          user_id: userId,
          course_id
        }
      });

      if (!enrollment) {
        return res.status(403).json({
          success: false,
          message: 'You must be enrolled in the course to leave a review'
        });
      }

      const reviewData = {
        course_id,
        user_id: userId,
        rating,
        comment,
        verified: enrollment.status === 'completed'
      };

      // Try to find existing review and update, or create new one
      const [review, created] = await CourseReview.upsert(reviewData, {
        returning: true
      });

      // Update course rating
      const { average_rating } = await CourseReview.getAverageRating(course_id);
      await Course.update({ rating: average_rating }, { where: { id: course_id } });

      res.status(created ? 201 : 200).json({
        success: true,
        message: created ? 'Review created successfully' : 'Review updated successfully',
        data: review
      });
    } catch (error) {
      console.error('Error in createOrUpdateReview:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create/update review'
      });
    }
  }

  // Get course reviews with pagination
  async getCourseReviews(req, res) {
    try {
      const { course_id } = req.params;
      const { rating_filter, verified_only } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const whereClause = { course_id };
      if (rating_filter) whereClause.rating = rating_filter;
      if (verified_only === 'true') whereClause.verified = true;

      const { count, rows: reviews } = await CourseReview.findAndCountAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'User',
          attributes: ['id', 'name', 'avatar_url']
        }],
        limit,
        offset,
        order: [['helpful', 'DESC'], ['created_at', 'DESC']]
      });

      const ratingStats = await CourseReview.getAverageRating(course_id);

      res.status(200).json({
        success: true,
        data: {
          reviews,
          ...ratingStats
        },
        pagination: {
          current_page: page,
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: limit
        }
      });
    } catch (error) {
      console.error('Error in getCourseReviews:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course reviews',
        error: error.message
      });
    }
  }

  // Mark review as helpful/not helpful
  async markReviewHelpful(req, res) {
    try {
      const { review_id } = req.params;
      const { helpful } = req.body;

      if (typeof helpful !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'helpful field is required and must be boolean'
        });
      }

      const review = await CourseReview.findByPk(review_id);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      const updateField = helpful ? 'helpful' : 'not_helpful';
      await review.increment(updateField, { by: 1 });

      res.status(200).json({
        success: true,
        message: `Review marked as ${helpful ? 'helpful' : 'not helpful'}`,
        data: {
          helpful: review.helpful + (helpful ? 1 : 0),
          not_helpful: review.not_helpful + (!helpful ? 1 : 0)
        }
      });
    } catch (error) {
      console.error('Error in markReviewHelpful:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to mark review'
      });
    }
  }

  // Delete user's own review
  async deleteReview(req, res) {
    try {
      const { course_id } = req.params;
      const userId = req.user.id;

      const review = await CourseReview.findOne({
        where: {
          course_id,
          user_id: userId
        }
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      await review.destroy();

      // Update course rating
      const { average_rating } = await CourseReview.getAverageRating(course_id);
      await Course.update({ rating: average_rating }, { where: { id: course_id } });

      res.status(200).json({
        success: true,
        message: 'Review deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteReview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete review',
        error: error.message
      });
    }
  }

  // ==================== ANALYTICS AND DASHBOARD ====================

  // Get course structure with progress
  async getCourseStructureWithProgress(req, res) {
    try {
      const { course_id } = req.params;
      const userId = req.user?.id; // Optional for anonymous users

      const structure = await courseContentService.getCourseStructureWithProgress(course_id, userId);

      res.status(200).json({
        success: true,
        data: structure
      });
    } catch (error) {
      console.error('Error getting course structure:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get course structure'
      });
    }
  }

  // Calculate course progress
  async calculateCourseProgress(req, res) {
    try {
      const { course_id } = req.params;
      const userId = req.user.id;
      const { completed_lessons = [] } = req.body;

      const progress = await courseContentService.calculateCourseProgress(userId, course_id, completed_lessons);

      res.status(200).json({
        success: true,
        data: progress
      });
    } catch (error) {
      console.error('Error calculating progress:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate progress'
      });
    }
  }

  // Get user learning dashboard
  async getLearningDashboard(req, res) {
    try {
      const userId = req.user.id;

      const dashboard = await courseContentService.getUserLearningDashboard(userId);

      res.status(200).json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      console.error('Error getting learning dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get learning dashboard'
      });
    }
  }

  // Get course enrollment statistics (for instructors/admins)
  async getCourseEnrollmentStats(req, res) {
    try {
      const { course_id } = req.params;
      const userRole = req.user.role;
      const userId = req.user.id;

      // Check if user has access to these stats
      if (userRole !== 'admin') {
        const course = await Course.findByPk(course_id);
        if (!course || course.instructor_id !== userId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You can only view stats for your own courses.'
          });
        }
      }

      const stats = await courseContentService.getCourseEnrollmentStats(course_id);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting enrollment stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get enrollment statistics'
      });
    }
  }

  // Get course review analytics
  async getCourseReviewAnalytics(req, res) {
    try {
      const { course_id } = req.params;
      const userRole = req.user.role;
      const userId = req.user.id;

      // Check if user has access to these analytics
      if (userRole !== 'admin') {
        const course = await Course.findByPk(course_id);
        if (!course || course.instructor_id !== userId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You can only view analytics for your own courses.'
          });
        }
      }

      const analytics = await courseContentService.getCourseReviewAnalytics(course_id);

      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error getting review analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get review analytics'
      });
    }
  }

  // Validate course structure
  async validateCourseStructure(req, res) {
    try {
      const { course_id } = req.params;
      const userRole = req.user.role;
      const userId = req.user.id;

      // Check if user has access to validate this course
      if (userRole !== 'admin') {
        const course = await Course.findByPk(course_id);
        if (!course || course.instructor_id !== userId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You can only validate your own courses.'
          });
        }
      }

      const validation = await courseContentService.validateCourseStructure(course_id);

      res.status(200).json({
        success: true,
        data: validation
      });
    } catch (error) {
      console.error('Error validating course structure:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate course structure'
      });
    }
  }
}

module.exports = new CourseContentController();
