const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const CourseEnrollment = sequelize.define('CourseEnrollment', {
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
    }
  },
  course_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  progress: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  status: {
    type: DataTypes.ENUM('completed', 'in-progress', 'not-started'),
    allowNull: false,
    defaultValue: 'not-started'
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  completion_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  rating: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0,
      max: 5
    }
  },
  payment_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'course_payments',
      key: 'id'
    }
  },
  enrollment_type: {
    type: DataTypes.ENUM('free', 'paid', 'gifted'),
    allowNull: false,
    defaultValue: 'free'
  }
}, {
  tableName: 'course_enrollments',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['course_id'] },
    { fields: ['status'] },
    { unique: true, fields: ['user_id', 'course_id'] }
  ]
});

// Class methods
CourseEnrollment.findByUser = function(userId) {
  return this.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']]
  });
};

CourseEnrollment.findByCourse = function(courseId) {
  return this.findAll({
    where: { course_id: courseId },
    order: [['created_at', 'DESC']]
  });
};

module.exports = CourseEnrollment;
