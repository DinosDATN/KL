const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Course = require('../models/Course');
const Problem = require('../models/Problem');
const Contest = require('../models/Contest');
const CourseEnrollment = require('../models/CourseEnrollment');
const Submission = require('../models/Submission');
const ContestSubmission = require('../models/ContestSubmission');
const { Op } = require('sequelize');

class DashboardAdminController {
  // Get comprehensive dashboard statistics
  async getDashboardStats(req, res) {
    try {
      const now = new Date();
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get basic counts
      const [
        totalUsers,
        activeUsers,
        totalCourses,
        totalProblems,
        totalContests,
        totalSubmissions,
        totalEnrollments
      ] = await Promise.all([
        User.count(),
        User.count({ where: { is_active: true } }),
        Course.count({ where: { is_deleted: false } }),
        Problem.count({ where: { is_deleted: false } }),
        Contest.count(),
        Submission.count(),
        CourseEnrollment.count()
      ]);

      // Calculate online users (last 5 minutes)
      const onlineThreshold = new Date(now.getTime() - 5 * 60 * 1000);
      const onlineUsers = await User.count({
        where: {
          last_seen_at: { [Op.gte]: onlineThreshold }
        }
      });

      // Get user growth data for the last 30 days
      const userGrowthData = await User.findAll({
        attributes: [
          [User.sequelize.fn('DATE', User.sequelize.col('created_at')), 'date'],
          [User.sequelize.fn('COUNT', '*'), 'users']
        ],
        where: {
          created_at: { [Op.gte]: last30Days }
        },
        group: [User.sequelize.fn('DATE', User.sequelize.col('created_at'))],
        order: [[User.sequelize.fn('DATE', User.sequelize.col('created_at')), 'ASC']]
      });

      // Get top courses by enrollment - using simpler approach
      const allCourses = await Course.findAll({
        where: { is_deleted: false },
        attributes: ['id', 'title']
      });
      
      // Get enrollment counts and ratings for each course
      const coursesWithStats = await Promise.all(
        allCourses.map(async (course) => {
          const enrollmentCount = await CourseEnrollment.count({
            where: { course_id: course.id }
          });
          
          const CourseReview = require('../models/CourseReview');
          const avgRating = await CourseReview.findOne({
            where: { course_id: course.id },
            attributes: [
              [CourseReview.sequelize.fn('AVG', CourseReview.sequelize.col('rating')), 'avg_rating']
            ]
          });
          
          return {
            id: course.id,
            title: course.title,
            students: enrollmentCount,
            rating: Math.round((parseFloat(avgRating?.dataValues?.avg_rating) || 0) * 10) / 10
          };
        })
      );
      
      // Sort by enrollment count and take top 10
      const formattedTopCourses = coursesWithStats
        .sort((a, b) => b.students - a.students)
        .slice(0, 10);

      // Get recent activity (last 50 activities)
      const recentSubmissions = await Submission.findAll({
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'name'],
            required: true
          },
          {
            model: Problem,
            attributes: ['id', 'title'],
            required: true
          }
        ],
        order: [['submitted_at', 'DESC']],
        limit: 25
      });

      const recentEnrollments = await CourseEnrollment.findAll({
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'name'],
            required: true
          },
          {
            model: Course,
            as: 'Course',
            attributes: ['id', 'title'],
            required: true
          }
        ],
        order: [['created_at', 'DESC']],
        limit: 25
      });

      // Format recent activity
      const recentActivity = [
        ...recentSubmissions.map(sub => ({
          id: `submission_${sub.id}`,
          type: 'problem_solved',
          title: 'Problem Submitted',
          description: `${sub.User.name} submitted solution for "${sub.Problem.title}"`,
          timestamp: sub.submitted_at,
          user_name: sub.User.name
        })),
        ...recentEnrollments.map(enr => ({
          id: `enrollment_${enr.id}`,
          type: 'course_created',
          title: 'Course Enrollment',
          description: `${enr.User.name} enrolled in "${enr.Course.title}"`,
          timestamp: enr.created_at,
          user_name: enr.User.name
        }))
      ]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 20);

      // Calculate system health metrics
      const systemHealth = {
        status: 'healthy',
        uptime: Math.floor((now.getTime() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60)), // hours since system start
        memory_usage: Math.floor(Math.random() * 30) + 45, // Mock data: 45-75%
        cpu_usage: Math.floor(Math.random() * 20) + 25, // Mock data: 25-45%
        disk_usage: Math.floor(Math.random() * 15) + 35 // Mock data: 35-50%
      };

      // Determine system status based on usage
      if (systemHealth.memory_usage > 80 || systemHealth.cpu_usage > 80 || systemHealth.disk_usage > 85) {
        systemHealth.status = 'critical';
      } else if (systemHealth.memory_usage > 70 || systemHealth.cpu_usage > 70 || systemHealth.disk_usage > 75) {
        systemHealth.status = 'warning';
      }

      // Calculate revenue (mock data - you can replace with actual revenue logic)
      const mockRevenue = 15000000; // 15M VND
      const revenueGrowthRate = 12.5; // 12.5% growth

      const dashboardStats = {
        totalUsers,
        activeUsers: onlineUsers,
        totalCourses,
        totalProblems,
        totalRevenue: mockRevenue,
        revenueGrowthRate,
        userGrowth: userGrowthData.map(item => ({
          date: item.dataValues.date,
          users: parseInt(item.dataValues.users)
        })),
        topCourses: formattedTopCourses,
        recentActivity,
        systemHealth
      };

      res.status(200).json({
        success: true,
        data: dashboardStats
      });
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard statistics',
        error: error.message
      });
    }
  }

  // Get platform analytics
  async getPlatformAnalytics(req, res) {
    try {
      const { range = '30d' } = req.query;
      
      let startDate;
      const now = new Date();
      
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
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // User engagement metrics
      const userEngagement = await User.findAll({
        attributes: [
          [User.sequelize.fn('DATE', User.sequelize.col('last_seen_at')), 'date'],
          [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'active_users']
        ],
        where: {
          last_seen_at: { [Op.gte]: startDate }
        },
        group: [User.sequelize.fn('DATE', User.sequelize.col('last_seen_at'))],
        order: [[User.sequelize.fn('DATE', User.sequelize.col('last_seen_at')), 'ASC']]
      });

      // Course completion rates
      const courseCompletions = await CourseEnrollment.count({
        where: {
          completed_at: { [Op.ne]: null },
          enrolled_at: { [Op.gte]: startDate }
        }
      });

      const totalEnrollments = await CourseEnrollment.count({
        where: {
          enrolled_at: { [Op.gte]: startDate }
        }
      });

      const completionRate = totalEnrollments > 0 ? (courseCompletions / totalEnrollments) * 100 : 0;

      // Problem solving statistics
      const problemStats = await Submission.findAll({
        attributes: [
          'status',
          [Submission.sequelize.fn('COUNT', '*'), 'count']
        ],
        where: {
          created_at: { [Op.gte]: startDate }
        },
        group: ['status']
      });

      res.status(200).json({
        success: true,
        data: {
          dateRange: range,
          userEngagement: userEngagement.map(item => ({
            date: item.dataValues.date,
            activeUsers: parseInt(item.dataValues.active_users)
          })),
          courseCompletionRate: Math.round(completionRate * 100) / 100,
          problemSolvingStats: problemStats.map(item => ({
            status: item.status,
            count: parseInt(item.dataValues.count)
          }))
        }
      });
    } catch (error) {
      console.error('Error in getPlatformAnalytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch platform analytics',
        error: error.message
      });
    }
  }
}

module.exports = new DashboardAdminController();