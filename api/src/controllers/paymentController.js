const CoursePayment = require('../models/CoursePayment');
const CourseCoupon = require('../models/CourseCoupon');
const CouponUsage = require('../models/CouponUsage');
const Course = require('../models/Course');
const CourseEnrollment = require('../models/CourseEnrollment');
const { sequelize } = require('../config/sequelize');

class PaymentController {
  /**
   * Tạo payment intent (bước 1: tính toán giá)
   */
  async createPaymentIntent(req, res) {
    try {
      const { courseId } = req.params;
      const { couponCode } = req.body;
      const userId = req.user.id;

      // Kiểm tra khóa học
      const course = await Course.findOne({
        where: { id: courseId, status: 'published', is_deleted: false }
      });

      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Khóa học không tồn tại'
        });
      }

      // Kiểm tra khóa học miễn phí
      const coursePrice = course.price || course.original_price || 0;
      if (coursePrice === 0) {
        return res.status(400).json({
          success: false,
          message: 'Khóa học này miễn phí, không cần thanh toán'
        });
      }

      // Kiểm tra đã đăng ký chưa
      const existingEnrollment = await CourseEnrollment.findOne({
        where: { user_id: userId, course_id: courseId }
      });

      if (existingEnrollment) {
        return res.status(400).json({
          success: false,
          message: 'Bạn đã đăng ký khóa học này rồi'
        });
      }

      let originalAmount = coursePrice;
      let discountAmount = 0;
      let finalAmount = originalAmount;
      let coupon = null;

      // Áp dụng mã giảm giá nếu có
      if (couponCode) {
        coupon = await CourseCoupon.findByCode(couponCode);
        
        if (!coupon) {
          return res.status(404).json({
            success: false,
            message: 'Mã giảm giá không tồn tại'
          });
        }

        const validation = coupon.isValid(courseId, originalAmount);
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            message: validation.reason
          });
        }

        discountAmount = coupon.calculateDiscount(originalAmount);
        finalAmount = originalAmount - discountAmount;
      }

      res.status(200).json({
        success: true,
        data: {
          courseId: course.id,
          courseTitle: course.title,
          originalAmount,
          discountAmount,
          finalAmount,
          coupon: coupon ? {
            code: coupon.code,
            description: coupon.description,
            discountType: coupon.discount_type,
            discountValue: coupon.discount_value
          } : null
        }
      });
    } catch (error) {
      console.error('Error in createPaymentIntent:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo payment intent',
        error: error.message
      });
    }
  }

  /**
   * Xử lý thanh toán (bước 2: thực hiện thanh toán)
   */
  async processPayment(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const { courseId } = req.params;
      const { paymentMethod, couponCode, returnUrl } = req.body;
      const userId = req.user.id;

      // Validate payment method
      const validMethods = ['credit_card', 'debit_card', 'bank_transfer', 'e_wallet', 'paypal', 'momo', 'vnpay', 'zalopay'];
      if (!validMethods.includes(paymentMethod)) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Phương thức thanh toán không hợp lệ'
        });
      }

      // Kiểm tra khóa học
      const course = await Course.findOne({
        where: { id: courseId, status: 'published', is_deleted: false },
        transaction
      });

      if (!course) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Khóa học không tồn tại'
        });
      }

      const coursePrice = course.price || course.original_price || 0;
      if (coursePrice === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Khóa học này miễn phí'
        });
      }

      // Kiểm tra đã đăng ký
      const existingEnrollment = await CourseEnrollment.findOne({
        where: { user_id: userId, course_id: courseId },
        transaction
      });

      if (existingEnrollment) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Bạn đã đăng ký khóa học này'
        });
      }

      let originalAmount = coursePrice;
      let discountAmount = 0;
      let finalAmount = originalAmount;
      let coupon = null;

      // Áp dụng coupon
      if (couponCode) {
        coupon = await CourseCoupon.findByCode(couponCode);
        
        if (coupon) {
          const validation = coupon.isValid(courseId, originalAmount);
          if (validation.valid) {
            discountAmount = coupon.calculateDiscount(originalAmount);
            finalAmount = originalAmount - discountAmount;
          }
        }
      }

      // Tạo payment record
      const payment = await CoursePayment.create({
        user_id: userId,
        course_id: courseId,
        amount: finalAmount,
        original_amount: originalAmount,
        discount_amount: discountAmount,
        payment_method: paymentMethod,
        payment_status: 'pending',
        notes: `Payment for course: ${course.title}`
      }, { transaction });

      // Trong môi trường thực tế, đây là nơi gọi API payment gateway
      // Ví dụ: VNPay, MoMo, ZaloPay, etc.
      // Hiện tại chúng ta sẽ simulate thành công ngay
      
      const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      await payment.markAsCompleted(transactionId, paymentMethod, {
        simulatedPayment: true,
        timestamp: new Date().toISOString()
      });

      // Tạo enrollment sau khi thanh toán thành công
      const enrollment = await CourseEnrollment.create({
        user_id: userId,
        course_id: courseId,
        payment_id: payment.id,
        enrollment_type: 'paid',
        progress: 0,
        status: 'not-started',
        start_date: new Date()
      }, { transaction });

      // Cập nhật số lượng học viên
      await Course.increment('students', { 
        where: { id: courseId },
        transaction 
      });

      // Lưu coupon usage nếu có
      if (coupon && discountAmount > 0) {
        await CouponUsage.create({
          coupon_id: coupon.id,
          user_id: userId,
          payment_id: payment.id,
          discount_amount: discountAmount
        }, { transaction });

        await coupon.incrementUsage();
      }

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: 'Thanh toán thành công',
        data: {
          payment: {
            id: payment.id,
            transactionId: payment.transaction_id,
            amount: payment.amount,
            status: payment.payment_status,
            paymentDate: payment.payment_date
          },
          enrollment: {
            id: enrollment.id,
            courseId: enrollment.course_id,
            status: enrollment.status
          },
          redirectUrl: `/courses/${courseId}/learn`
        }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error in processPayment:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xử lý thanh toán',
        error: error.message
      });
    }
  }

  /**
   * Lấy lịch sử thanh toán của user
   */
  async getMyPayments(req, res) {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      const payments = await CoursePayment.findByUser(userId, status);

      // Include course info
      const paymentsWithCourse = await CoursePayment.findAll({
        where: { user_id: userId, ...(status && { payment_status: status }) },
        include: [{
          model: Course,
          as: 'Course',
          attributes: ['id', 'title', 'thumbnail', 'level']
        }],
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: paymentsWithCourse
      });
    } catch (error) {
      console.error('Error in getMyPayments:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy lịch sử thanh toán',
        error: error.message
      });
    }
  }

  /**
   * Lấy chi tiết một payment
   */
  async getPaymentDetail(req, res) {
    try {
      const { paymentId } = req.params;
      const userId = req.user.id;

      const payment = await CoursePayment.findOne({
        where: { id: paymentId, user_id: userId },
        include: [{
          model: Course,
          as: 'Course',
          attributes: ['id', 'title', 'thumbnail', 'level', 'instructor_id']
        }]
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin thanh toán'
        });
      }

      res.status(200).json({
        success: true,
        data: payment
      });
    } catch (error) {
      console.error('Error in getPaymentDetail:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy chi tiết thanh toán',
        error: error.message
      });
    }
  }

  /**
   * Validate coupon
   */
  async validateCoupon(req, res) {
    try {
      const { code } = req.params;
      const { courseId, amount } = req.query;

      const coupon = await CourseCoupon.findByCode(code);

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Mã giảm giá không tồn tại'
        });
      }

      const validation = coupon.isValid(
        courseId ? parseInt(courseId) : null,
        amount ? parseFloat(amount) : 0
      );

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.reason
        });
      }

      const discountAmount = amount ? coupon.calculateDiscount(parseFloat(amount)) : 0;

      res.status(200).json({
        success: true,
        message: 'Mã giảm giá hợp lệ',
        data: {
          coupon: {
            code: coupon.code,
            description: coupon.description,
            discountType: coupon.discount_type,
            discountValue: coupon.discount_value
          },
          discountAmount,
          finalAmount: amount ? parseFloat(amount) - discountAmount : 0
        }
      });
    } catch (error) {
      console.error('Error in validateCoupon:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi validate coupon',
        error: error.message
      });
    }
  }

  /**
   * Lấy danh sách coupon đang active
   */
  async getActiveCoupons(req, res) {
    try {
      const coupons = await CourseCoupon.findActive();

      res.status(200).json({
        success: true,
        data: coupons
      });
    } catch (error) {
      console.error('Error in getActiveCoupons:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách mã giảm giá',
        error: error.message
      });
    }
  }

  /**
   * Yêu cầu hoàn tiền (refund)
   */
  async requestRefund(req, res) {
    try {
      const { paymentId } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;

      const payment = await CoursePayment.findOne({
        where: { id: paymentId, user_id: userId }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin thanh toán'
        });
      }

      if (payment.payment_status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Chỉ có thể hoàn tiền cho thanh toán đã hoàn thành'
        });
      }

      // Kiểm tra thời gian (ví dụ: chỉ cho phép refund trong 7 ngày)
      const daysSincePayment = Math.floor(
        (new Date() - new Date(payment.payment_date)) / (1000 * 60 * 60 * 24)
      );

      if (daysSincePayment > 7) {
        return res.status(400).json({
          success: false,
          message: 'Đã quá thời hạn hoàn tiền (7 ngày)'
        });
      }

      await payment.refund(reason);

      // Xóa enrollment nếu có
      await CourseEnrollment.destroy({
        where: { payment_id: paymentId }
      });

      res.status(200).json({
        success: true,
        message: 'Yêu cầu hoàn tiền đã được ghi nhận',
        data: payment
      });
    } catch (error) {
      console.error('Error in requestRefund:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xử lý hoàn tiền',
        error: error.message
      });
    }
  }
}

module.exports = new PaymentController();
