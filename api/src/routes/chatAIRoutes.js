const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Import controller
const chatAIController = require('../controllers/chatAIController');

/**
 * Middleware để xử lý validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu đầu vào không hợp lệ',
      errors: errors.array(),
      timestamp: new Date().toISOString()
    });
  }
  next();
};

/**
 * Middleware để log requests
 */
const logChatAIRequest = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[ChatAI Routes] ${timestamp} - ${req.method} ${req.originalUrl}`);
  next();
};

// Apply logging middleware cho tất cả routes
router.use(logChatAIRequest);

/**
 * POST /api/v1/chat-ai/ask
 * Gửi câu hỏi cho AI và nhận phản hồi (non-streaming)
 */
router.post('/ask',
  [
    // Validation rules
    body('question')
      .notEmpty()
      .withMessage('Câu hỏi không được để trống')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Câu hỏi phải từ 1-1000 ký tự')
      .trim()
  ],
  handleValidationErrors,
  chatAIController.askAI
);

/**
 * POST /api/v1/chat-ai/ask-stream
 * Gửi câu hỏi cho AI và nhận streaming response
 */
router.post('/ask-stream',
  [
    // Validation rules
    body('question')
      .notEmpty()
      .withMessage('Câu hỏi không được để trống')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Câu hỏi phải từ 1-1000 ký tự')
      .trim()
  ],
  handleValidationErrors,
  chatAIController.askAIStream
);

/**
 * GET /api/v1/chat-ai/health
 * Kiểm tra trạng thái health của ChatAI service
 */
router.get('/health', chatAIController.checkHealth);

/**
 * GET /api/v1/chat-ai/stats
 * Lấy thống kê từ ChatAI service
 */
router.get('/stats', chatAIController.getStats);

/**
 * GET /api/v1/chat-ai/quick-questions
 * Lấy danh sách câu hỏi gợi ý nhanh
 */
router.get('/quick-questions', chatAIController.getQuickQuestions);

/**
 * Rate limiting middleware (tùy chọn - có thể bật trong production)
 * Giới hạn số request để tránh spam
 */
const rateLimit = require('express-rate-limit');

const chatAIRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 20, // Tối đa 20 requests mỗi phút
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.',
    error: 'RATE_LIMIT_EXCEEDED',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true, // Return rate limit info trong headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
});

// Apply rate limiting cho ask endpoint (có thể uncomment khi deploy production)
// router.use('/ask', chatAIRateLimit);

/**
 * Error handling middleware riêng cho ChatAI routes
 */
router.use((error, req, res, next) => {
  console.error('[ChatAI Routes] Error:', error);
  
  res.status(500).json({
    success: false,
    message: 'Có lỗi xảy ra trong hệ thống ChatAI',
    error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;