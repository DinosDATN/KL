const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const StarterCode = sequelize.define('StarterCode', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  problem_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'problems',
      key: 'id'
    }
  },
  language: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  code: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'starter_codes',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['problem_id'] },
    { fields: ['problem_id', 'language'], unique: true }
  ]
});

module.exports = StarterCode;
