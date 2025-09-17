const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const SubmissionTestResult = sequelize.define('SubmissionTestResult', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  submission_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'submissions',
      key: 'id'
    }
  },
  test_case_id: {
    type: DataTypes.BIGINT,
    allowNull: true,  // May not always reference a specific test case
    references: {
      model: 'test_cases',
      key: 'id'
    }
  },
  input: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  expected_output: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  actual_output: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  passed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  execution_time: {
    type: DataTypes.INTEGER, // in milliseconds
    allowNull: true,
    validate: {
      min: 0
    }
  },
  memory_used: {
    type: DataTypes.INTEGER, // in KB
    allowNull: true,
    validate: {
      min: 0
    }
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'submission_test_results',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['submission_id'] },
    { fields: ['test_case_id'] },
    { fields: ['passed'] }
  ]
});

module.exports = SubmissionTestResult;
