const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const DocumentLessonCompletion = sequelize.define('DocumentLessonCompletion', {
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
    },
    onDelete: 'CASCADE'
  },
  lesson_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'document_lessons',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'document_lesson_completions',
  timestamps: false,
  underscored: true,
  indexes: [
    { 
      fields: ['user_id', 'lesson_id'], 
      unique: true 
    },
    { fields: ['user_id'] },
    { fields: ['lesson_id'] },
    { fields: ['completed_at'] }
  ]
});

// Class methods
DocumentLessonCompletion.findByUser = function(userId) {
  return this.findAll({
    where: { user_id: userId },
    order: [['completed_at', 'DESC']]
  });
};

DocumentLessonCompletion.findByLesson = function(lessonId) {
  return this.findAll({
    where: { lesson_id: lessonId },
    order: [['completed_at', 'DESC']]
  });
};

DocumentLessonCompletion.isCompleted = function(userId, lessonId) {
  return this.findOne({
    where: { 
      user_id: userId,
      lesson_id: lessonId
    }
  }).then(completion => !!completion);
};

module.exports = DocumentLessonCompletion;
