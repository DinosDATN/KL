const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const CourseLessonCompletion = sequelize.define('CourseLessonCompletion', {
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
  course_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  lesson_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'course_lessons',
      key: 'id'
    }
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  time_spent: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Time spent in seconds'
  }
}, {
  tableName: 'course_lesson_completions',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id', 'course_id'] },
    { fields: ['lesson_id'] },
    { unique: true, fields: ['user_id', 'lesson_id'] }
  ]
});

// Class methods
CourseLessonCompletion.findByUserAndCourse = function(userId, courseId) {
  return this.findAll({
    where: { user_id: userId, course_id: courseId },
    order: [['completed_at', 'DESC']]
  });
};

CourseLessonCompletion.findByUserAndLesson = function(userId, lessonId) {
  return this.findOne({
    where: { user_id: userId, lesson_id: lessonId }
  });
};

CourseLessonCompletion.getCompletedLessonIds = async function(userId, courseId) {
  const completions = await this.findAll({
    where: { user_id: userId, course_id: courseId },
    attributes: ['lesson_id']
  });
  return completions.map(c => c.lesson_id);
};

module.exports = CourseLessonCompletion;
