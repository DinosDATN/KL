const CourseModule = require('../models/CourseModule');
const CourseLesson = require('../models/CourseLesson');
const CourseEnrollment = require('../models/CourseEnrollment');
const CourseReview = require('../models/CourseReview');
const Course = require('../models/Course');
const User = require('../models/User');
const { Op } = require('sequelize');

class CourseContentService {
  /**
   * Calculate course progress for a user based on completed lessons
   * @param {number} userId - User ID
   * @param {number} courseId - Course ID
   * @param {Array} completedLessonIds - Array of completed lesson IDs
   * @returns {Object} Progress information
   */
  async calculateCourseProgress(userId, courseId, completedLessonIds = []) {
    try {
      // Get all lessons for the course
      const lessons = await CourseLesson.findAll({
        include: [{
          model: CourseModule,
          as: 'Module',
          where: { course_id: courseId },
          attributes: ['id', 'title', 'position']
        }],
        order: [['Module', 'position', 'ASC'], ['position', 'ASC']]
      });

      const totalLessons = lessons.length;
      const completedLessons = completedLessonIds.length;
      const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      // Calculate total duration
      const totalDuration = lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
      const completedDuration = lessons
        .filter(lesson => completedLessonIds.includes(lesson.id))
        .reduce((sum, lesson) => sum + (lesson.duration || 0), 0);

      return {
        totalLessons,
        completedLessons,
        progressPercentage,
        totalDuration,
        completedDuration,
        nextLesson: this.findNextLesson(lessons, completedLessonIds)
      };
    } catch (error) {
      throw new Error(`Failed to calculate course progress: ${error.message}`);
    }
  }

  /**
   * Find the next lesson to complete
   * @param {Array} lessons - All course lessons
   * @param {Array} completedLessonIds - Completed lesson IDs
   * @returns {Object|null} Next lesson or null
   */
  findNextLesson(lessons, completedLessonIds) {
    const nextLesson = lessons.find(lesson => !completedLessonIds.includes(lesson.id));
    return nextLesson ? {
      id: nextLesson.id,
      title: nextLesson.title,
      type: nextLesson.type,
      module: nextLesson.Module?.title
    } : null;
  }

