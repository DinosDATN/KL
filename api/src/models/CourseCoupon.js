const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const CourseCoupon = sequelize.define('CourseCoupon', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    comment: 'Mã giảm giá'
  },
  description: {
    type: DataTypes.TEXT,
    comment: 'Mô tả'
  },
  discount_type: {
    type: DataTypes.ENUM('percentage', 'fixed_amount'),
    allowNull: false,
    comment: 'Loại giảm giá'
  },
  discount_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Giá trị giảm'
  },
  min_purchase_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Giá trị đơn hàng tối thiểu'
  },
  max_discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Số tiền giảm tối đa (cho % discount)'
  },
  usage_limit: {
    type: DataTypes.INTEGER,
    comment: 'Số lần sử dụng tối đa'
  },
  used_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Số lần đã sử dụng'
  },
  valid_from: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Ngày bắt đầu hiệu lực'
  },
  valid_until: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Ngày hết hạn'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  applicable_courses: {
    type: DataTypes.JSON,
    comment: 'Danh sách course_id áp dụng (null = tất cả)'
  },
  created_by: {
    type: DataTypes.BIGINT,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'course_coupons',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['code'] },
    { fields: ['valid_from', 'valid_until'] },
    { fields: ['is_active'] }
  ]
});

// Instance methods
CourseCoupon.prototype.isValid = function(courseId = null, purchaseAmount = 0) {
  const now = new Date();
  
  // Check if active
  if (!this.is_active) {
    return { valid: false, reason: 'Mã giảm giá không còn hiệu lực' };
  }
  
  // Check date range
  if (now < this.valid_from) {
    return { valid: false, reason: 'Mã giảm giá chưa có hiệu lực' };
  }
  
  if (now > this.valid_until) {
    return { valid: false, reason: 'Mã giảm giá đã hết hạn' };
  }
  
  // Check usage limit
  if (this.usage_limit && this.used_count >= this.usage_limit) {
    return { valid: false, reason: 'Mã giảm giá đã hết lượt sử dụng' };
  }
  
  // Check minimum purchase amount
  if (purchaseAmount < this.min_purchase_amount) {
    return { 
      valid: false, 
      reason: `Đơn hàng tối thiểu ${this.min_purchase_amount.toLocaleString('vi-VN')}đ` 
    };
  }
  
  // Check applicable courses
  if (courseId && this.applicable_courses && Array.isArray(this.applicable_courses)) {
    if (!this.applicable_courses.includes(courseId)) {
      return { valid: false, reason: 'Mã giảm giá không áp dụng cho khóa học này' };
    }
  }
  
  return { valid: true };
};

CourseCoupon.prototype.calculateDiscount = function(originalAmount) {
  if (this.discount_type === 'percentage') {
    let discount = originalAmount * (this.discount_value / 100);
    
    // Apply max discount limit if set
    if (this.max_discount_amount && discount > this.max_discount_amount) {
      discount = this.max_discount_amount;
    }
    
    return Math.round(discount);
  } else {
    // Fixed amount
    return Math.min(this.discount_value, originalAmount);
  }
};

CourseCoupon.prototype.incrementUsage = async function() {
  this.used_count += 1;
  return await this.save();
};

// Class methods
CourseCoupon.findByCode = function(code) {
  return this.findOne({ where: { code: code.toUpperCase() } });
};

CourseCoupon.findActive = function() {
  const now = new Date();
  return this.findAll({
    where: {
      is_active: true,
      valid_from: { [sequelize.Sequelize.Op.lte]: now },
      valid_until: { [sequelize.Sequelize.Op.gte]: now }
    },
    order: [['created_at', 'DESC']]
  });
};

module.exports = CourseCoupon;
