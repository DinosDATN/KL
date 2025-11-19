const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const CoursePayment = sequelize.define('CoursePayment', {
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
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Số tiền thanh toán'
  },
  original_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Giá gốc'
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Số tiền giảm giá'
  },
  payment_method: {
    type: DataTypes.ENUM('credit_card', 'debit_card', 'bank_transfer', 'e_wallet', 'paypal', 'momo', 'vnpay', 'zalopay'),
    allowNull: false
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false
  },
  transaction_id: {
    type: DataTypes.STRING(255),
    unique: true,
    comment: 'Mã giao dịch từ cổng thanh toán'
  },
  payment_gateway: {
    type: DataTypes.STRING(100),
    comment: 'Tên cổng thanh toán'
  },
  payment_date: {
    type: DataTypes.DATE,
    comment: 'Ngày thanh toán thành công'
  },
  refund_date: {
    type: DataTypes.DATE,
    comment: 'Ngày hoàn tiền'
  },
  refund_reason: {
    type: DataTypes.TEXT,
    comment: 'Lý do hoàn tiền'
  },
  notes: {
    type: DataTypes.TEXT,
    comment: 'Ghi chú'
  },
  metadata: {
    type: DataTypes.JSON,
    comment: 'Thông tin bổ sung từ payment gateway'
  }
}, {
  tableName: 'course_payments',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['course_id'] },
    { fields: ['payment_status'] },
    { fields: ['transaction_id'] },
    { fields: ['payment_date'] }
  ]
});

// Instance methods
CoursePayment.prototype.markAsCompleted = async function(transactionId, paymentGateway, metadata = {}) {
  this.payment_status = 'completed';
  this.payment_date = new Date();
  this.transaction_id = transactionId;
  this.payment_gateway = paymentGateway;
  this.metadata = metadata;
  return await this.save();
};

CoursePayment.prototype.markAsFailed = async function(reason) {
  this.payment_status = 'failed';
  this.notes = reason;
  return await this.save();
};

CoursePayment.prototype.refund = async function(reason) {
  this.payment_status = 'refunded';
  this.refund_date = new Date();
  this.refund_reason = reason;
  return await this.save();
};

// Class methods
CoursePayment.findByUser = function(userId, status = null) {
  const where = { user_id: userId };
  if (status) {
    where.payment_status = status;
  }
  return this.findAll({ where, order: [['created_at', 'DESC']] });
};

CoursePayment.findByCourse = function(courseId, status = null) {
  const where = { course_id: courseId };
  if (status) {
    where.payment_status = status;
  }
  return this.findAll({ where, order: [['created_at', 'DESC']] });
};

CoursePayment.getTotalRevenue = async function(courseId = null) {
  const where = { payment_status: 'completed' };
  if (courseId) {
    where.course_id = courseId;
  }
  
  const result = await this.findAll({
    where,
    attributes: [
      [sequelize.fn('SUM', sequelize.col('amount')), 'total_revenue'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_payments']
    ],
    raw: true
  });
  
  return {
    totalRevenue: parseFloat(result[0].total_revenue) || 0,
    totalPayments: parseInt(result[0].total_payments) || 0
  };
};

module.exports = CoursePayment;
