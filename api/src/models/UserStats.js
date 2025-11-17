const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const UserStats = sequelize.define('UserStats', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    unique: true,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  xp: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  rank: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  courses_completed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  hours_learned: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  problems_solved: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  current_streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  longest_streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  average_score: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0,
      max: 100
    }
  },
  reward_points: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'user_stats',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['user_id'] },
    { fields: ['xp'] },
    { fields: ['level'] },
    { fields: ['rank'] }
  ]
});

// Class methods
UserStats.findLeaderboard = function(limit = 10) {
  return this.findAll({
    order: [['xp', 'DESC'], ['level', 'DESC']],
    limit: limit
  });
};

UserStats.findByUserId = function(userId) {
  return this.findOne({ where: { user_id: userId } });
};

module.exports = UserStats;
