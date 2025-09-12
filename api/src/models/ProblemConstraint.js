const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const ProblemConstraint = sequelize.define('ProblemConstraint', {
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
  constraint_text: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'problem_constraints',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['problem_id'] }
  ]
});

module.exports = ProblemConstraint;
