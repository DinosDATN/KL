const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Badge = sequelize.define('Badge', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  icon: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  rarity: {
    type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary'),
    defaultValue: 'common',
    allowNull: false
  },
  category_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'badge_categories',
      key: 'id'
    }
  }
}, {
  tableName: 'badges',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['rarity'] },
    { fields: ['category_id'] },
    { fields: ['name'] }
  ]
});

// Class methods
Badge.findByRarity = function(rarity) {
  return this.findAll({ where: { rarity } });
};

Badge.findByCategory = function(categoryId) {
  return this.findAll({ where: { category_id: categoryId } });
};

module.exports = Badge;
