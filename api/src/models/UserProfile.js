const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const UserProfile = sequelize.define('UserProfile', {
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
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  birthday: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  website_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  github_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  linkedin_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  preferred_language: {
    type: DataTypes.STRING(10),
    defaultValue: 'vi',
    allowNull: false
  },
  theme_mode: {
    type: DataTypes.ENUM('light', 'dark', 'system'),
    defaultValue: 'system',
    allowNull: false
  },
  layout: {
    type: DataTypes.ENUM('compact', 'expanded'),
    defaultValue: 'expanded',
    allowNull: false
  },
  notifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  visibility_profile: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  visibility_achievements: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  visibility_progress: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  visibility_activity: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'user_profiles',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['user_id'] },
    { fields: ['preferred_language'] },
    { fields: ['theme_mode'] }
  ]
});

// Class methods
UserProfile.findByUserId = function(userId) {
  return this.findOne({ where: { user_id: userId } });
};

module.exports = UserProfile;
