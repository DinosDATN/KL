const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const ProblemComment = sequelize.define('ProblemComment', {
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
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'problem_comments',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['problem_id'] },
    { fields: ['user_id'] }
  ]
});

module.exports = ProblemComment;
