const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Achievement = sequelize.define('Achievement', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM('learning', 'teaching', 'community', 'milestone'),
    allowNull: false
  },
  rarity: {
    type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary'),
    allowNull: false
  }
}, {
  tableName: 'achievements',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['title'] },
    { fields: ['category'] },
    { fields: ['rarity'] }
  ],
  scopes: {
    featured: {
      where: {
        rarity: ['epic', 'legendary']
      },
      order: [
        [sequelize.literal("FIELD(rarity, 'legendary', 'epic', 'rare', 'common')"), 'ASC'],
        ['created_at', 'DESC']
      ],
      limit: 6
    }
  }
});

// Class methods
Achievement.findFeatured = function() {
  return this.scope('featured').findAll();
};

Achievement.findByCategory = function(category) {
  return this.findAll({
    where: { category: category },
    order: [['rarity', 'DESC'], ['created_at', 'DESC']]
  });
};

Achievement.findByRarity = function(rarity) {
  return this.findAll({
    where: { rarity: rarity },
    order: [['created_at', 'DESC']]
  });
};

module.exports = Achievement;
