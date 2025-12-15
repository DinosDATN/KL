const express = require('express');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Rate limiting for contact form
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút.'
  }
});

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER, // your email
      pass: process.env.SMTP_PASS  // your email password or app password
    }
  });
};

// Validation rules
const contactValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên phải có từ 2-100 ký tự')
    .escape(),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email không hợp lệ'),
  body('subject')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Tiêu đề phải có từ 5-200 ký tự')
    .escape(),
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Nội dung phải có từ 10-2000 ký tự')
    .escape(),
  body('category')
    .isIn(['general', 'technical', 'course', 'payment', 'account', 'bug', 'feature', 'other'])
    .withMessage('Danh mục không hợp lệ')
];

// POST /api/contact - Send contact email
router.post('/', contactLimiter, contactValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const { name, email, subject, message, category } = req.body;

    // Category labels for email
    const categoryLabels = {
      general: 'Câu hỏi chung',
      technical: 'Hỗ trợ kỹ thuật',
      course: 'Khóa học',
      payment: 'Thanh toán',
      account: 'Tài khoản',
      bug: 'Báo lỗi',
      feature: 'Đề xuất tính năng',
      other: 'Khác'
    };

    // Create transporter
    const transporter = createTransporter();

    // Email to admin
    const adminMailOptions = {
      from: `"L-FYS Contact Form" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: `[${categoryLabels[category]}] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">L-FYS - Tin nhắn liên hệ mới</h1>
          </div>
          
          <div style="padding: 20px; background: #f8fafc;">
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #1e293b; margin-top: 0;">Thông tin liên hệ</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569; width: 120px;">Họ tên:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Email:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Danh mục:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${categoryLabels[category]}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Tiêu đề:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${subject}</td>
                </tr>
              </table>
              
              <h3 style="color: #1e293b; margin-top: 20px;">Nội dung tin nhắn:</h3>
              <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6;">
                ${message.replace(/\n/g, '<br>')}
              </div>
              
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
                <p>Tin nhắn này được gửi từ form liên hệ trên website L-FYS vào lúc ${new Date().toLocaleString('vi-VN')}.</p>
                <p>Vui lòng phản hồi trực tiếp đến email: <a href="mailto:${email}" style="color: #3b82f6;">${email}</a></p>
              </div>
            </div>
          </div>
        </div>
      `
    };

    // Auto-reply email to user
    const userMailOptions = {
      from: `"L-FYS Support" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Xác nhận đã nhận tin nhắn - L-FYS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">L-FYS</h1>
            <p style="margin: 10px 0 0 0;">Nền tảng học lập trình hàng đầu Việt Nam</p>
          </div>
          
          <div style="padding: 20px; background: #f8fafc;">
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #1e293b; margin-top: 0;">Xin chào ${name}!</h2>
              
              <p style="color: #475569; line-height: 1.6;">
                Cảm ơn bạn đã liên hệ với chúng tôi. Chúng tôi đã nhận được tin nhắn của bạn và sẽ phản hồi trong vòng <strong>24 giờ</strong>.
              </p>
              
              <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h3 style="color: #1e293b; margin: 0 0 10px 0;">Thông tin tin nhắn của bạn:</h3>
                <p style="margin: 5px 0; color: #475569;"><strong>Danh mục:</strong> ${categoryLabels[category]}</p>
                <p style="margin: 5px 0; color: #475569;"><strong>Tiêu đề:</strong> ${subject}</p>
              </div>
              
              <p style="color: #475569; line-height: 1.6;">
                Trong thời gian chờ đợi, bạn có thể:
              </p>
              
              <ul style="color: #475569; line-height: 1.6;">
                <li>Tham khảo <a href="${process.env.FRONTEND_URL}/contact" style="color: #3b82f6;">FAQ</a> để tìm câu trả lời nhanh</li>
                <li>Khám phá <a href="${process.env.FRONTEND_URL}/courses" style="color: #3b82f6;">khóa học</a> mới nhất</li>
                <li>Tham gia <a href="${process.env.FRONTEND_URL}/forum" style="color: #3b82f6;">cộng đồng</a> học tập</li>
              </ul>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
                <p style="color: #64748b; margin: 0;">
                  Trân trọng,<br>
                  <strong style="color: #1e293b;">Đội ngũ hỗ trợ L-FYS</strong>
                </p>
              </div>
            </div>
          </div>
          
          <div style="padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
            <p>© 2024 L-FYS. Tất cả các quyền được bảo lưu.</p>
            <p>Email này được gửi tự động, vui lòng không trả lời trực tiếp.</p>
          </div>
        </div>
      `
    };

    // Send emails
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(userMailOptions)
    ]);

    // Log contact for analytics (optional)
    console.log(`Contact form submission: ${email} - ${category} - ${subject}`);

    res.json({
      success: true,
      message: 'Tin nhắn đã được gửi thành công! Chúng tôi sẽ phản hồi trong vòng 24 giờ.'
    });

  } catch (error) {
    console.error('Contact form error:', error);
    
    // Check if it's an email sending error
    if (error.code === 'EAUTH' || error.code === 'ECONNECTION') {
      return res.status(500).json({
        success: false,
        message: 'Lỗi cấu hình email. Vui lòng thử lại sau hoặc liên hệ trực tiếp qua email.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại sau.'
    });
  }
});

// GET /api/contact/test - Test email configuration (admin only)
router.get('/test', async (req, res) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    
    res.json({
      success: true,
      message: 'Email configuration is working correctly'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Email configuration error',
      error: error.message
    });
  }
});

module.exports = router;