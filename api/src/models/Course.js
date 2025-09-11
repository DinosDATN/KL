const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  instructor_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  thumbnail: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  publish_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('published', 'draft', 'archived'),
    defaultValue: 'draft',
    allowNull: false
  },
  revenue: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
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
  description: {
    type: DataTypes.TEXT,
    allowNull: true
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
  category_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'course_categories',
      key: 'id'
    }
  },
  is_premium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  original_price: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  discount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  }
}, {
  tableName: 'courses',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['instructor_id'] },
    { fields: ['category_id'] },
    { fields: ['status'] },
    { fields: ['level'] },
    { fields: ['is_premium'] },
    { fields: ['is_deleted'] }
  ],
  scopes: {
    published: {
      where: { status: 'published', is_deleted: false }
    },
    featured: {
      where: { 
        status: 'published', 
        is_deleted: false,
        rating: { [sequelize.Sequelize.Op.gte]: 4.0 }
      },
      order: [['rating', 'DESC'], ['students', 'DESC']],
      limit: 6
    }
  }
});

// Instance methods
Course.prototype.getDiscountedPrice = function() {
  if (this.discount && this.original_price) {
    return this.original_price * (1 - this.discount / 100);
  }
  return this.price || this.original_price || 0;
};

// Class methods
Course.findFeatured = function() {
  return this.scope('featured').findAll();
};

Course.findByInstructor = function(instructorId) {
  return this.scope('published').findAll({
    where: { instructor_id: instructorId }
  });
};

Course.findByCategory = function(categoryId) {
  return this.scope('published').findAll({
    where: { category_id: categoryId }
  });
};

module.exports = Course;
