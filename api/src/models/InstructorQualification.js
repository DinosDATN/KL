const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const InstructorQualification = sequelize.define('InstructorQualification', {
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
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  institution: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  credential_url: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'instructor_qualifications',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'] }
  ]
});

// Class methods
InstructorQualification.findByInstructor = function(instructorId) {
  return this.findAll({
    where: { user_id: instructorId },
    order: [['date', 'DESC']]
  });
};

module.exports = InstructorQualification;
