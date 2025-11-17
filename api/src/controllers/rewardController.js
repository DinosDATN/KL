const rewardService = require('../services/rewardService');
const RewardConfig = require('../models/RewardConfig');

class RewardController {
  /**
   * Lấy số điểm thưởng hiện tại của người dùng
   */
  async getCurrentPoints(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const points = await rewardService.getUserRewardPoints(req.user.id);

      res.status(200).json({
        success: true,
        data: {
          userId: req.user.id,
          rewardPoints: points
        }
      });
    } catch (error) {
      console.error('Error getting current points:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get reward points',
        error: error.message
      });
    }
  }

  /**
   * Lấy lịch sử giao dịch điểm thưởng
   */
  async getRewardHistory(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const { page = 1, limit = 20, type = null } = req.query;

      const history = await rewardService.getUserRewardHistory(req.user.id, {
        page: parseInt(page),
        limit: parseInt(limit),
        type: type
      });

      res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Error getting reward history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get reward history',
        error: error.message
      });
    }
  }

  /**
   * Lấy thống kê điểm thưởng của người dùng
   */
  async getRewardStats(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const history = await rewardService.getUserRewardHistory(req.user.id, {
        page: 1,
        limit: 1
      });

      res.status(200).json({
        success: true,
        data: {
          currentBalance: history.currentBalance,
          stats: history.stats
        }
      });
    } catch (error) {
      console.error('Error getting reward stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get reward stats',
        error: error.message
      });
    }
  }

  /**
   * Lấy cấu hình điểm thưởng (public)
   */
  async getRewardConfig(req, res) {
    try {
      const configs = await RewardConfig.getAllConfigs();

      res.status(200).json({
        success: true,
        data: configs
      });
    } catch (error) {
      console.error('Error getting reward config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get reward configuration',
        error: error.message
      });
    }
  }

  /**
   * Cập nhật cấu hình điểm thưởng (admin only)
   */
  async updateRewardConfig(req, res) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const { config_key, config_value } = req.body;

      if (!config_key || config_value === undefined) {
        return res.status(400).json({
          success: false,
          message: 'config_key and config_value are required'
        });
      }

      if (typeof config_value !== 'number' || config_value < 0) {
        return res.status(400).json({
          success: false,
          message: 'config_value must be a non-negative number'
        });
      }

      await RewardConfig.updateConfig(config_key, config_value);

      res.status(200).json({
        success: true,
        message: 'Reward configuration updated successfully',
        data: {
          config_key,
          config_value
        }
      });
    } catch (error) {
      console.error('Error updating reward config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update reward configuration',
        error: error.message
      });
    }
  }

  /**
   * Thêm điểm thưởng thủ công (admin only)
   */
  async addManualReward(req, res) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const { user_id, points, description } = req.body;

      if (!user_id || !points) {
        return res.status(400).json({
          success: false,
          message: 'user_id and points are required'
        });
      }

      if (typeof points !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'points must be a number'
        });
      }

      const result = await rewardService.addRewardPoints(
        user_id,
        points,
        'manual_adjustment',
        {
          description: description || `Điều chỉnh thủ công bởi admin`,
          metadata: {
            admin_id: req.user.id,
            admin_name: req.user.name
          }
        }
      );

      res.status(200).json({
        success: true,
        message: 'Manual reward added successfully',
        data: {
          transaction: result.transaction,
          newBalance: result.newBalance
        }
      });
    } catch (error) {
      console.error('Error adding manual reward:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add manual reward',
        error: error.message
      });
    }
  }
}

module.exports = new RewardController();
