const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const RewardTransaction = sequelize.define('RewardTransaction', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  transaction_type: {
    type: DataTypes.ENUM(
      'problem_solved',
      'sudoku_completed',
      'achievement_earned',
      'daily_login',
      'course_completed',
      'manual_adjustment',
      'purchase',
      'bonus'
    ),
    allowNull: false
  },
  reference_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  reference_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'reward_transactions',
  timestamps: false,
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['transaction_type'] },
    { fields: ['created_at'] },
    { fields: ['reference_type', 'reference_id'] }
  ]
});

// Static methods
RewardTransaction.getUserTransactions = async function(userId, options = {}) {
  const { limit = 50, offset = 0, type = null } = options;
  
  const whereClause = { user_id: userId };
  if (type) {
    whereClause.transaction_type = type;
  }

  return await this.findAll({
    where: whereClause,
    order: [['created_at', 'DESC']],
    limit,
    offset
  });
};

RewardTransaction.getTotalPointsByType = async function(userId, type) {
  const result = await this.findOne({
    attributes: [
      [sequelize.fn('SUM', sequelize.col('points')), 'total']
    ],
    where: {
      user_id: userId,
      transaction_type: type
    }
  });
  
  return result ? parseInt(result.getDataValue('total') || 0) : 0;
};

RewardTransaction.getUserStats = async function(userId) {
  const stats = await this.findAll({
    attributes: [
      'transaction_type',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('points')), 'total_points']
    ],
    where: { user_id: userId },
    group: ['transaction_type']
  });

  return stats.map(stat => ({
    type: stat.transaction_type,
    count: parseInt(stat.getDataValue('count')),
    total_points: parseInt(stat.getDataValue('total_points') || 0)
  }));
};

module.exports = RewardTransaction;
