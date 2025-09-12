const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const LeaderboardEntry = sequelize.define('LeaderboardEntry', {
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
  xp: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  type: {
    type: DataTypes.ENUM('weekly', 'monthly'),
    allowNull: false
  }
}, {
  tableName: 'leaderboard_entries',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id', 'type'] },
    { fields: ['type', 'xp'] },
    { fields: ['created_at'] }
  ]
});

// Class methods
LeaderboardEntry.findByType = function(type, limit = 10) {
  return this.findAll({
    where: { type },
    order: [['xp', 'DESC']],
    limit
  });
};

LeaderboardEntry.findByUserAndType = function(userId, type) {
  return this.findOne({
    where: { 
      user_id: userId, 
      type 
    }
  });
};

LeaderboardEntry.getCurrentWeeklyLeaderboard = function(limit = 10) {
  // Find entries from current week
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  return this.findAll({
    where: {
      type: 'weekly',
      created_at: {
        [sequelize.Sequelize.Op.gte]: startOfWeek
      }
    },
    order: [['xp', 'DESC']],
    limit
  });
};

LeaderboardEntry.getCurrentMonthlyLeaderboard = function(limit = 10) {
  // Find entries from current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  return this.findAll({
    where: {
      type: 'monthly',
      created_at: {
        [sequelize.Sequelize.Op.gte]: startOfMonth
      }
    },
    order: [['xp', 'DESC']],
    limit
  });
};

module.exports = LeaderboardEntry;
