const Course = require('../models/Course');
const CourseEnrollment = require('../models/CourseEnrollment');
const CourseReview = require('../models/CourseReview');
const CourseModule = require('../models/CourseModule');
const CourseLesson = require('../models/CourseLesson');
const User = require('../models/User');
const CourseCategory = require('../models/CourseCategory');
const { Op } = require('sequelize');

class CourseReportController {
  constructor() {
    // Bind methods to preserve 'this' context
    this.generateReport = this.generateReport.bind(this);
    this.getReportTypes = this.getReportTypes.bind(this);
  }

  /**
   * Generate comprehensive course report
   * GET /api/admin/courses/reports/generate?type=performance&range=30d&format=json
   */
  async generateReport(req, res) {
    try {
      const { 
        type = 'comprehensive',
        range = '30d',
        format = 'json',
        startDate: startDateParam,
        endDate: endDateParam,
        filters = {}
      } = req.query;

      const now = new Date();
      let startDate;
      let endDate = now;

      // Calculate date range
      if (startDateParam && endDateParam) {
        startDate = new Date(startDateParam);
        endDate = new Date(endDateParam);
      } else {
        switch (range) {
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case '1y':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
      }

      let reportData = {};

      switch (type) {
        case 'performance':
          reportData = await this.generatePerformanceReport(startDate, endDate, filters);
          break;
        case 'enrollment':
          reportData = await this.generateEnrollmentReport(startDate, endDate, filters);
          break;
        case 'revenue':
          reportData = await this.generateRevenueReport(startDate, endDate, filters);
          break;
        case 'reviews':
          reportData = await this.generateReviewsReport(startDate, endDate, filters);
          break;
        case 'comprehensive':
        default:
          reportData = await this.generateComprehensiveReport(startDate, endDate, filters);
          break;
      }

      // Add metadata
      reportData.metadata = {
        reportType: type,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        generatedAt: new Date().toISOString(),
        generatedBy: req.user?.id || null
      };

      if (format === 'csv') {
        const csv = this.convertToCSV(reportData, type);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=course-report-${type}-${Date.now()}.csv`);
        res.status(200).send(csv);
      } else {
        res.status(200).json({
          success: true,
          data: reportData
        });
      }
    } catch (error) {
      console.error('Error in generateReport:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate report',
        error: error.message
      });
    }
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(startDate, endDate, filters) {
    const whereClause = {
      created_at: { [Op.between]: [startDate, endDate] }
    };

    if (filters.status) whereClause.status = filters.status;
    if (filters.level) whereClause.level = filters.level;
    if (filters.category_id) whereClause.category_id = filters.category_id;
    if (filters.instructor_id) whereClause.instructor_id = filters.instructor_id;

    // Course performance summary
    const totalCourses = await Course.count({ where: whereClause });
    const publishedCourses = await Course.count({
      where: {
        ...whereClause,
        status: 'published'
      }
    });

    // Top performing courses by enrollments
    const topCoursesByEnrollments = await CourseEnrollment.findAll({
      attributes: [
        'course_id',
        [CourseEnrollment.sequelize.fn('COUNT', '*'), 'enrollmentCount'],
        [CourseEnrollment.sequelize.fn('SUM', CourseEnrollment.sequelize.literal("CASE WHEN `CourseEnrollment`.`status` = 'completed' THEN 1 ELSE 0 END")), 'completedCount']
      ],
      include: [{
        model: Course,
        as: 'Course',
        attributes: ['id', 'title', 'rating', 'students', 'level', 'status'],
        required: true,
        where: whereClause
      }],
      group: ['CourseEnrollment.course_id', 'Course.id'],
      order: [[CourseEnrollment.sequelize.fn('COUNT', '*'), 'DESC']],
      limit: 20,
      raw: false
    });

    // Top performing courses by rating
    const topCoursesByRating = await Course.findAll({
      where: {
        ...whereClause,
        rating: { [Op.gt]: 0 }
      },
      include: [{
        model: User,
        as: 'Instructor',
        attributes: ['id', 'name', 'email'],
        required: false
      }, {
        model: CourseCategory,
        as: 'Category',
        attributes: ['id', 'name'],
        required: false
      }],
      order: [['rating', 'DESC'], ['students', 'DESC']],
      limit: 20
    });

    // Course completion rates
    const courseCompletions = await CourseEnrollment.findAll({
      attributes: [
        'course_id',
        [CourseEnrollment.sequelize.fn('COUNT', '*'), 'totalEnrollments'],
        [CourseEnrollment.sequelize.fn('SUM', CourseEnrollment.sequelize.literal("CASE WHEN `CourseEnrollment`.`status` = 'completed' THEN 1 ELSE 0 END")), 'completedEnrollments']
      ],
      include: [{
        model: Course,
        as: 'Course',
        attributes: ['id', 'title'],
        required: true,
        where: whereClause
      }],
      group: ['CourseEnrollment.course_id', 'Course.id'],
      order: [[CourseEnrollment.sequelize.fn('SUM', CourseEnrollment.sequelize.literal("CASE WHEN `CourseEnrollment`.`status` = 'completed' THEN 1 ELSE 0 END")), 'DESC']],
      limit: 20,
      raw: false
    });

    return {
      summary: {
        totalCourses,
        publishedCourses,
        draftCourses: totalCourses - publishedCourses
      },
      topCoursesByEnrollments: topCoursesByEnrollments.map(item => {
        const total = parseInt(item.dataValues?.enrollmentCount || item.enrollmentCount) || 0;
        const completed = parseInt(item.dataValues?.completedCount || item.completedCount) || 0;
        return {
          courseId: item.course_id,
          courseTitle: item.Course?.title || 'Unknown',
          rating: item.Course?.rating || 0,
          students: item.Course?.students || 0,
          level: item.Course?.level || 'Beginner',
          status: item.Course?.status || 'draft',
          enrollmentCount: total,
          completedCount: completed,
          completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0
        };
      }),
      topCoursesByRating: topCoursesByRating.map(course => ({
        courseId: course.id,
        courseTitle: course.title,
        rating: course.rating,
        students: course.students,
        level: course.level,
        status: course.status,
        instructorName: course.Instructor?.name || 'Unknown',
        categoryName: course.Category?.name || 'Unknown'
      })),
      courseCompletions: courseCompletions.map(item => {
        const total = parseInt(item.dataValues?.totalEnrollments || item.totalEnrollments) || 0;
        const completed = parseInt(item.dataValues?.completedEnrollments || item.completedEnrollments) || 0;
        return {
          courseId: item.course_id,
          courseTitle: item.Course?.title || 'Unknown',
          totalEnrollments: total,
          completedEnrollments: completed,
          completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0
        };
      })
    };
  }

  /**
   * Generate enrollment report
   */
  async generateEnrollmentReport(startDate, endDate, filters) {
    const whereClause = {
      created_at: { [Op.between]: [startDate, endDate] }
    };

    if (filters.status) whereClause.status = filters.status;
    if (filters.enrollment_type) whereClause.enrollment_type = filters.enrollment_type;

    // Enrollment summary
    const totalEnrollments = await CourseEnrollment.count({ where: whereClause });
    const completedEnrollments = await CourseEnrollment.count({
      where: {
        ...whereClause,
        status: 'completed'
      }
    });

    // Enrollments by course
    const enrollmentsByCourse = await CourseEnrollment.findAll({
      attributes: [
        'course_id',
        [CourseEnrollment.sequelize.fn('COUNT', '*'), 'enrollmentCount'],
        [CourseEnrollment.sequelize.fn('SUM', CourseEnrollment.sequelize.literal("CASE WHEN `CourseEnrollment`.`status` = 'completed' THEN 1 ELSE 0 END")), 'completedCount']
      ],
      include: [{
        model: Course,
        as: 'Course',
        attributes: ['id', 'title', 'level', 'status'],
        required: true
      }],
      where: whereClause,
      group: ['CourseEnrollment.course_id', 'Course.id'],
      order: [[CourseEnrollment.sequelize.fn('COUNT', '*'), 'DESC']],
      limit: 50,
      raw: false
    });

    // Enrollments by type
    const enrollmentsByType = await CourseEnrollment.findAll({
      attributes: [
        'enrollment_type',
        [CourseEnrollment.sequelize.fn('COUNT', '*'), 'count']
      ],
      where: whereClause,
      group: ['enrollment_type'],
      raw: true
    });

    // Daily enrollment trends
    const dailyEnrollments = await CourseEnrollment.findAll({
      attributes: [
        [CourseEnrollment.sequelize.fn('DATE', CourseEnrollment.sequelize.col('created_at')), 'date'],
        [CourseEnrollment.sequelize.fn('COUNT', '*'), 'count']
      ],
      where: whereClause,
      group: [CourseEnrollment.sequelize.fn('DATE', CourseEnrollment.sequelize.col('created_at'))],
      order: [[CourseEnrollment.sequelize.fn('DATE', CourseEnrollment.sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    // Enrollments by level
    const enrollmentsByLevel = await CourseEnrollment.findAll({
      attributes: [
        [CourseEnrollment.sequelize.literal('`Course`.`level`'), 'level'],
        [CourseEnrollment.sequelize.fn('COUNT', '*'), 'count']
      ],
      include: [{
        model: Course,
        as: 'Course',
        attributes: [],
        required: true
      }],
      where: whereClause,
      group: [CourseEnrollment.sequelize.literal('`Course`.`level`')],
      raw: true
    });

    return {
      summary: {
        totalEnrollments,
        completedEnrollments,
        inProgressEnrollments: totalEnrollments - completedEnrollments,
        completionRate: totalEnrollments > 0 ? ((completedEnrollments / totalEnrollments) * 100).toFixed(2) : 0
      },
      byCourse: enrollmentsByCourse.map(item => {
        const total = parseInt(item.dataValues?.enrollmentCount || item.enrollmentCount) || 0;
        const completed = parseInt(item.dataValues?.completedCount || item.completedCount) || 0;
        return {
          courseId: item.course_id,
          courseTitle: item.Course?.title || 'Unknown',
          level: item.Course?.level || 'Beginner',
          status: item.Course?.status || 'draft',
          enrollmentCount: total,
          completedCount: completed,
          completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0
        };
      }),
      byType: enrollmentsByType.map(item => ({
        type: item.enrollment_type || 'free',
        count: parseInt(item.count) || 0
      })),
      byLevel: enrollmentsByLevel.map(item => ({
        level: item.level || 'Unknown',
        count: parseInt(item.count) || 0
      })),
      dailyTrends: dailyEnrollments.map(item => ({
        date: item.date,
        count: parseInt(item.count) || 0
      }))
    };
  }

  /**
   * Generate revenue report
   */
  async generateRevenueReport(startDate, endDate, filters) {
    const whereClause = {
      created_at: { [Op.between]: [startDate, endDate] }
    };

    if (filters.enrollment_type) whereClause.enrollment_type = filters.enrollment_type;

    // Revenue from paid enrollments
    const paidEnrollments = await CourseEnrollment.findAll({
      attributes: [
        'course_id',
        [CourseEnrollment.sequelize.fn('COUNT', '*'), 'enrollmentCount']
      ],
      include: [{
        model: Course,
        as: 'Course',
        attributes: ['id', 'title', 'price', 'instructor_id'],
        required: true
      }],
      where: {
        ...whereClause,
        enrollment_type: 'paid'
      },
      group: ['CourseEnrollment.course_id', 'Course.id'],
      raw: false
    });

    // Calculate total revenue
    let totalRevenue = 0;
    const revenueByCourse = paidEnrollments.map(item => {
      const count = parseInt(item.dataValues?.enrollmentCount || item.enrollmentCount) || 0;
      const price = parseFloat(item.Course?.price || 0);
      const revenue = count * price;
      totalRevenue += revenue;
      return {
        courseId: item.course_id,
        courseTitle: item.Course?.title || 'Unknown',
        price: price,
        enrollmentCount: count,
        revenue: revenue
      };
    });

    // Revenue by instructor
    const revenueByInstructorData = await CourseEnrollment.findAll({
      attributes: [
        [CourseEnrollment.sequelize.literal('`Course`.`instructor_id`'), 'instructorId'],
        [CourseEnrollment.sequelize.fn('COUNT', '*'), 'enrollmentCount'],
        [CourseEnrollment.sequelize.fn('SUM', CourseEnrollment.sequelize.literal('CAST(`Course`.`price` AS DECIMAL(10,2))')), 'totalRevenue']
      ],
      include: [{
        model: Course,
        as: 'Course',
        attributes: ['instructor_id'],
        required: true
      }],
      where: {
        ...whereClause,
        enrollment_type: 'paid'
      },
      group: [CourseEnrollment.sequelize.literal('`Course`.`instructor_id`')],
      order: [[CourseEnrollment.sequelize.fn('SUM', CourseEnrollment.sequelize.literal('CAST(`Course`.`price` AS DECIMAL(10,2))')), 'DESC']],
      limit: 20,
      raw: true
    });

    // Get instructor details
    const instructorIds = revenueByInstructorData.map(item => item.instructorId).filter(Boolean);
    const instructors = await User.findAll({
      where: { id: { [Op.in]: instructorIds } },
      attributes: ['id', 'name', 'email']
    });
    const instructorMap = new Map(instructors.map(inst => [inst.id, inst]));

    const revenueByInstructor = revenueByInstructorData.map(item => ({
      instructorId: item.instructorId,
      instructorName: instructorMap.get(item.instructorId)?.name || 'Unknown',
      enrollmentCount: parseInt(item.enrollmentCount) || 0,
      totalRevenue: parseFloat(item.totalRevenue) || 0
    }));

    // Daily revenue trends
    const dailyRevenue = await CourseEnrollment.findAll({
      attributes: [
        [CourseEnrollment.sequelize.fn('DATE', CourseEnrollment.sequelize.col('created_at')), 'date'],
        [CourseEnrollment.sequelize.fn('COUNT', '*'), 'enrollmentCount'],
        [CourseEnrollment.sequelize.fn('SUM', CourseEnrollment.sequelize.literal('CAST(`Course`.`price` AS DECIMAL(10,2))')), 'dailyRevenue']
      ],
      include: [{
        model: Course,
        as: 'Course',
        attributes: [],
        required: true
      }],
      where: {
        ...whereClause,
        enrollment_type: 'paid'
      },
      group: [CourseEnrollment.sequelize.fn('DATE', CourseEnrollment.sequelize.col('created_at'))],
      order: [[CourseEnrollment.sequelize.fn('DATE', CourseEnrollment.sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    return {
      summary: {
        totalRevenue,
        totalPaidEnrollments: paidEnrollments.reduce((sum, item) => sum + (parseInt(item.dataValues?.enrollmentCount || item.enrollmentCount) || 0), 0),
        averageRevenuePerEnrollment: paidEnrollments.length > 0 ? (totalRevenue / paidEnrollments.reduce((sum, item) => sum + (parseInt(item.dataValues?.enrollmentCount || item.enrollmentCount) || 0), 0)).toFixed(2) : 0
      },
      revenueByCourse: revenueByCourse.sort((a, b) => b.revenue - a.revenue),
      revenueByInstructor: revenueByInstructor,
      dailyTrends: dailyRevenue.map(item => ({
        date: item.date,
        enrollmentCount: parseInt(item.enrollmentCount) || 0,
        revenue: parseFloat(item.dailyRevenue) || 0
      }))
    };
  }

  /**
   * Generate reviews report
   */
  async generateReviewsReport(startDate, endDate, filters) {
    const whereClause = {
      created_at: { [Op.between]: [startDate, endDate] }
    };

    if (filters.verified !== undefined) whereClause.verified = filters.verified === 'true';

    // Reviews summary
    const totalReviews = await CourseReview.count({ where: whereClause });
    const verifiedReviews = await CourseReview.count({
      where: {
        ...whereClause,
        verified: true
      }
    });

    // Average rating
    const ratingStats = await CourseReview.findOne({
      attributes: [
        [CourseReview.sequelize.fn('AVG', CourseReview.sequelize.col('rating')), 'averageRating'],
        [CourseReview.sequelize.fn('COUNT', '*'), 'reviewCount']
      ],
      where: whereClause,
      raw: true
    });

    // Reviews by course
    const reviewsByCourse = await CourseReview.findAll({
      attributes: [
        'course_id',
        [CourseReview.sequelize.fn('COUNT', '*'), 'reviewCount'],
        [CourseReview.sequelize.fn('AVG', CourseReview.sequelize.col('rating')), 'averageRating']
      ],
      include: [{
        model: Course,
        as: 'Course',
        attributes: ['id', 'title', 'rating', 'students'],
        required: true
      }],
      where: whereClause,
      group: ['CourseReview.course_id', 'Course.id'],
      order: [[CourseReview.sequelize.fn('COUNT', '*'), 'DESC']],
      limit: 30,
      raw: false
    });

    // Reviews by rating
    const reviewsByRating = await CourseReview.findAll({
      attributes: [
        'rating',
        [CourseReview.sequelize.fn('COUNT', '*'), 'count']
      ],
      where: whereClause,
      group: ['rating'],
      order: [['rating', 'DESC']],
      raw: true
    });

    // Daily review trends
    const dailyReviews = await CourseReview.findAll({
      attributes: [
        [CourseReview.sequelize.fn('DATE', CourseReview.sequelize.col('created_at')), 'date'],
        [CourseReview.sequelize.fn('COUNT', '*'), 'count'],
        [CourseReview.sequelize.fn('AVG', CourseReview.sequelize.col('rating')), 'averageRating']
      ],
      where: whereClause,
      group: [CourseReview.sequelize.fn('DATE', CourseReview.sequelize.col('created_at'))],
      order: [[CourseReview.sequelize.fn('DATE', CourseReview.sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    return {
      summary: {
        totalReviews,
        verifiedReviews,
        unverifiedReviews: totalReviews - verifiedReviews,
        averageRating: parseFloat(ratingStats?.averageRating || 0).toFixed(2),
        reviewCount: parseInt(ratingStats?.reviewCount || 0)
      },
      byCourse: reviewsByCourse.map(item => ({
        courseId: item.course_id,
        courseTitle: item.Course?.title || 'Unknown',
        courseRating: item.Course?.rating || 0,
        students: item.Course?.students || 0,
        reviewCount: parseInt(item.dataValues?.reviewCount || item.reviewCount) || 0,
        averageRating: parseFloat(item.dataValues?.averageRating || item.averageRating || 0).toFixed(2)
      })),
      byRating: reviewsByRating.map(item => ({
        rating: item.rating || 0,
        count: parseInt(item.count) || 0
      })),
      dailyTrends: dailyReviews.map(item => ({
        date: item.date,
        count: parseInt(item.count) || 0,
        averageRating: parseFloat(item.averageRating || 0).toFixed(2)
      }))
    };
  }

  /**
   * Generate comprehensive report
   */
  async generateComprehensiveReport(startDate, endDate, filters) {
    const [performance, enrollment, revenue, reviews] = await Promise.all([
      this.generatePerformanceReport(startDate, endDate, filters),
      this.generateEnrollmentReport(startDate, endDate, filters),
      this.generateRevenueReport(startDate, endDate, filters),
      this.generateReviewsReport(startDate, endDate, filters)
    ]);

    return {
      performance,
      enrollment,
      revenue,
      reviews,
      summary: {
        totalCourses: performance.summary.totalCourses,
        totalEnrollments: enrollment.summary.totalEnrollments,
        totalRevenue: revenue.summary.totalRevenue,
        totalReviews: reviews.summary.totalReviews,
        averageRating: reviews.summary.averageRating
      }
    };
  }

  /**
   * Convert report data to CSV
   */
  convertToCSV(reportData, reportType) {
    const lines = [];
    
    // Add metadata as comments
    if (reportData.metadata) {
      lines.push(`# Report Type: ${reportData.metadata.reportType}`);
      lines.push(`# Generated At: ${reportData.metadata.generatedAt}`);
      lines.push(`# Date Range: ${reportData.metadata.dateRange.start} to ${reportData.metadata.dateRange.end}`);
      lines.push('');
    }

    switch (reportType) {
      case 'performance':
        // Performance summary
        lines.push('Performance Summary');
        lines.push('Metric,Value');
        lines.push(`Total Courses,${reportData.summary.totalCourses}`);
        lines.push(`Published Courses,${reportData.summary.publishedCourses}`);
        lines.push(`Draft Courses,${reportData.summary.draftCourses}`);
        lines.push('');
        
        // Top courses by enrollments
        lines.push('Top Courses by Enrollments');
        lines.push('Course ID,Course Title,Rating,Students,Level,Status,Enrollment Count,Completed Count,Completion Rate');
        if (reportData.topCoursesByEnrollments) {
          reportData.topCoursesByEnrollments.forEach(course => {
            lines.push(`${course.courseId},"${course.courseTitle}",${course.rating},${course.students},${course.level},${course.status},${course.enrollmentCount},${course.completedCount},${course.completionRate}%`);
          });
        }
        break;

      case 'enrollment':
        // Enrollment summary
        lines.push('Enrollment Summary');
        lines.push('Metric,Value');
        lines.push(`Total Enrollments,${reportData.summary.totalEnrollments}`);
        lines.push(`Completed Enrollments,${reportData.summary.completedEnrollments}`);
        lines.push(`In Progress Enrollments,${reportData.summary.inProgressEnrollments}`);
        lines.push(`Completion Rate,${reportData.summary.completionRate}%`);
        lines.push('');
        
        // By course
        lines.push('Enrollments by Course');
        lines.push('Course ID,Course Title,Level,Status,Enrollment Count,Completed Count,Completion Rate');
        if (reportData.byCourse) {
          reportData.byCourse.forEach(course => {
            lines.push(`${course.courseId},"${course.courseTitle}",${course.level},${course.status},${course.enrollmentCount},${course.completedCount},${course.completionRate}%`);
          });
        }
        break;

      case 'revenue':
        // Revenue summary
        lines.push('Revenue Summary');
        lines.push('Metric,Value');
        lines.push(`Total Revenue,${reportData.summary.totalRevenue}`);
        lines.push(`Total Paid Enrollments,${reportData.summary.totalPaidEnrollments}`);
        lines.push(`Average Revenue per Enrollment,${reportData.summary.averageRevenuePerEnrollment}`);
        lines.push('');
        
        // Revenue by course
        lines.push('Revenue by Course');
        lines.push('Course ID,Course Title,Price,Enrollment Count,Revenue');
        if (reportData.revenueByCourse) {
          reportData.revenueByCourse.forEach(course => {
            lines.push(`${course.courseId},"${course.courseTitle}",${course.price},${course.enrollmentCount},${course.revenue}`);
          });
        }
        break;

      case 'reviews':
        // Reviews summary
        lines.push('Reviews Summary');
        lines.push('Metric,Value');
        lines.push(`Total Reviews,${reportData.summary.totalReviews}`);
        lines.push(`Verified Reviews,${reportData.summary.verifiedReviews}`);
        lines.push(`Unverified Reviews,${reportData.summary.unverifiedReviews}`);
        lines.push(`Average Rating,${reportData.summary.averageRating}`);
        lines.push('');
        
        // Reviews by course
        lines.push('Reviews by Course');
        lines.push('Course ID,Course Title,Course Rating,Students,Review Count,Average Rating');
        if (reportData.byCourse) {
          reportData.byCourse.forEach(course => {
            lines.push(`${course.courseId},"${course.courseTitle}",${course.courseRating},${course.students},${course.reviewCount},${course.averageRating}`);
          });
        }
        break;

      case 'comprehensive':
      default:
        // Summary
        lines.push('Comprehensive Report Summary');
        lines.push('Metric,Value');
        if (reportData.summary) {
          Object.entries(reportData.summary).forEach(([key, value]) => {
            lines.push(`${key},${value}`);
          });
        }
        break;
    }

    return lines.join('\n');
  }

  /**
   * Get available report types
   * GET /api/admin/courses/reports/types
   */
  async getReportTypes(req, res) {
    try {
      const reportTypes = [
        {
          id: 'comprehensive',
          name: 'Comprehensive Report',
          description: 'Complete overview of all course metrics and performance'
        },
        {
          id: 'performance',
          name: 'Performance Report',
          description: 'Course performance metrics, top courses, and completion rates'
        },
        {
          id: 'enrollment',
          name: 'Enrollment Report',
          description: 'Course enrollment statistics and trends'
        },
        {
          id: 'revenue',
          name: 'Revenue Report',
          description: 'Revenue analysis by course and instructor'
        },
        {
          id: 'reviews',
          name: 'Reviews Report',
          description: 'Course reviews and ratings analysis'
        }
      ];

      res.status(200).json({
        success: true,
        data: reportTypes
      });
    } catch (error) {
      console.error('Error in getReportTypes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get report types',
        error: error.message
      });
    }
  }
}

module.exports = new CourseReportController();