  /**
   * Get course structure with progress information
   * @param {number} courseId - Course ID
   * @param {number} userId - User ID (optional)
   * @returns {Object} Course structure with progress
   */
  async getCourseStructureWithProgress(courseId, userId = null) {
    try {
      const modules = await CourseModule.findAll({
        where: { course_id: courseId },
        include: [{
          model: CourseLesson,
          as: 'Lessons',
          required: false,
          order: [['position', 'ASC']]
        }],
        order: [['position', 'ASC']]
      });

      let completedLessonIds = [];
      if (userId) {
        // In a real implementation, you would fetch lesson completion data
        // For now, we'll assume you have a lesson completion tracking system
        completedLessonIds = await this.getUserCompletedLessons(userId, courseId);
      }

      const structuredModules = modules.map(module => ({
        id: module.id,
        title: module.title,
        position: module.position,
        lessons: module.Lessons.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          type: lesson.type,
          duration: lesson.duration,
          position: lesson.position,
          completed: completedLessonIds.includes(lesson.id)
        })),
        completedLessons: module.Lessons.filter(lesson => completedLessonIds.includes(lesson.id)).length,
        totalLessons: module.Lessons.length
      }));

      return {
        modules: structuredModules,
        totalModules: modules.length,
        totalLessons: modules.reduce((sum, module) => sum + module.Lessons.length, 0),
        completedLessons: completedLessonIds.length
      };
    } catch (error) {
      throw new Error(`Failed to get course structure: ${error.message}`);
    }
  }

  /**
   * Get user's completed lessons for a course
   * @param {number} userId - User ID
   * @param {number} courseId - Course ID
   * @returns {Array} Array of completed lesson IDs
   */
  async getUserCompletedLessons(userId, courseId) {
    const CourseLessonCompletion = require('../models/CourseLessonCompletion');
    return await CourseLessonCompletion.getCompletedLessonIds(userId, courseId);
  }

  /**
   * Enroll user in course with validation
   * @param {number} userId - User ID
   * @param {number} courseId - Course ID
   * @param {Object} userInfo - User information for validation
   * @returns {Object} Enrollment result
   */
  async enrollUserInCourse(userId, courseId, userInfo) {
    try {
      // Find the course
      const course = await Course.findOne({
        where: {
          id: courseId,
          status: 'published',
          is_deleted: false
        }
      });

      if (!course) {
        throw new Error('Course not found or not available');
      }

      // Check if already enrolled
      const existingEnrollment = await CourseEnrollment.findOne({
        where: { user_id: userId, course_id: courseId }
      });

      if (existingEnrollment) {
        throw new Error('User already enrolled in this course');
      }

      // Check prerequisites (if any)
      await this.checkCoursePrerequisites(userId, course);

      // Check premium requirements
      if (course.is_premium && !userInfo.isPremium) {
        throw new Error('Premium membership required for this course');
      }

      // Create enrollment
      const enrollment = await CourseEnrollment.create({
        user_id: userId,
        course_id: courseId,
        progress: 0,
        status: 'not-started',
        start_date: new Date()
      });

      // Update course student count
      await Course.increment('students', { where: { id: courseId } });

      return {
        enrollment,
        course: {
          id: course.id,
          title: course.title,
          level: course.level
        }
      };
    } catch (error) {
      throw new Error(`Enrollment failed: ${error.message}`);
    }
  }

  /**
   * Check course prerequisites (placeholder implementation)
   * @param {number} userId - User ID
   * @param {Object} course - Course object
   */
  async checkCoursePrerequisites(userId, course) {
    // TODO: Implement prerequisite checking
    // This would check if user has completed required prerequisite courses
    return true;
  }

  /**
   * Get enrollment statistics for a course
   * @param {number} courseId - Course ID
   * @returns {Object} Enrollment statistics
   */
  async getCourseEnrollmentStats(courseId) {
    try {
      const totalEnrollments = await CourseEnrollment.count({
        where: { course_id: courseId }
      });

      const enrollmentsByStatus = await CourseEnrollment.findAll({
        where: { course_id: courseId },
        attributes: [
          'status',
          [CourseEnrollment.sequelize.fn('COUNT', '*'), 'count']
        ],
        group: ['status']
      });

      const avgProgress = await CourseEnrollment.findOne({
        where: { course_id: courseId },
        attributes: [
          [CourseEnrollment.sequelize.fn('AVG', CourseEnrollment.sequelize.col('progress')), 'avg_progress']
        ]
      });

      const completionRate = await CourseEnrollment.count({
        where: {
          course_id: courseId,
          status: 'completed'
        }
      });

      return {
        totalEnrollments,
        completionRate: totalEnrollments > 0 ? Math.round((completionRate / totalEnrollments) * 100) : 0,
        averageProgress: parseFloat(avgProgress?.getDataValue('avg_progress') || 0),
        statusBreakdown: enrollmentsByStatus.map(item => ({
          status: item.status,
          count: parseInt(item.getDataValue('count'))
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get enrollment stats: ${error.message}`);
    }
  }

  /**
   * Get user's learning dashboard data
   * @param {number} userId - User ID
   * @returns {Object} Dashboard data
   */
  async getUserLearningDashboard(userId) {
    try {
      // Get all enrollments with course details
      const enrollments = await CourseEnrollment.findAll({
        where: { user_id: userId },
        include: [{
          model: Course,
          as: 'Course',
          attributes: ['id', 'title', 'thumbnail', 'level', 'duration', 'rating'],
          include: [{
            model: User,
            as: 'Instructor',
            attributes: ['id', 'name', 'avatar_url']
          }]
        }],
        order: [['updated_at', 'DESC']]
      });

      // Calculate statistics
      const totalCourses = enrollments.length;
      const completedCourses = enrollments.filter(e => e.status === 'completed').length;
      const inProgressCourses = enrollments.filter(e => e.status === 'in-progress').length;
      const averageProgress = totalCourses > 0 
        ? enrollments.reduce((sum, e) => sum + e.progress, 0) / totalCourses 
        : 0;

      // Get recent activity (courses updated in last 7 days)
      const recentActivity = enrollments.filter(e => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return new Date(e.updated_at) > oneWeekAgo;
      });

      // Get recommended next steps
      const nextSteps = enrollments
        .filter(e => e.status === 'in-progress')
        .slice(0, 3)
        .map(enrollment => ({
          courseId: enrollment.course_id,
          courseTitle: enrollment.Course.title,
          progress: enrollment.progress,
          thumbnail: enrollment.Course.thumbnail
        }));

      return {
        summary: {
          totalCourses,
          completedCourses,
          inProgressCourses,
          averageProgress: Math.round(averageProgress)
        },
        recentActivity: recentActivity.map(enrollment => ({
          courseId: enrollment.course_id,
          courseTitle: enrollment.Course.title,
          progress: enrollment.progress,
          status: enrollment.status,
          lastActivity: enrollment.updated_at
        })),
        nextSteps,
        enrollments: enrollments.map(enrollment => ({
          id: enrollment.id,
          course: enrollment.Course,
          progress: enrollment.progress,
          status: enrollment.status,
          startDate: enrollment.start_date,
          completionDate: enrollment.completion_date
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get learning dashboard: ${error.message}`);
    }
  }

  /**
   * Get course review analytics
   * @param {number} courseId - Course ID
   * @returns {Object} Review analytics
   */
  async getCourseReviewAnalytics(courseId) {
    try {
      const reviews = await CourseReview.findAll({
        where: { course_id: courseId },
        attributes: ['rating', 'verified', 'helpful', 'not_helpful']
      });

      if (reviews.length === 0) {
        return {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: {},
          verifiedReviews: 0,
          helpfulnessRatio: 0
        };
      }

      const totalReviews = reviews.length;
      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
      const verifiedReviews = reviews.filter(review => review.verified).length;

      // Rating distribution
      const ratingDistribution = {};
      for (let i = 1; i <= 5; i++) {
        ratingDistribution[i] = reviews.filter(review => review.rating === i).length;
      }

      // Helpfulness ratio
      const totalHelpfulVotes = reviews.reduce((sum, review) => sum + review.helpful + review.not_helpful, 0);
      const totalHelpful = reviews.reduce((sum, review) => sum + review.helpful, 0);
      const helpfulnessRatio = totalHelpfulVotes > 0 ? (totalHelpful / totalHelpfulVotes) * 100 : 0;

      return {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        verifiedReviews,
        verifiedPercentage: Math.round((verifiedReviews / totalReviews) * 100),
        helpfulnessRatio: Math.round(helpfulnessRatio)
      };
    } catch (error) {
      throw new Error(`Failed to get review analytics: ${error.message}`);
    }
  }

  /**
   * Validate course content structure
   * @param {number} courseId - Course ID
   * @returns {Object} Validation result
   */
  async validateCourseStructure(courseId) {
    try {
      const issues = [];

      // Check if course has modules
      const moduleCount = await CourseModule.count({
        where: { course_id: courseId }
      });

      if (moduleCount === 0) {
        issues.push({ type: 'warning', message: 'Course has no modules' });
      }

      // Check if modules have lessons
      const modulesWithoutLessons = await CourseModule.findAll({
        where: { course_id: courseId },
        include: [{
          model: CourseLesson,
          as: 'Lessons',
          required: false
        }]
      });

      const emptyModules = modulesWithoutLessons.filter(module => module.Lessons.length === 0);
      if (emptyModules.length > 0) {
        issues.push({
          type: 'warning',
          message: `${emptyModules.length} module(s) have no lessons`,
          details: emptyModules.map(module => module.title)
        });
      }

      // Check for lessons without content
      const lessonsWithoutContent = await CourseLesson.count({
        include: [{
          model: CourseModule,
          as: 'Module',
          where: { course_id: courseId }
        }],
        where: {
          [Op.or]: [
            { content: null },
            { content: '' }
          ]
        }
      });

      if (lessonsWithoutContent > 0) {
        issues.push({
          type: 'warning',
          message: `${lessonsWithoutContent} lesson(s) have no content`
        });
      }

      // Calculate total duration
      const totalDuration = await CourseLesson.sum('duration', {
        include: [{
          model: CourseModule,
          as: 'Module',
          where: { course_id: courseId }
        }]
      });

      return {
        valid: issues.filter(issue => issue.type === 'error').length === 0,
        issues,
        statistics: {
          totalModules: moduleCount,
          totalLessons: await CourseLesson.count({
            include: [{
              model: CourseModule,
              as: 'Module',
              where: { course_id: courseId }
            }]
          }),
          totalDuration: totalDuration || 0,
          emptyModules: emptyModules.length,
          lessonsWithoutContent
        }
      };
    } catch (error) {
      throw new Error(`Failed to validate course structure: ${error.message}`);
    }
  }
}

module.exports = new CourseContentService();