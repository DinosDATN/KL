const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Submission = sequelize.define('Submission', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  problem_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'problems',
      key: 'id'
    }
  },
  code_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'submission_codes',
      key: 'id'
    }
  },
  language: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'wrong', 'error', 'timeout'),
    allowNull: false
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  exec_time: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  memory_used: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'submissions',
  timestamps: false,
  underscored: true,
  indexes: [
    { fields: ['user_id', 'problem_id'] },
    { fields: ['problem_id'] },
    { fields: ['user_id'] },
    { fields: ['status'] },
    { fields: ['submitted_at'] }
  ]
});

module.exports = Submission;
