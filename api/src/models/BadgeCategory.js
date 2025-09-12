const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const BadgeCategory = sequelize.define('BadgeCategory', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'badge_categories',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['name'] }
  ]
});

// Class methods
BadgeCategory.findByName = function(name) {
  return this.findOne({ where: { name } });
};

module.exports = BadgeCategory;
