const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Animation = sequelize.define('Animation', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  document_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'documents',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  lesson_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'document_lessons',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'animation'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  embed_code: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'animations',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['document_id'] },
    { fields: ['lesson_id'] },
    { fields: ['type'] }
  ],
  validate: {
    // At least one of document_id or lesson_id must be provided
    atLeastOneReference() {
      if (!this.document_id && !this.lesson_id) {
        throw new Error('Animation must be associated with either a document or a lesson');
      }
    }
  }
});

// Class methods
Animation.findByDocument = function(documentId) {
  return this.findAll({
    where: { document_id: documentId },
    order: [['created_at', 'ASC']]
  });
};

Animation.findByLesson = function(lessonId) {
  return this.findAll({
    where: { lesson_id: lessonId },
    order: [['created_at', 'ASC']]
  });
};

module.exports = Animation;
