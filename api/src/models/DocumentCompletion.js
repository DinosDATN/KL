const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const DocumentCompletion = sequelize.define('DocumentCompletion', {
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
  document_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'documents',
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
  tableName: 'document_completions',
  timestamps: false,
  underscored: true,
  indexes: [
    { 
      fields: ['user_id', 'document_id'], 
      unique: true 
    },
    { fields: ['user_id'] },
    { fields: ['document_id'] },
    { fields: ['completed_at'] }
  ]
});

// Class methods
DocumentCompletion.findByUser = function(userId) {
  return this.findAll({
    where: { user_id: userId },
    order: [['completed_at', 'DESC']]
  });
};

DocumentCompletion.findByDocument = function(documentId) {
  return this.findAll({
    where: { document_id: documentId },
    order: [['completed_at', 'DESC']]
  });
};

DocumentCompletion.isCompleted = function(userId, documentId) {
  return this.findOne({
    where: { 
      user_id: userId,
      document_id: documentId
    }
  }).then(completion => !!completion);
};

module.exports = DocumentCompletion;
