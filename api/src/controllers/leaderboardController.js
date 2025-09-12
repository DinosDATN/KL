const { 
  User, 
  UserProfile, 
  UserStats, 
  Level, 
  Badge, 
  UserBadge, 
  LeaderboardEntry,
  BadgeCategory 
} = require('../models');
const { sequelize } = require('../config/sequelize');

class LeaderboardController {
  // Get comprehensive leaderboard data
  async getLeaderboard(req, res) {
    try {
      const { 
        period = 'weekly', 
        limit = 50,
        search = '',
        sortBy = 'xp',
        sortOrder = 'desc'
      } = req.query;

      // Validate period
      if (!['weekly', 'monthly'].includes(period)) {
        return res.status(400).json({
          success: false,
          message: 'Period must be either "weekly" or "monthly"'
        });
      }

      let users = [];
      let userStats = [];
      let leaderboardEntries = [];

      if (period === 'weekly' || period === 'monthly') {
        // Get leaderboard entries for the specified period
        const entries = period === 'weekly' 
          ? await LeaderboardEntry.getCurrentWeeklyLeaderboard(parseInt(limit))
          : await LeaderboardEntry.getCurrentMonthlyLeaderboard(parseInt(limit));
        
        leaderboardEntries = entries;
        
        // Get user IDs from entries
        const userIds = entries.map(entry => entry.user_id);
        
        // Get users and their stats
        if (userIds.length > 0) {
          users = await User.findAll({
            where: {
              id: userIds,
              ...(search && {
                name: {
                  [sequelize.Sequelize.Op.iLike]: `%${search}%`
                }
              })
            },
            attributes: ['id', 'name', 'email', 'avatar_url', 'role', 'is_active', 'is_online', 'subscription_status', 'created_at']
          });

          userStats = await UserStats.findAll({
            where: {
              user_id: userIds
            }
          });
        }
      }

      // If no entries found, fall back to general user stats
      if (users.length === 0) {
        const whereCondition = {
          is_active: true,
          ...(search && {
            name: {
              [sequelize.Sequelize.Op.iLike]: `%${search}%`
            }
          })
        };

        users = await User.findAll({
          where: whereCondition,
          attributes: ['id', 'name', 'email', 'avatar_url', 'role', 'is_active', 'is_online', 'subscription_status', 'created_at'],
          limit: parseInt(limit),
          order: [['created_at', 'DESC']]
        });

        const userIds = users.map(user => user.id);
        userStats = await UserStats.findAll({
          where: {
            user_id: userIds
          }
        });
      }

      // Get user profiles
      const userProfiles = await UserProfile.findAll({
        where: {
          user_id: users.map(user => user.id)
        }
      });

      // Get user badges
      const userBadges = await UserBadge.findAll({
        where: {
          user_id: users.map(user => user.id)
        },
        include: [{
          model: Badge,
          as: 'Badge',
          include: [{
            model: BadgeCategory,
            as: 'Category'
          }]
        }]
      });

      // Get all levels
      const levels = await Level.getAllLevels();

      // Combine all data
      const leaderboardData = users.map(user => {
        const profile = userProfiles.find(p => p.user_id === user.id);
        const stats = userStats.find(s => s.user_id === user.id);
        const entry = leaderboardEntries.find(e => e.user_id === user.id);
        const badges = userBadges
          .filter(ub => ub.user_id === user.id)
          .map(ub => ub.Badge);
        
        // Find user's level
        const userLevel = stats ? levels.find(l => l.level <= stats.level) : null;

        return {
          user: user.toJSON(),
          profile: profile || null,
          stats: stats || null,
          entry: entry || null,
          level: userLevel || null,
          badges: badges || []
        };
      });

      // Sort the data
      const sortedData = leaderboardData.sort((a, b) => {
        let valueA = 0;
        let valueB = 0;

        switch (sortBy) {
          case 'xp':
            valueA = a.entry?.xp || a.stats?.xp || 0;
            valueB = b.entry?.xp || b.stats?.xp || 0;
            break;
          case 'level':
            valueA = a.stats?.level || 0;
            valueB = b.stats?.level || 0;
            break;
          case 'rank':
            valueA = a.stats?.rank || 9999;
            valueB = b.stats?.rank || 9999;
            // For rank, lower is better, so reverse the comparison
            return sortOrder === 'desc' 
              ? (valueA < valueB ? -1 : valueA > valueB ? 1 : 0)
              : (valueA < valueB ? 1 : valueA > valueB ? -1 : 0);
          default:
            valueA = a.entry?.xp || a.stats?.xp || 0;
            valueB = b.entry?.xp || b.stats?.xp || 0;
        }

        if (sortOrder === 'desc') {
          return valueB - valueA;
        } else {
          return valueA - valueB;
        }
      });

      // Add dynamic ranking
      const rankedData = sortedData.map((item, index) => ({
        ...item,
        rank: index + 1
      }));

      res.status(200).json({
        success: true,
        data: {
          entries: rankedData,
          levels: levels,
          period: period,
          total: rankedData.length
        }
      });

    } catch (error) {
      console.error('Error in getLeaderboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch leaderboard',
        error: error.message
      });
    }
  }

  // Get user profiles
  async getUserProfiles(req, res) {
    try {
      const userIds = req.query.user_ids;
      
      if (!userIds) {
        return res.status(400).json({
          success: false,
          message: 'user_ids query parameter is required'
        });
      }

      const ids = Array.isArray(userIds) ? userIds : userIds.split(',').map(id => parseInt(id));
      
      const profiles = await UserProfile.findAll({
        where: {
          user_id: ids
        }
      });

      res.status(200).json({
        success: true,
        data: profiles
      });

    } catch (error) {
      console.error('Error in getUserProfiles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user profiles',
        error: error.message
      });
    }
  }

  // Get user stats
  async getUserStats(req, res) {
    try {
      const userIds = req.query.user_ids;
      
      if (!userIds) {
        return res.status(400).json({
          success: false,
          message: 'user_ids query parameter is required'
        });
      }

      const ids = Array.isArray(userIds) ? userIds : userIds.split(',').map(id => parseInt(id));
      
      const stats = await UserStats.findAll({
        where: {
          user_id: ids
        }
      });

      res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error in getUserStats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user stats',
        error: error.message
      });
    }
  }

  // Get levels
  async getLevels(req, res) {
    try {
      const levels = await Level.getAllLevels();

      res.status(200).json({
        success: true,
        data: levels
      });

    } catch (error) {
      console.error('Error in getLevels:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch levels',
        error: error.message
      });
    }
  }

  // Get badges
  async getBadges(req, res) {
    try {
      const { category_id } = req.query;

      let whereCondition = {};
      if (category_id) {
        whereCondition.category_id = category_id;
      }

      const badges = await Badge.findAll({
        where: whereCondition,
        include: [{
          model: BadgeCategory,
          as: 'Category'
        }]
      });

      res.status(200).json({
        success: true,
        data: badges
      });

    } catch (error) {
      console.error('Error in getBadges:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch badges',
        error: error.message
      });
    }
  }

  // Get user badges
  async getUserBadges(req, res) {
    try {
      const userIds = req.query.user_ids;
      
      if (!userIds) {
        return res.status(400).json({
          success: false,
          message: 'user_ids query parameter is required'
        });
      }

      const ids = Array.isArray(userIds) ? userIds : userIds.split(',').map(id => parseInt(id));
      
      const userBadges = await UserBadge.findAll({
        where: {
          user_id: ids
        },
        include: [{
          model: Badge,
          as: 'Badge',
          include: [{
            model: BadgeCategory,
            as: 'Category'
          }]
        }]
      });

      res.status(200).json({
        success: true,
        data: userBadges
      });

    } catch (error) {
      console.error('Error in getUserBadges:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user badges',
        error: error.message
      });
    }
  }

  // Get leaderboard entries
  async getLeaderboardEntries(req, res) {
    try {
      const { period = 'weekly', limit = 50 } = req.query;

      if (!['weekly', 'monthly'].includes(period)) {
        return res.status(400).json({
          success: false,
          message: 'Period must be either "weekly" or "monthly"'
        });
      }

      const entries = period === 'weekly' 
        ? await LeaderboardEntry.getCurrentWeeklyLeaderboard(parseInt(limit))
        : await LeaderboardEntry.getCurrentMonthlyLeaderboard(parseInt(limit));

      res.status(200).json({
        success: true,
        data: entries
      });

    } catch (error) {
      console.error('Error in getLeaderboardEntries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch leaderboard entries',
        error: error.message
      });
    }
  }
}

module.exports = new LeaderboardController();
