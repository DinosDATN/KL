const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const ProblemExample = sequelize.define('ProblemExample', {
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
  output: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'problem_examples',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['problem_id'] }
  ]
});

module.exports = ProblemExample;
