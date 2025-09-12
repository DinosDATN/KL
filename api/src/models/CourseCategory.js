const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const CourseCategory = sequelize.define('CourseCategory', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'course_categories',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['name'] }
  ]
});

// Class methods
CourseCategory.findActive = function() {
  return this.findAll({
    order: [['name', 'ASC']]
  });
};

module.exports = CourseCategory;
