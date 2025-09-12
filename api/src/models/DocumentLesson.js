const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const DocumentLesson = sequelize.define('DocumentLesson', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  module_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'document_modules',
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
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  code_example: {
    type: DataTypes.TEXT,
    allowNull: true
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
  tableName: 'document_lessons',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['module_id'] },
    { fields: ['module_id', 'position'], unique: true }
  ]
});

// Class methods
DocumentLesson.findByModule = function(moduleId) {
  return this.findAll({
    where: { module_id: moduleId },
    order: [['position', 'ASC']]
  });
};

DocumentLesson.findByDocument = function(documentId) {
  const DocumentModule = require('./DocumentModule');
  return this.findAll({
    include: [{
      model: DocumentModule,
      where: { document_id: documentId },
      attributes: []
    }],
    order: [
      [DocumentModule, 'position', 'ASC'],
      ['position', 'ASC']
    ]
  });
};

module.exports = DocumentLesson;
