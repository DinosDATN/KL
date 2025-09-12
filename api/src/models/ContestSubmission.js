const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const ContestSubmission = sequelize.define('ContestSubmission', {
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
  contest_problem_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'contest_problems',
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
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Programming language is required'
      }
    }
  },
  status: {
    type: DataTypes.ENUM('accepted', 'wrong', 'error'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['accepted', 'wrong', 'error']],
        msg: 'Status must be one of: accepted, wrong, error'
      }
    }
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'Score must be a non-negative number'
      }
    }
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'contest_submissions',
  timestamps: false,
  indexes: [
    {
      fields: ['contest_problem_id', 'user_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['contest_problem_id']
    },
    {
      fields: ['submitted_at']
    }
  ]
});

module.exports = ContestSubmission;
