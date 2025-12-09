const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Tất cả routes đều yêu cầu authentication
router.use(authenticateToken);

// Payment intent - tính toán giá trước khi thanh toán
router.post('/courses/:courseId/payment-intent', paymentController.createPaymentIntent);

// Xử lý thanh toán
router.post('/courses/:courseId/process-payment', paymentController.processPayment);

// Lịch sử thanh toán của user
router.get('/my-payments', paymentController.getMyPayments);

// Chi tiết một payment
router.get('/payments/:paymentId', paymentController.getPaymentDetail);

// Validate coupon
router.get('/coupons/:code/validate', paymentController.validateCoupon);

// Danh sách coupon active
router.get('/coupons/active', paymentController.getActiveCoupons);

// Yêu cầu hoàn tiền
router.post('/payments/:paymentId/refund', paymentController.requestRefund);

// VNPay callback (không cần auth vì từ VNPay gọi về)
router.get('/vnpay-return', paymentController.vnpayReturn);

// Người dùng xác nhận đã chuyển khoản
router.post('/courses/:courseId/confirm-bank-transfer', paymentController.confirmBankTransferByUser);

// Xác nhận thanh toán chuyển khoản (Admin only)
router.post('/payments/:paymentId/confirm-bank-transfer', paymentController.confirmBankTransfer);

// Creator: Lấy danh sách thanh toán của khóa học mình
router.get('/creator/payments', paymentController.getCreatorPayments);

// Creator: Xác nhận thanh toán
router.post('/creator/payments/:paymentId/confirm', paymentController.creatorConfirmPayment);

module.exports = router;
