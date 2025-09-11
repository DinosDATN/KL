const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Problem = sequelize.define('Problem', {
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
  difficulty: {
    type: DataTypes.ENUM('Easy', 'Medium', 'Hard'),
    allowNull: false
  },
  estimated_time: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  dislikes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  acceptance: {
    type: DataTypes.DECIMAL(5,2),
    defaultValue: 0.0,
    allowNull: false,
    validate: {
      min: 0,
      max: 100
    }
  },
  total_submissions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  solved_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  is_new: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  is_popular: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  is_premium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  category_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'problem_categories',
      key: 'id'
    }
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
  tableName: 'problems',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['category_id'] },
    { fields: ['difficulty'] },
    { fields: ['is_new'] },
    { fields: ['is_popular'] },
    { fields: ['is_premium'] },
    { fields: ['is_deleted'] },
    { fields: ['created_by'] }
  ],
  scopes: {
    published: {
      where: { is_deleted: false }
    },
    featured: {
      where: { 
        is_deleted: false,
        is_popular: true
      },
      order: [['likes', 'DESC'], ['solved_count', 'DESC']],
      limit: 6
    },
    byDifficulty: (difficulty) => ({
      where: { 
        is_deleted: false,
        difficulty: difficulty
      }
    })
  }
});

// Instance methods
Problem.prototype.getLikeRatio = function() {
  const total = this.likes + this.dislikes;
  return total > 0 ? (this.likes / total * 100) : 0;
};

Problem.prototype.getAcceptanceRate = function() {
  return this.total_submissions > 0 
    ? (this.solved_count / this.total_submissions * 100) 
    : 0;
};

// Class methods
Problem.findFeatured = function() {
  return this.scope('featured').findAll();
};

Problem.findByDifficulty = function(difficulty) {
  return this.scope({ method: ['byDifficulty', difficulty] }).findAll();
};

Problem.findByCategory = function(categoryId) {
  return this.scope('published').findAll({
    where: { category_id: categoryId }
  });
};

Problem.findPopular = function() {
  return this.scope('published').findAll({
    where: { is_popular: true },
    order: [['likes', 'DESC']]
  });
};

Problem.findNew = function() {
  return this.scope('published').findAll({
    where: { is_new: true },
    order: [['created_at', 'DESC']]
  });
};

module.exports = Problem;
