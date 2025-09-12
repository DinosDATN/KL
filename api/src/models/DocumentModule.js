const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const DocumentModule = sequelize.define('DocumentModule', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
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
  tableName: 'document_modules',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['document_id'] },
    { fields: ['document_id', 'position'], unique: true }
  ]
});

// Class methods
DocumentModule.findByDocument = function(documentId) {
  return this.findAll({
    where: { document_id: documentId },
    order: [['position', 'ASC']]
  });
};

module.exports = DocumentModule;
