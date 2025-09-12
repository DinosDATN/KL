const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const CourseModule = sequelize.define('CourseModule', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  course_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  }
}, {
  tableName: 'course_modules',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['course_id'] },
    { fields: ['position'] },
    { unique: true, fields: ['course_id', 'position'] }
  ]
});

// Class methods
CourseModule.findByCourse = function(courseId) {
  return this.findAll({
    where: { course_id: courseId },
    order: [['position', 'ASC']]
  });
};

module.exports = CourseModule;
