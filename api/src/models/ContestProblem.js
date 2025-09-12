const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const ContestProblem = sequelize.define('ContestProblem', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  contest_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'contests',
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
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100,
    validate: {
      min: {
        args: [0],
        msg: 'Score must be a positive number'
      },
      max: {
        args: [1000],
        msg: 'Score cannot exceed 1000 points'
      }
    }
  }
}, {
  tableName: 'contest_problems',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['contest_id', 'problem_id']
    },
    {
      fields: ['contest_id']
    },
    {
      fields: ['problem_id']
    }
  ]
});

module.exports = ContestProblem;
