const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const DocumentCategoryLink = sequelize.define('DocumentCategoryLink', {
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
  category_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'document_categories',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'document_category_links',
  timestamps: true,
  underscored: true,
  indexes: [
    { 
      fields: ['document_id', 'category_id'], 
      unique: true 
    },
    { fields: ['document_id'] },
    { fields: ['category_id'] }
  ]
});

// Class methods
DocumentCategoryLink.findByDocument = function(documentId) {
  return this.findAll({
    where: { document_id: documentId }
  });
};

DocumentCategoryLink.findByCategory = function(categoryId) {
  return this.findAll({
    where: { category_id: categoryId }
  });
};

module.exports = DocumentCategoryLink;
