const User = require('../models/User');
const CourseEnrollment = require('../models/CourseEnrollment');
const Submission = require('../models/Submission');
const ContestSubmission = require('../models/ContestSubmission');
const Course = require('../models/Course');
const Problem = require('../models/Problem');
const { Op } = require('sequelize');

class UserAnalyticsController {
  /**
   * Get comprehensive analytics overview
   * GET /api/admin/users/analytics/overview?range=30d
   */
  async getAnalyticsOverview(req, res) {
    try {
      const { range = '30d' } = req.query;
      const now = new Date();
      let startDate;

      // Calculate start date based on range
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

      // Get total counts
      const [
        totalUsers,
        activeUsers,
        newUsers,
        totalEnrollments,
        totalSubmissions,
        completedCourses
      ] = await Promise.all([
        User.count(),
        User.count({
          where: {
            last_seen_at: { [Op.gte]: startDate },
            is_active: true
          }
        }),
        User.count({
          where: {
            created_at: { [Op.gte]: startDate }
          }
        }),
        CourseEnrollment.count({
          where: {
            created_at: { [Op.gte]: startDate }
          }
        }),
        Submission.count({
          where: {
            submitted_at: { [Op.gte]: startDate }
          }
        }),
        CourseEnrollment.count({
          where: {
            status: 'completed',
            [Op.or]: [
              { completion_date: { [Op.gte]: startDate } },
              { updated_at: { [Op.gte]: startDate } }
            ]
          }
        })
      ]);

      // Calculate retention rate (users who were active in the period)
      const retentionRate = totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) : 0;

      // User growth trend
      const userGrowth = await User.findAll({
        attributes: [
          [User.sequelize.fn('DATE', User.sequelize.col('created_at')), 'date'],
          [User.sequelize.fn('COUNT', '*'), 'count']
        ],
        where: {
          created_at: { [Op.gte]: startDate }
        },
        group: [User.sequelize.fn('DATE', User.sequelize.col('created_at'))],
        order: [[User.sequelize.fn('DATE', User.sequelize.col('created_at')), 'ASC']],
        raw: true
      });

      // Activity by day of week (0 = Sunday, 6 = Saturday)
      const activityByDay = await Submission.findAll({
        attributes: [
          [Submission.sequelize.fn('DAYOFWEEK', Submission.sequelize.col('submitted_at')), 'day'],
          [Submission.sequelize.fn('COUNT', '*'), 'count']
        ],
        where: {
          submitted_at: { [Op.gte]: startDate }
        },
        group: [Submission.sequelize.fn('DAYOFWEEK', Submission.sequelize.col('submitted_at'))],
        raw: true
      });

      // Activity by hour of day
      const activityByHour = await Submission.findAll({
        attributes: [
          [Submission.sequelize.fn('HOUR', Submission.sequelize.col('submitted_at')), 'hour'],
          [Submission.sequelize.fn('COUNT', '*'), 'count']
        ],
        where: {
          submitted_at: { [Op.gte]: startDate }
        },
        group: [Submission.sequelize.fn('HOUR', Submission.sequelize.col('submitted_at'))],
        order: [[Submission.sequelize.fn('HOUR', Submission.sequelize.col('submitted_at')), 'ASC']],
        raw: true
      });

      // Distribution by role
      const byRole = await User.findAll({
        attributes: [
          'role',
          [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
        ],
        group: ['role'],
        raw: true
      });

      // Distribution by subscription
      const bySubscription = await User.findAll({
        attributes: [
          'subscription_status',
          [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
        ],
        group: ['subscription_status'],
        raw: true
      });

      res.status(200).json({
        success: true,
        data: {
          overview: {
            totalUsers,
            activeUsers,
            newUsers,
            retentionRate: parseFloat(retentionRate),
            enrollments: totalEnrollments,
            submissions: totalSubmissions,
            completedCourses
          },
          trends: {
            userGrowth: userGrowth.map(item => ({
              date: item.date,
              count: parseInt(item.count) || 0
            })),
            activityByDay: activityByDay.map(item => ({
              day: parseInt(item.day) || 1,
              count: parseInt(item.count) || 0
            })),
            activityByHour: activityByHour.map(item => ({
              hour: parseInt(item.hour) || 0,
              count: parseInt(item.count) || 0
            }))
          },
          distribution: {
            byRole: byRole.map(item => ({
              role: item.role || 'unknown',
              count: parseInt(item.count) || 0
            })),
            bySubscription: bySubscription.map(item => ({
              subscription: item.subscription_status || 'free',
              count: parseInt(item.count) || 0
            }))
          }
        }
      });
    } catch (error) {
      console.error('Error in getAnalyticsOverview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics overview',
        error: error.message
      });
    }
  }

