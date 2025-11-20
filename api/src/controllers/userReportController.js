const User = require('../models/User');
const CourseEnrollment = require('../models/CourseEnrollment');
const Submission = require('../models/Submission');
const ContestSubmission = require('../models/ContestSubmission');
const Course = require('../models/Course');
const Problem = require('../models/Problem');
const UserProfile = require('../models/UserProfile');
const UserStats = require('../models/UserStats');
const { Op } = require('sequelize');

class UserReportController {
  constructor() {
    // Bind methods to preserve 'this' context
    this.generateReport = this.generateReport.bind(this);
    this.getReportTypes = this.getReportTypes.bind(this);
  }

  /**
   * Generate comprehensive user report
   * GET /api/admin/users/reports/generate?type=activity&range=30d&format=json
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
        case 'activity':
          reportData = await this.generateActivityReport(startDate, endDate, filters);
          break;
        case 'registration':
          reportData = await this.generateRegistrationReport(startDate, endDate, filters);
          break;
        case 'engagement':
          reportData = await this.generateEngagementReport(startDate, endDate, filters);
          break;
        case 'performance':
          reportData = await this.generatePerformanceReport(startDate, endDate, filters);
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
        res.setHeader('Content-Disposition', `attachment; filename=user-report-${type}-${Date.now()}.csv`);
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
   * Generate activity report
   */
  async generateActivityReport(startDate, endDate, filters) {
    const whereClause = {
      created_at: { [Op.between]: [startDate, endDate] }
    };

    if (filters.role) whereClause.role = filters.role;
    if (filters.is_active !== undefined) whereClause.is_active = filters.is_active === 'true';

    // User activity summary
    const totalUsers = await User.count({ where: whereClause });
    const activeUsers = await User.count({
      where: {
        ...whereClause,
        last_seen_at: { [Op.gte]: startDate }
      }
    });

    // Activity breakdown by day
    const dailyActivity = await User.findAll({
      attributes: [
        [User.sequelize.fn('DATE', User.sequelize.col('last_seen_at')), 'date'],
        [User.sequelize.fn('COUNT', User.sequelize.fn('DISTINCT', User.sequelize.col('id'))), 'count']
      ],
      where: {
        last_seen_at: { [Op.between]: [startDate, endDate] },
        is_active: true
      },
      group: [User.sequelize.fn('DATE', User.sequelize.col('last_seen_at'))],
      order: [[User.sequelize.fn('DATE', User.sequelize.col('last_seen_at')), 'ASC']],
      raw: true
    });

    // Top active users
    const topActiveUsers = await Submission.findAll({
      attributes: [
        'user_id',
        [Submission.sequelize.fn('COUNT', '*'), 'submissionCount'],
        [Submission.sequelize.fn('MAX', Submission.sequelize.col('submitted_at')), 'lastActivity']
      ],
      include: [{
        model: User,
        as: 'User',
        attributes: ['id', 'name', 'email', 'role'],
        required: true
      }],
      where: {
        submitted_at: { [Op.between]: [startDate, endDate] }
      },
      group: ['Submission.user_id', 'User.id'],
      order: [[Submission.sequelize.fn('COUNT', '*'), 'DESC']],
      limit: 20,
      raw: false
    });

    return {
      summary: {
        totalUsers,
        activeUsers,
        activityRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) : 0
      },
      dailyActivity: dailyActivity.map(item => ({
        date: item.date,
        activeUsers: parseInt(item.count) || 0
      })),
      topActiveUsers: topActiveUsers.map(item => ({
        userId: item.user_id,
        name: item.User?.name || 'Unknown',
        email: item.User?.email || '',
        role: item.User?.role || 'user',
        submissionCount: parseInt(item.dataValues?.submissionCount || item.submissionCount) || 0,
        lastActivity: item.dataValues?.lastActivity || item.lastActivity
      }))
    };
  }

  /**
   * Generate registration report
   */
  async generateRegistrationReport(startDate, endDate, filters) {
    const whereClause = {
      created_at: { [Op.between]: [startDate, endDate] }
    };

    if (filters.role) whereClause.role = filters.role;
    if (filters.subscription_status) whereClause.subscription_status = filters.subscription_status;

    // Registration summary
    const totalRegistrations = await User.count({ where: whereClause });
    
    // Registrations by role
    const registrationsByRole = await User.findAll({
      attributes: [
        'role',
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['role'],
      raw: true
    });

    // Registrations by subscription
    const registrationsBySubscription = await User.findAll({
      attributes: [
        'subscription_status',
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['subscription_status'],
      raw: true
    });

    // Daily registration trends
    const dailyRegistrations = await User.findAll({
      attributes: [
        [User.sequelize.fn('DATE', User.sequelize.col('created_at')), 'date'],
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: [User.sequelize.fn('DATE', User.sequelize.col('created_at'))],
      order: [[User.sequelize.fn('DATE', User.sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    // New users with details
    const newUsers = await User.findAll({
      include: [{
        model: UserProfile,
        as: 'Profile',
        required: false
      }],
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: 100
    });

    return {
      summary: {
        totalRegistrations,
        averageDailyRegistrations: dailyRegistrations.length > 0 
          ? (totalRegistrations / dailyRegistrations.length).toFixed(2) 
          : 0
      },
      byRole: registrationsByRole.map(item => ({
        role: item.role || 'unknown',
        count: parseInt(item.count) || 0
      })),
      bySubscription: registrationsBySubscription.map(item => ({
        subscription: item.subscription_status || 'free',
        count: parseInt(item.count) || 0
      })),
      dailyTrends: dailyRegistrations.map(item => ({
        date: item.date,
        count: parseInt(item.count) || 0
      })),
      newUsers: newUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionStatus: user.subscription_status,
        registeredAt: user.created_at
      }))
    };
  }

  /**
   * Generate engagement report
   */
  async generateEngagementReport(startDate, endDate, filters) {
    const whereClause = {
      created_at: { [Op.between]: [startDate, endDate] }
    };

    // Enrollment statistics
    const totalEnrollments = await CourseEnrollment.count({
      where: whereClause
    });

    const completedEnrollments = await CourseEnrollment.count({
      where: {
        ...whereClause,
        status: 'completed'
      }
    });

    // Submission statistics
    const totalSubmissions = await Submission.count({
      where: {
        submitted_at: { [Op.between]: [startDate, endDate] }
      }
    });

    const acceptedSubmissions = await Submission.count({
      where: {
        submitted_at: { [Op.between]: [startDate, endDate] },
        status: 'accepted'
      }
    });

    // User engagement breakdown
    const engagementByUser = await Submission.findAll({
      attributes: [
        'user_id',
        [Submission.sequelize.fn('COUNT', '*'), 'submissionCount'],
        [Submission.sequelize.fn('SUM', Submission.sequelize.literal("CASE WHEN `Submission`.`status` = 'accepted' THEN 1 ELSE 0 END")), 'acceptedCount']
      ],
      include: [{
        model: User,
        as: 'User',
        attributes: ['id', 'name', 'email', 'role'],
        required: true
      }],
      where: {
        submitted_at: { [Op.between]: [startDate, endDate] }
      },
      group: ['Submission.user_id', 'User.id'],
      order: [[Submission.sequelize.fn('COUNT', '*'), 'DESC']],
      limit: 50,
      raw: false
    });

    // Course enrollment trends
    const enrollmentTrends = await CourseEnrollment.findAll({
      attributes: [
        [CourseEnrollment.sequelize.fn('DATE', CourseEnrollment.sequelize.col('created_at')), 'date'],
        [CourseEnrollment.sequelize.fn('COUNT', '*'), 'count']
      ],
      where: whereClause,
      group: [CourseEnrollment.sequelize.fn('DATE', CourseEnrollment.sequelize.col('created_at'))],
      order: [[CourseEnrollment.sequelize.fn('DATE', CourseEnrollment.sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    return {
      summary: {
        totalEnrollments,
        completedEnrollments,
        completionRate: totalEnrollments > 0 ? ((completedEnrollments / totalEnrollments) * 100).toFixed(2) : 0,
        totalSubmissions,
        acceptedSubmissions,
        acceptanceRate: totalSubmissions > 0 ? ((acceptedSubmissions / totalSubmissions) * 100).toFixed(2) : 0
      },
      engagementByUser: engagementByUser.map(item => ({
        userId: item.user_id,
        name: item.User?.name || 'Unknown',
        email: item.User?.email || '',
        role: item.User?.role || 'user',
        submissionCount: parseInt(item.dataValues?.submissionCount || item.submissionCount) || 0,
        acceptedCount: parseInt(item.dataValues?.acceptedCount || item.acceptedCount) || 0,
        acceptanceRate: parseInt(item.dataValues?.submissionCount || item.submissionCount) > 0
          ? ((parseInt(item.dataValues?.acceptedCount || item.acceptedCount) / parseInt(item.dataValues?.submissionCount || item.submissionCount)) * 100).toFixed(2)
          : 0
      })),
      enrollmentTrends: enrollmentTrends.map(item => ({
        date: item.date,
        count: parseInt(item.count) || 0
      }))
    };
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(startDate, endDate, filters) {
    // Top performers by submissions
    const topPerformers = await Submission.findAll({
      attributes: [
        'user_id',
        [Submission.sequelize.fn('COUNT', '*'), 'totalSubmissions'],
        [Submission.sequelize.fn('SUM', Submission.sequelize.literal("CASE WHEN `Submission`.`status` = 'accepted' THEN 1 ELSE 0 END")), 'acceptedSubmissions']
      ],
      include: [{
        model: User,
        as: 'User',
        attributes: ['id', 'name', 'email'],
        required: true,
        include: [{
          model: UserStats,
          as: 'Stats',
          required: false
        }]
      }],
      where: {
        submitted_at: { [Op.between]: [startDate, endDate] }
      },
      group: ['Submission.user_id', 'User.id'],
      order: [[Submission.sequelize.fn('SUM', Submission.sequelize.literal("CASE WHEN `Submission`.`status` = 'accepted' THEN 1 ELSE 0 END")), 'DESC']],
      limit: 50,
      raw: false
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
        required: true
      }],
      where: {
        created_at: { [Op.between]: [startDate, endDate] }
      },
      group: ['CourseEnrollment.course_id', 'Course.id'],
      order: [[CourseEnrollment.sequelize.fn('SUM', CourseEnrollment.sequelize.literal("CASE WHEN `CourseEnrollment`.`status` = 'completed' THEN 1 ELSE 0 END")), 'DESC']],
      limit: 20,
      raw: false
    });

    return {
      topPerformers: topPerformers.map(item => {
        const user = item.User;
        const stats = user?.Stats;
        return {
          userId: item.user_id,
          name: user?.name || 'Unknown',
          email: user?.email || '',
          totalSubmissions: parseInt(item.dataValues?.totalSubmissions || item.totalSubmissions) || 0,
          acceptedSubmissions: parseInt(item.dataValues?.acceptedSubmissions || item.acceptedSubmissions) || 0,
          acceptanceRate: parseInt(item.dataValues?.totalSubmissions || item.totalSubmissions) > 0
            ? ((parseInt(item.dataValues?.acceptedSubmissions || item.acceptedSubmissions) / parseInt(item.dataValues?.totalSubmissions || item.totalSubmissions)) * 100).toFixed(2)
            : 0,
          xp: stats?.xp || 0,
          level: stats?.level || 0,
          problemsSolved: stats?.problems_solved || 0
        };
      }),
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
   * Generate comprehensive report
   */
  async generateComprehensiveReport(startDate, endDate, filters) {
    const [activity, registration, engagement, performance] = await Promise.all([
      this.generateActivityReport(startDate, endDate, filters),
      this.generateRegistrationReport(startDate, endDate, filters),
      this.generateEngagementReport(startDate, endDate, filters),
      this.generatePerformanceReport(startDate, endDate, filters)
    ]);

    return {
      activity,
      registration,
      engagement,
      performance,
      summary: {
        totalUsers: activity.summary.totalUsers,
        activeUsers: activity.summary.activeUsers,
        newRegistrations: registration.summary.totalRegistrations,
        totalEnrollments: engagement.summary.totalEnrollments,
        totalSubmissions: engagement.summary.totalSubmissions
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
      case 'activity':
        // Activity summary
        lines.push('Activity Summary');
        lines.push('Metric,Value');
        lines.push(`Total Users,${reportData.summary.totalUsers}`);
        lines.push(`Active Users,${reportData.summary.activeUsers}`);
        lines.push(`Activity Rate,${reportData.summary.activityRate}%`);
        lines.push('');
        
        // Top active users
        lines.push('Top Active Users');
        lines.push('User ID,Name,Email,Role,Submission Count,Last Activity');
        if (reportData.topActiveUsers) {
          reportData.topActiveUsers.forEach(user => {
            lines.push(`${user.userId},"${user.name}","${user.email}",${user.role},${user.submissionCount},${user.lastActivity || 'N/A'}`);
          });
        }
        break;

      case 'registration':
        // Registration summary
        lines.push('Registration Summary');
        lines.push('Metric,Value');
        lines.push(`Total Registrations,${reportData.summary.totalRegistrations}`);
        lines.push(`Average Daily Registrations,${reportData.summary.averageDailyRegistrations}`);
        lines.push('');
        
        // By role
        lines.push('Registrations by Role');
        lines.push('Role,Count');
        if (reportData.byRole) {
          reportData.byRole.forEach(item => {
            lines.push(`${item.role},${item.count}`);
          });
        }
        lines.push('');
        
        // New users
        lines.push('New Users');
        lines.push('ID,Name,Email,Role,Subscription Status,Registered At');
        if (reportData.newUsers) {
          reportData.newUsers.forEach(user => {
            lines.push(`${user.id},"${user.name}","${user.email}",${user.role},${user.subscriptionStatus},${user.registeredAt}`);
          });
        }
        break;

      case 'engagement':
        // Engagement summary
        lines.push('Engagement Summary');
        lines.push('Metric,Value');
        lines.push(`Total Enrollments,${reportData.summary.totalEnrollments}`);
        lines.push(`Completed Enrollments,${reportData.summary.completedEnrollments}`);
        lines.push(`Completion Rate,${reportData.summary.completionRate}%`);
        lines.push(`Total Submissions,${reportData.summary.totalSubmissions}`);
        lines.push(`Accepted Submissions,${reportData.summary.acceptedSubmissions}`);
        lines.push(`Acceptance Rate,${reportData.summary.acceptanceRate}%`);
        lines.push('');
        
        // User engagement
        lines.push('User Engagement');
        lines.push('User ID,Name,Email,Role,Submission Count,Accepted Count,Acceptance Rate');
        if (reportData.engagementByUser) {
          reportData.engagementByUser.forEach(user => {
            lines.push(`${user.userId},"${user.name}","${user.email}",${user.role},${user.submissionCount},${user.acceptedCount},${user.acceptanceRate}%`);
          });
        }
        break;

      case 'performance':
        // Top performers
        lines.push('Top Performers');
        lines.push('User ID,Name,Email,Total Submissions,Accepted Submissions,Acceptance Rate,XP,Level,Problems Solved');
        if (reportData.topPerformers) {
          reportData.topPerformers.forEach(user => {
            lines.push(`${user.userId},"${user.name}","${user.email}",${user.totalSubmissions},${user.acceptedSubmissions},${user.acceptanceRate}%,${user.xp},${user.level},${user.problemsSolved}`);
          });
        }
        lines.push('');
        
        // Course completions
        lines.push('Course Completions');
        lines.push('Course ID,Course Title,Total Enrollments,Completed Enrollments,Completion Rate');
        if (reportData.courseCompletions) {
          reportData.courseCompletions.forEach(course => {
            lines.push(`${course.courseId},"${course.courseTitle}",${course.totalEnrollments},${course.completedEnrollments},${course.completionRate}%`);
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
   * GET /api/admin/users/reports/types
   */
  async getReportTypes(req, res) {
    try {
      const reportTypes = [
        {
          id: 'comprehensive',
          name: 'Comprehensive Report',
          description: 'Complete overview of all user metrics and activities'
        },
        {
          id: 'activity',
          name: 'Activity Report',
          description: 'User activity and engagement metrics'
        },
        {
          id: 'registration',
          name: 'Registration Report',
          description: 'New user registrations and trends'
        },
        {
          id: 'engagement',
          name: 'Engagement Report',
          description: 'User engagement with courses and submissions'
        },
        {
          id: 'performance',
          name: 'Performance Report',
          description: 'Top performers and course completion rates'
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

module.exports = new UserReportController();

