const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const DocumentCategory = sequelize.define('DocumentCategory', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'document_categories',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['name'], unique: true }
  ]
});

// Class methods
DocumentCategory.findActive = function() {
  return this.findAll({
    order: [['name', 'ASC']]
  });
};

module.exports = DocumentCategory;
