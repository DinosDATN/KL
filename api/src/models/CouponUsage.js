const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const CouponUsage = sequelize.define('CouponUsage', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  coupon_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'course_coupons',
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
  payment_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'course_payments',
      key: 'id'
    }
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  used_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'coupon_usage',
  timestamps: false,
  indexes: [
    { fields: ['coupon_id'] },
    { fields: ['user_id'] },
    { unique: true, fields: ['user_id', 'coupon_id', 'payment_id'] }
  ]
});

module.exports = CouponUsage;
