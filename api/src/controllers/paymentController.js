const CoursePayment = require('../models/CoursePayment');
const CourseCoupon = require('../models/CourseCoupon');
const CouponUsage = require('../models/CouponUsage');
const Course = require('../models/Course');
const CourseEnrollment = require('../models/CourseEnrollment');
const { sequelize } = require('../config/sequelize');
const vnpayService = require('../services/vnpayService');

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
      const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1';

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

      // Đối với bank_transfer, không tạo payment ngay
      // Chỉ trả về thông tin để người dùng chuyển khoản
      // Payment sẽ được tạo khi người dùng xác nhận đã chuyển khoản
      
      let payment = null;
      
      if (paymentMethod !== 'bank_transfer') {
        // Tạo payment record cho các phương thức khác
        payment = await CoursePayment.create({
          user_id: userId,
          course_id: courseId,
          amount: finalAmount,
          original_amount: originalAmount,
          discount_amount: discountAmount,
          payment_method: paymentMethod,
          payment_status: 'pending',
          notes: `Payment for course: ${course.title}`
        }, { transaction });
      }

      await transaction.commit();

      // Xử lý theo phương thức thanh toán
      if (paymentMethod === 'vnpay') {
        // Tạo URL thanh toán VNPay
        const orderId = `COURSE_${payment.id}_${Date.now()}`;
        const orderInfo = `Thanh toan khoa hoc: ${course.title}`;
        
        const paymentUrl = vnpayService.createPaymentUrl(
          orderId,
          finalAmount,
          orderInfo,
          ipAddr
        );

        return res.status(200).json({
          success: true,
          message: 'Chuyển hướng đến VNPay',
          data: {
            paymentId: payment.id,
            paymentUrl,
            orderId
          }
        });
      } else if (paymentMethod === 'bank_transfer') {
        // Chuyển khoản ngân hàng - lấy thông tin tài khoản của creator
        const CreatorBankAccount = require('../models/CreatorBankAccount');
        const creatorBankAccount = await CreatorBankAccount.findOne({
          where: { 
            user_id: course.instructor_id,
            is_active: true
          }
        });

        let bankInfo;
        // Tạo một reference ID tạm thời (không phải payment ID)
        const tempRef = `TEMP_${courseId}_${userId}_${Date.now()}`;
        
        if (creatorBankAccount && creatorBankAccount.is_verified) {
          // Sử dụng tài khoản của creator
          bankInfo = {
            bankName: creatorBankAccount.bank_name,
            accountNumber: creatorBankAccount.account_number,
            accountName: creatorBankAccount.account_name,
            branch: creatorBankAccount.branch,
            amount: finalAmount,
            content: `KHOAHOC ${courseId} USER ${userId}`,
            qrCode: `https://img.vietqr.io/image/${creatorBankAccount.bank_name.split(' ')[0]}-${creatorBankAccount.account_number}-compact2.png?amount=${finalAmount}&addInfo=KHOAHOC%20${courseId}%20USER%20${userId}`
          };
        } else {
          // Sử dụng tài khoản mặc định của hệ thống
          bankInfo = {
            bankName: 'Ngân hàng TMCP Á Châu (ACB)',
            accountNumber: '123456789',
            accountName: 'CONG TY TNHH GIAO DUC TRUC TUYEN',
            amount: finalAmount,
            content: `KHOAHOC ${courseId} USER ${userId}`,
            qrCode: `https://img.vietqr.io/image/ACB-123456789-compact2.png?amount=${finalAmount}&addInfo=KHOAHOC%20${courseId}%20USER%20${userId}`,
            note: 'Creator chưa cập nhật thông tin tài khoản ngân hàng'
          };
        }

        return res.status(200).json({
          success: true,
          message: 'Vui lòng chuyển khoản theo thông tin bên dưới',
          data: {
            courseId,
            userId,
            amount: finalAmount,
            originalAmount,
            discountAmount,
            couponCode: coupon ? coupon.code : null,
            paymentMethod: 'bank_transfer',
            bankInfo,
            note: 'Sau khi chuyển khoản, vui lòng click "Đã chuyển khoản" để thông báo cho giảng viên.'
          }
        });
      } else {
        // Các phương thức khác - simulate thanh toán thành công
        const transactionInner = await sequelize.transaction();
        try {
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
          }, { transaction: transactionInner });

          // Cập nhật số lượng học viên
          await Course.increment('students', { 
            where: { id: courseId },
            transaction: transactionInner 
          });

          // Lưu coupon usage nếu có
          if (coupon && discountAmount > 0) {
            await CouponUsage.create({
              coupon_id: coupon.id,
              user_id: userId,
              payment_id: payment.id,
              discount_amount: discountAmount
            }, { transaction: transactionInner });

            await coupon.incrementUsage();
          }

          await transactionInner.commit();

          return res.status(201).json({
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
          await transactionInner.rollback();
          throw error;
        }
      }
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
   * Xử lý callback từ VNPay
   */
  async vnpayReturn(req, res) {
    try {
      const vnpParams = req.query;
      
      // Xác thực callback
      const result = vnpayService.processReturn(vnpParams);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }

      // Lấy payment ID từ orderId
      const orderId = result.data.orderId;
      const paymentId = orderId.split('_')[1];

      const payment = await CoursePayment.findByPk(paymentId);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin thanh toán'
        });
      }

      if (payment.payment_status === 'completed') {
        return res.status(200).json({
          success: true,
          message: 'Giao dịch đã được xử lý trước đó',
          data: {
            paymentId: payment.id,
            redirectUrl: `/courses/${payment.course_id}/learn`
          }
        });
      }

      const transaction = await sequelize.transaction();
      
      try {
        // Cập nhật payment
        await payment.markAsCompleted(
          result.data.transactionNo,
          'vnpay',
          {
            bankCode: result.data.bankCode,
            payDate: result.data.payDate,
            vnpayData: result.data
          }
        );

        // Tạo enrollment
        const enrollment = await CourseEnrollment.create({
          user_id: payment.user_id,
          course_id: payment.course_id,
          payment_id: payment.id,
          enrollment_type: 'paid',
          progress: 0,
          status: 'not-started',
          start_date: new Date()
        }, { transaction });

        // Cập nhật số lượng học viên
        await Course.increment('students', { 
          where: { id: payment.course_id },
          transaction 
        });

        await transaction.commit();

        res.status(200).json({
          success: true,
          message: 'Thanh toán thành công',
          data: {
            payment: {
              id: payment.id,
              transactionId: payment.transaction_id,
              amount: payment.amount,
              status: payment.payment_status
            },
            enrollment: {
              id: enrollment.id,
              courseId: enrollment.course_id
            },
            redirectUrl: `/courses/${payment.course_id}/learn`
          }
        });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error in vnpayReturn:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xử lý callback từ VNPay',
        error: error.message
      });
    }
  }

  /**
   * Xác nhận thanh toán chuyển khoản ngân hàng (Admin)
   */
  async confirmBankTransfer(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const { paymentId } = req.params;
      const { transactionId, notes } = req.body;

      const payment = await CoursePayment.findByPk(paymentId, { transaction });
      
      if (!payment) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin thanh toán'
        });
      }

      if (payment.payment_status === 'completed') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Thanh toán đã được xác nhận trước đó'
        });
      }

      // Cập nhật payment
      await payment.markAsCompleted(
        transactionId || `BANK_${Date.now()}`,
        'bank_transfer',
        { confirmedBy: req.user.id, notes }
      );

      // Kiểm tra enrollment đã tồn tại chưa
      let enrollment = await CourseEnrollment.findOne({
        where: { payment_id: paymentId },
        transaction
      });

      if (!enrollment) {
        // Tạo enrollment mới
        enrollment = await CourseEnrollment.create({
          user_id: payment.user_id,
          course_id: payment.course_id,
          payment_id: payment.id,
          enrollment_type: 'paid',
          progress: 0,
          status: 'not-started',
          start_date: new Date()
        }, { transaction });

        // Cập nhật số lượng học viên
        await Course.increment('students', { 
          where: { id: payment.course_id },
          transaction 
        });
      }

      await transaction.commit();

      res.status(200).json({
        success: true,
        message: 'Xác nhận thanh toán thành công',
        data: {
          payment,
          enrollment
        }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error in confirmBankTransfer:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xác nhận thanh toán',
        error: error.message
      });
    }
  }

  /**
   * Người dùng xác nhận đã chuyển khoản
   */
  async confirmBankTransferByUser(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const { courseId } = req.params;
      const { amount, originalAmount, discountAmount, couponCode } = req.body;
      const userId = req.user.id;

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

      // Kiểm tra đã có payment pending chưa
      const existingPayment = await CoursePayment.findOne({
        where: { 
          user_id: userId, 
          course_id: courseId,
          payment_method: 'bank_transfer',
          payment_status: 'pending'
        },
        transaction
      });

      if (existingPayment) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Bạn đã có một thanh toán đang chờ xác nhận cho khóa học này'
        });
      }

      // Kiểm tra đã đăng ký chưa
      const existingEnrollment = await CourseEnrollment.findOne({
        where: { user_id: userId, course_id: courseId },
        transaction
      });

      if (existingEnrollment) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Bạn đã đăng ký khóa học này rồi'
        });
      }

      // Tạo payment record
      const payment = await CoursePayment.create({
        user_id: userId,
        course_id: courseId,
        amount: amount,
        original_amount: originalAmount,
        discount_amount: discountAmount,
        payment_method: 'bank_transfer',
        payment_status: 'pending',
        notes: `User confirmed bank transfer for course: ${course.title}`
      }, { transaction });

      // Lưu coupon usage nếu có
      if (couponCode && discountAmount > 0) {
        const coupon = await CourseCoupon.findByCode(couponCode);
        if (coupon) {
          await CouponUsage.create({
            coupon_id: coupon.id,
            user_id: userId,
            payment_id: payment.id,
            discount_amount: discountAmount
          }, { transaction });

          await coupon.incrementUsage();
        }
      }

      await transaction.commit();

      // TODO: Gửi notification cho creator
      // await createNotification({
      //   user_id: course.instructor_id,
      //   type: 'new_payment',
      //   title: 'Thanh toán mới',
      //   message: `Có thanh toán mới cho khóa học "${course.title}"`
      // });

      res.status(201).json({
        success: true,
        message: 'Đã ghi nhận thanh toán của bạn. Vui lòng chờ giảng viên xác nhận.',
        data: {
          paymentId: payment.id,
          status: payment.payment_status
        }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error in confirmBankTransferByUser:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xác nhận chuyển khoản',
        error: error.message
      });
    }
  }

  /**
   * Creator: Lấy danh sách thanh toán của khóa học mình
   */
  async getCreatorPayments(req, res) {
    try {
      const creatorId = req.user.id;
      const { status, courseId } = req.query;

      const User = require('../models/User');

      // Build where clause
      const whereClause = {
        payment_method: 'bank_transfer'
      };

      if (status) {
        whereClause.payment_status = status;
      }

      // Lấy payments của các khóa học thuộc creator
      const payments = await CoursePayment.findAll({
        where: whereClause,
        include: [
          {
            model: Course,
            as: 'Course',
            where: { 
              instructor_id: creatorId,
              ...(courseId && { id: courseId })
            },
            attributes: ['id', 'title', 'thumbnail', 'price']
          },
          {
            model: User,
            as: 'User',
            attributes: ['id', 'name', 'email', 'avatar_url']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: payments
      });
    } catch (error) {
      console.error('Error in getCreatorPayments:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách thanh toán',
        error: error.message
      });
    }
  }

  /**
   * Creator: Xác nhận thanh toán chuyển khoản
   */
  async creatorConfirmPayment(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const { paymentId } = req.params;
      const { transactionId, notes } = req.body;
      const creatorId = req.user.id;

      const payment = await CoursePayment.findByPk(paymentId, { 
        include: [{
          model: Course,
          as: 'Course',
          attributes: ['id', 'instructor_id', 'title']
        }],
        transaction 
      });
      
      if (!payment) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin thanh toán'
        });
      }

      // Kiểm tra creator có phải là instructor của khóa học không
      if (payment.Course.instructor_id !== creatorId) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xác nhận thanh toán này'
        });
      }

      if (payment.payment_status === 'completed') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Thanh toán đã được xác nhận trước đó'
        });
      }

      if (payment.payment_method !== 'bank_transfer') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Chỉ có thể xác nhận thanh toán chuyển khoản'
        });
      }

      // Cập nhật payment
      await payment.markAsCompleted(
        transactionId || `BANK_${Date.now()}`,
        'bank_transfer',
        { confirmedBy: creatorId, confirmedByRole: 'creator', notes }
      );

      // Kiểm tra enrollment đã tồn tại chưa
      let enrollment = await CourseEnrollment.findOne({
        where: { payment_id: paymentId },
        transaction
      });

      if (!enrollment) {
        // Tạo enrollment mới
        enrollment = await CourseEnrollment.create({
          user_id: payment.user_id,
          course_id: payment.course_id,
          payment_id: payment.id,
          enrollment_type: 'paid',
          progress: 0,
          status: 'not-started',
          start_date: new Date()
        }, { transaction });

        // Cập nhật số lượng học viên
        await Course.increment('students', { 
          where: { id: payment.course_id },
          transaction 
        });
      }

      // TODO: Gửi notification cho học viên
      // await createNotification({
      //   user_id: payment.user_id,
      //   type: 'payment_confirmed',
      //   title: 'Thanh toán đã được xác nhận',
      //   message: `Thanh toán cho khóa học "${payment.Course.title}" đã được xác nhận. Bạn có thể bắt đầu học ngay!`
      // });

      await transaction.commit();

      res.status(200).json({
        success: true,
        message: 'Xác nhận thanh toán thành công',
        data: {
          payment,
          enrollment
        }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error in creatorConfirmPayment:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xác nhận thanh toán',
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
