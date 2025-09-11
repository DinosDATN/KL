const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  topic_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'topics',
      key: 'id'
    }
  },
  level: {
    type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
    defaultValue: 'Beginner',
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  students: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0,
      max: 5
    }
  },
  thumbnail_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
}, {
  tableName: 'documents',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['created_by'] },
    { fields: ['topic_id'] },
    { fields: ['level'] },
    { fields: ['is_deleted'] }
  ],
  scopes: {
    published: {
      where: { is_deleted: false }
    },
    featured: {
      where: { 
        is_deleted: false,
        rating: { [sequelize.Sequelize.Op.gte]: 4.0 }
      },
      order: [['rating', 'DESC'], ['students', 'DESC']],
      limit: 6
    }
  }
});

// Class methods
Document.findFeatured = function() {
  return this.scope('featured').findAll();
};

Document.findByTopic = function(topicId) {
  return this.scope('published').findAll({
    where: { topic_id: topicId }
  });
};

Document.findByCreator = function(creatorId) {
  return this.scope('published').findAll({
    where: { created_by: creatorId }
  });
};

module.exports = Document;
