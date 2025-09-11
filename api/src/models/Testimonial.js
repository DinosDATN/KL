const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Testimonial = sequelize.define('Testimonial', {
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
  student_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  student_avatar: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rating: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0,
      max: 5
    }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  course_title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  }
}, {
  tableName: 'testimonials',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['instructor_id'] },
    { fields: ['rating'] },
    { fields: ['date'] }
  ],
  scopes: {
    featured: {
      where: {
        rating: { [sequelize.Sequelize.Op.gte]: 4.0 }
      },
      order: [['rating', 'DESC'], ['date', 'DESC']],
      limit: 6
    },
    recent: {
      order: [['date', 'DESC'], ['rating', 'DESC']],
      limit: 10
    }
  }
});

// Class methods
Testimonial.findFeatured = function() {
  return this.scope('featured').findAll();
};

Testimonial.findRecent = function() {
  return this.scope('recent').findAll();
};

Testimonial.findByInstructor = function(instructorId) {
  return this.findAll({
    where: { instructor_id: instructorId },
    order: [['date', 'DESC'], ['rating', 'DESC']]
  });
};

Testimonial.findByRating = function(minRating = 4.0) {
  return this.findAll({
    where: {
      rating: { [sequelize.Sequelize.Op.gte]: minRating }
    },
    order: [['rating', 'DESC'], ['date', 'DESC']]
  });
};

module.exports = Testimonial;
