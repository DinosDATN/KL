const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const ProblemCategory = sequelize.define('ProblemCategory', {
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
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'problem_categories',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['name'] }
  ]
});

module.exports = ProblemCategory;
