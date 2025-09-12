const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Tag = sequelize.define('Tag', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  }
}, {
  tableName: 'tags',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['name'] }
  ]
});

module.exports = Tag;
