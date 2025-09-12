const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const SubmissionCode = sequelize.define('SubmissionCode', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  source_code: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'submission_codes',
  timestamps: true,
  underscored: true
});

module.exports = SubmissionCode;