  /**
   * Get user engagement metrics
   * GET /api/admin/users/analytics/engagement?range=30d
   */
  async getEngagementMetrics(req, res) {
    try {
      const { range = '30d' } = req.query;
      const now = new Date();
      let startDate;

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

      // Daily active users
      const dailyActiveUsers = await User.findAll({
        attributes: [
          [User.sequelize.fn('DATE', User.sequelize.col('last_seen_at')), 'date'],
          [User.sequelize.fn('COUNT', User.sequelize.fn('DISTINCT', User.sequelize.col('id'))), 'count']
        ],
        where: {
          last_seen_at: { [Op.gte]: startDate },
          is_active: true
        },
        group: [User.sequelize.fn('DATE', User.sequelize.col('last_seen_at'))],
        order: [[User.sequelize.fn('DATE', User.sequelize.col('last_seen_at')), 'ASC']],
        raw: true
      });

      // Enrollment trends
      const enrollmentTrends = await CourseEnrollment.findAll({
        attributes: [
          [CourseEnrollment.sequelize.fn('DATE', CourseEnrollment.sequelize.col('created_at')), 'date'],
          [CourseEnrollment.sequelize.fn('COUNT', '*'), 'count']
        ],
        where: {
          created_at: { [Op.gte]: startDate }
        },
        group: [CourseEnrollment.sequelize.fn('DATE', CourseEnrollment.sequelize.col('created_at'))],
        order: [[CourseEnrollment.sequelize.fn('DATE', CourseEnrollment.sequelize.col('created_at')), 'ASC']],
        raw: true
      });

      // Submission trends
      const submissionTrends = await Submission.findAll({
        attributes: [
          [Submission.sequelize.fn('DATE', Submission.sequelize.col('submitted_at')), 'date'],
          [Submission.sequelize.fn('COUNT', '*'), 'count'],
          [Submission.sequelize.fn('SUM', Submission.sequelize.literal("CASE WHEN status = 'accepted' THEN 1 ELSE 0 END")), 'accepted']
        ],
        where: {
          submitted_at: { [Op.gte]: startDate }
        },
        group: [Submission.sequelize.fn('DATE', Submission.sequelize.col('submitted_at'))],
        order: [[Submission.sequelize.fn('DATE', Submission.sequelize.col('submitted_at')), 'ASC']],
        raw: true
      });

      // Average session duration (mock data - can be enhanced with actual session tracking)
      const avgSessionDuration = 45; // minutes

      // Engagement score calculation
      const totalEngagements = await Promise.all([
        CourseEnrollment.count({ where: { created_at: { [Op.gte]: startDate } } }),
        Submission.count({ where: { submitted_at: { [Op.gte]: startDate } } })
      ]);
      const engagementScore = totalEngagements[0] + totalEngagements[1];

      res.status(200).json({
        success: true,
        data: {
          dailyActiveUsers: dailyActiveUsers.map(item => ({
            date: item.date,
            count: parseInt(item.count) || 0
          })),
          enrollmentTrends: enrollmentTrends.map(item => ({
            date: item.date,
            count: parseInt(item.count) || 0
          })),
          submissionTrends: submissionTrends.map(item => ({
            date: item.date,
            count: parseInt(item.count) || 0,
            accepted: parseInt(item.accepted) || 0
          })),
          avgSessionDuration,
          engagementScore
        }
      });
    } catch (error) {
      console.error('Error in getEngagementMetrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch engagement metrics',
        error: error.message
      });
    }
  }

  /**
   * Get user retention analysis
   * GET /api/admin/users/analytics/retention?cohort=monthly
   */
  async getRetentionAnalysis(req, res) {
    try {
      const { cohort = 'monthly' } = req.query;
      const now = new Date();
      
      let cohortGroups = [];
      if (cohort === 'weekly') {
        // Weekly cohorts
        for (let i = 11; i >= 0; i--) {
          const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          
          const cohortUsers = await User.count({
            where: {
              created_at: {
                [Op.gte]: weekStart,
                [Op.lt]: weekEnd
              }
            }
          });

          // Calculate retention for each subsequent week
          const retention = [];
          for (let week = 0; week < 12; week++) {
            const checkDate = new Date(weekEnd.getTime() + week * 7 * 24 * 60 * 60 * 1000);
            const activeUsers = await User.count({
              where: {
                created_at: {
                  [Op.gte]: weekStart,
                  [Op.lt]: weekEnd
                },
                last_seen_at: {
                  [Op.gte]: checkDate
                }
              }
            });
            
            retention.push({
              week,
              rate: cohortUsers > 0 ? parseFloat(((activeUsers / cohortUsers) * 100).toFixed(2)) : 0
            });
          }

          cohortGroups.push({
            cohort: weekStart.toISOString().split('T')[0],
            totalUsers: cohortUsers,
            retention
          });
        }
      } else {
        // Monthly cohorts
        for (let i = 11; i >= 0; i--) {
          const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
          
          const cohortUsers = await User.count({
            where: {
              created_at: {
                [Op.gte]: monthStart,
                [Op.lt]: monthEnd
              }
            }
          });

          // Calculate retention for each subsequent month
          const retention = [];
          for (let month = 0; month < 12; month++) {
            const checkDate = new Date(monthEnd.getTime());
            checkDate.setMonth(checkDate.getMonth() + month);
            
            const activeUsers = await User.count({
              where: {
                created_at: {
                  [Op.gte]: monthStart,
                  [Op.lt]: monthEnd
                },
                last_seen_at: {
                  [Op.gte]: checkDate
                }
              }
            });
            
            retention.push({
              month,
              rate: cohortUsers > 0 ? parseFloat(((activeUsers / cohortUsers) * 100).toFixed(2)) : 0
            });
          }

          cohortGroups.push({
            cohort: monthStart.toISOString().split('T')[0].substring(0, 7), // YYYY-MM
            totalUsers: cohortUsers,
            retention
          });
        }
      }

      res.status(200).json({
        success: true,
        data: {
          cohort,
          cohorts: cohortGroups
        }
      });
    } catch (error) {
      console.error('Error in getRetentionAnalysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch retention analysis',
        error: error.message
      });
    }
  }

  /**
   * Get user behavior insights
   * GET /api/admin/users/analytics/behavior?range=30d
   */
  async getBehaviorInsights(req, res) {
    try {
      const { range = '30d' } = req.query;
      const now = new Date();
      let startDate;

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

      // Most active users
      const mostActiveUsers = await Submission.findAll({
        attributes: [
          'user_id',
          [Submission.sequelize.fn('COUNT', '*'), 'submissionCount']
        ],
        include: [{
          model: User,
          as: 'User',
          attributes: ['id', 'name', 'email'],
          required: true
        }],
        where: {
          submitted_at: { [Op.gte]: startDate }
        },
        group: ['user_id'],
        order: [[Submission.sequelize.fn('COUNT', '*'), 'DESC']],
        limit: 10,
        raw: false
      });

      // Most enrolled courses
      const mostEnrolledCourses = await CourseEnrollment.findAll({
        attributes: [
          'course_id',
          [CourseEnrollment.sequelize.fn('COUNT', '*'), 'enrollmentCount']
        ],
        include: [{
          model: Course,
          as: 'Course',
          attributes: ['id', 'title'],
          required: true
        }],
        where: {
          created_at: { [Op.gte]: startDate }
        },
        group: ['course_id'],
        order: [[CourseEnrollment.sequelize.fn('COUNT', '*'), 'DESC']],
        limit: 10,
        raw: false
      });

      // Most solved problems
      const mostSolvedProblems = await Submission.findAll({
        attributes: [
          'problem_id',
          [Submission.sequelize.fn('COUNT', Submission.sequelize.fn('DISTINCT', Submission.sequelize.col('user_id'))), 'solverCount']
        ],
        include: [{
          model: Problem,
          attributes: ['id', 'title'],
          required: true
        }],
        where: {
          status: 'accepted',
          submitted_at: { [Op.gte]: startDate }
        },
        group: ['Submission.problem_id', 'Problem.id'],
        order: [[Submission.sequelize.fn('COUNT', Submission.sequelize.fn('DISTINCT', Submission.sequelize.col('user_id'))), 'DESC']],
        limit: 10,
        raw: false
      });

      // User progression patterns
      const userProgression = await CourseEnrollment.findAll({
        attributes: [
          'status',
          [CourseEnrollment.sequelize.fn('COUNT', '*'), 'count']
        ],
        where: {
          created_at: { [Op.gte]: startDate }
        },
        group: ['status'],
        raw: true
      });

      res.status(200).json({
        success: true,
        data: {
          mostActiveUsers: mostActiveUsers.map(item => ({
            userId: item.user_id,
            name: item.User?.name || 'Unknown',
            email: item.User?.email || '',
            submissionCount: parseInt(item.dataValues.submissionCount) || 0
          })),
          mostEnrolledCourses: mostEnrolledCourses.map(item => ({
            courseId: item.course_id,
            title: item.Course?.title || 'Unknown',
            enrollmentCount: parseInt(item.dataValues.enrollmentCount) || 0
          })),
          mostSolvedProblems: mostSolvedProblems.map(item => {
            const problem = item.Problem || item.get?.('Problem');
            return {
              problemId: item.problem_id,
              title: problem?.title || problem?.dataValues?.title || 'Unknown',
              solverCount: parseInt(item.dataValues?.solverCount || item.solverCount) || 0
            };
          }),
          userProgression: userProgression.map(item => ({
            status: item.status || 'not-started',
            count: parseInt(item.count) || 0
          }))
        }
      });
    } catch (error) {
      console.error('Error in getBehaviorInsights:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch behavior insights',
        error: error.message
      });
    }
  }

  /**
   * Get time-based analytics
   * GET /api/admin/users/analytics/time-based?range=30d
   */
  async getTimeBasedAnalytics(req, res) {
    try {
      const { range = '30d' } = req.query;
      const now = new Date();
      let startDate;

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

      // Peak hours analysis
      const peakHours = await Submission.findAll({
        attributes: [
          [Submission.sequelize.fn('HOUR', Submission.sequelize.col('submitted_at')), 'hour'],
          [Submission.sequelize.fn('COUNT', '*'), 'count']
        ],
        where: {
          submitted_at: { [Op.gte]: startDate }
        },
        group: [Submission.sequelize.fn('HOUR', Submission.sequelize.col('submitted_at'))],
        order: [[Submission.sequelize.fn('COUNT', '*'), 'DESC']],
        limit: 5,
        raw: true
      });

      // Peak days analysis
      const peakDays = await Submission.findAll({
        attributes: [
          [Submission.sequelize.fn('DAYNAME', Submission.sequelize.col('submitted_at')), 'dayName'],
          [Submission.sequelize.fn('DAYOFWEEK', Submission.sequelize.col('submitted_at')), 'dayOfWeek'],
          [Submission.sequelize.fn('COUNT', '*'), 'count']
        ],
        where: {
          submitted_at: { [Op.gte]: startDate }
        },
        group: [
          Submission.sequelize.fn('DAYNAME', Submission.sequelize.col('submitted_at')),
          Submission.sequelize.fn('DAYOFWEEK', Submission.sequelize.col('submitted_at'))
        ],
        order: [[Submission.sequelize.fn('COUNT', '*'), 'DESC']],
        raw: true
      });

      // Activity by time of day
      const activityByTime = await Submission.findAll({
        attributes: [
          [
            Submission.sequelize.literal(`
              CASE 
                WHEN HOUR(submitted_at) BETWEEN 0 AND 5 THEN 'Late Night (0-5)'
                WHEN HOUR(submitted_at) BETWEEN 6 AND 11 THEN 'Morning (6-11)'
                WHEN HOUR(submitted_at) BETWEEN 12 AND 17 THEN 'Afternoon (12-17)'
                WHEN HOUR(submitted_at) BETWEEN 18 AND 23 THEN 'Evening (18-23)'
                ELSE 'Unknown'
              END
            `),
            'timePeriod'
          ],
          [Submission.sequelize.fn('COUNT', '*'), 'count']
        ],
        where: {
          submitted_at: { [Op.gte]: startDate }
        },
        group: ['timePeriod'],
        raw: true
      });

      res.status(200).json({
        success: true,
        data: {
          peakHours: peakHours.map(item => ({
            hour: parseInt(item.hour) || 0,
            count: parseInt(item.count) || 0
          })),
          peakDays: peakDays.map(item => ({
            dayName: item.dayName || 'Unknown',
            dayOfWeek: parseInt(item.dayOfWeek) || 1,
            count: parseInt(item.count) || 0
          })),
          activityByTime: activityByTime.map(item => ({
            timePeriod: item.timePeriod || 'Unknown',
            count: parseInt(item.count) || 0
          }))
        }
      });
    } catch (error) {
      console.error('Error in getTimeBasedAnalytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch time-based analytics',
        error: error.message
      });
    }
  }
}

module.exports = new UserAnalyticsController();

