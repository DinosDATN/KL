const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const TestCase = sequelize.define('TestCase', {
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
  input: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  expected_output: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  is_sample: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
}, {
  tableName: 'test_cases',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['problem_id'] },
    { fields: ['problem_id', 'is_sample'] }
  ]
});

module.exports = TestCase;
