const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const UserBadge = sequelize.define('UserBadge', {
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
  badge_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'badges',
      key: 'id'
    }
  },
  earned_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  tableName: 'user_badges',
  timestamps: false, // We use earned_at instead
  underscored: true,
  indexes: [
    { unique: true, fields: ['user_id', 'badge_id'] },
    { fields: ['user_id'] },
    { fields: ['badge_id'] },
    { fields: ['earned_at'] }
  ]
});

// Class methods
UserBadge.findByUserId = function(userId) {
  return this.findAll({ where: { user_id: userId } });
};

UserBadge.findByBadgeId = function(badgeId) {
  return this.findAll({ where: { badge_id: badgeId } });
};

UserBadge.checkUserHasBadge = function(userId, badgeId) {
  return this.findOne({ where: { user_id: userId, badge_id: badgeId } });
};

module.exports = UserBadge;
