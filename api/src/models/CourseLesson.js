const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const CourseLesson = sequelize.define('CourseLesson', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  module_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'course_modules',
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
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    },
    comment: 'Duration in minutes'
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  type: {
    type: DataTypes.ENUM('document', 'video', 'exercise', 'quiz'),
    allowNull: false,
    defaultValue: 'document'
  }
}, {
  tableName: 'course_lessons',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['module_id'] },
    { fields: ['position'] },
    { fields: ['type'] },
    { unique: true, fields: ['module_id', 'position'] }
  ]
});

// Class methods
CourseLesson.findByModule = function(moduleId) {
  return this.findAll({
    where: { module_id: moduleId },
    order: [['position', 'ASC']]
  });
};

CourseLesson.findByCourse = function(courseId) {
  const CourseModule = require('./CourseModule');
  return this.findAll({
    include: [{
      model: CourseModule,
      as: 'Module',
      where: { course_id: courseId },
      attributes: ['id', 'title', 'position']
    }],
    order: [['Module', 'position', 'ASC'], ['position', 'ASC']]
  });
};

module.exports = CourseLesson;
