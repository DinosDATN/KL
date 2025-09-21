const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const JudgeSubmission = sequelize.define('JudgeSubmission', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: 'Judge0 submission token'
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  problem_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'problems',
      key: 'id'
    }
  },
  source_code: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    comment: 'The source code that was submitted'
  },
  language: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Programming language name'
  },
  language_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Judge0 language ID'
  },
  stdin: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Standard input for the program'
  },
  expected_output: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Expected output for comparison'
  },
  stdout: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Program output'
  },
  stderr: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error output'
  },
  compile_output: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Compilation output/errors'
  },
  status_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Judge0 status ID'
  },
  status_description: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Human readable status'
  },
  execution_time: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Execution time in seconds'
  },
  memory_used: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Memory used in KB'
  },
  is_base64_encoded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Whether the submission used base64 encoding'
  },
  cpu_time_limit: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'CPU time limit in seconds'
  },
  memory_limit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Memory limit in KB'
  },
  submission_type: {
    type: DataTypes.ENUM('execute', 'submit', 'test'),
    defaultValue: 'execute',
    allowNull: false,
    comment: 'Type of submission'
  },
  is_completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Whether the submission processing is complete'
  },
  raw_response: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Full Judge0 API response for debugging'
  }
}, {
  tableName: 'judge_submissions',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['token'], unique: true },
    { fields: ['user_id'] },
    { fields: ['problem_id'] },
    { fields: ['language'] },
    { fields: ['status_id'] },
    { fields: ['is_completed'] },
    { fields: ['submission_type'] },
    { fields: ['created_at'] }
  ]
});

module.exports = JudgeSubmission;
