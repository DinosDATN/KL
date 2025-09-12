const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const ProblemTag = sequelize.define('ProblemTag', {
  problem_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'problems',
      key: 'id'
    }
  },
  tag_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'tags',
      key: 'id'
    }
  }
}, {
  tableName: 'problem_tags',
  timestamps: false,
  underscored: true,
  primaryKey: ['problem_id', 'tag_id']
});

module.exports = ProblemTag;
