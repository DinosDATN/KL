const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Topic = sequelize.define('Topic', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  }
}, {
  tableName: 'topics',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['name'], unique: true }
  ]
});

// Class methods
Topic.findActive = function() {
  return this.findAll({
    order: [['name', 'ASC']]
  });
};

module.exports = Topic;
