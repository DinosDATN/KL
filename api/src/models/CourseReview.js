const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const CourseReview = sequelize.define('CourseReview', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  course_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  rating: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  helpful: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  not_helpful: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'course_reviews',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['course_id'] },
    { fields: ['user_id'] },
    { fields: ['rating'] },
    { fields: ['verified'] },
    { unique: true, fields: ['course_id', 'user_id'] }
  ]
});

// Class methods
CourseReview.findByCourse = function(courseId) {
  return this.findAll({
    where: { course_id: courseId },
    order: [['helpful', 'DESC'], ['created_at', 'DESC']]
  });
};

CourseReview.getAverageRating = async function(courseId) {
  const result = await this.findOne({
    where: { course_id: courseId },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('rating')), 'average_rating'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'review_count']
    ]
  });
  
  return {
    average_rating: parseFloat(result?.getDataValue('average_rating') || 0),
    review_count: parseInt(result?.getDataValue('review_count') || 0)
  };
};

module.exports = CourseReview;
