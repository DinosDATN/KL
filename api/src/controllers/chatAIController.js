const axios = require('axios');
const { Readable } = require('stream');

/**
 * ChatAI Controller - Xử lý các request liên quan đến ChatAI
 * Đóng vai trò middleware giữa frontend Angular và Python AI service
 */

// Cấu hình Python AI service URL
const PYTHON_AI_API_URL = process.env.PYTHON_AI_API_URL || 'http://localhost:8000';

/**
 * Gửi câu hỏi cho AI và nhận phản hồi
 * POST /api/v1/chat-ai/ask
 */
const askAI = async (req, res) => {
  try {
    const { question } = req.body;

    // Validation
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Câu hỏi không được để trống',
        timestamp: new Date().toISOString()
      });
    }

    // Kiểm tra độ dài câu hỏi (giới hạn 1000 ký tự)
    if (question.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Câu hỏi không được vượt quá 1000 ký tự',
        timestamp: new Date().toISOString()
      });
    }

    // Log request để monitoring
    console.log(`[ChatAI] Received question: ${question.substring(0, 100)}${question.length > 100 ? '...' : ''}`);

    // Gọi Python AI service
    const aiResponse = await axios.post(`${PYTHON_AI_API_URL}/ask`, {
      question: question.trim()
    }, {
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Format response cho frontend
    const formattedResponse = {
      success: true,
      data: {
        answer: aiResponse.data.answer,
        data_source: aiResponse.data.data_source || 'ai_general',
        query_info: aiResponse.data.query_info || null,
        suggestions: aiResponse.data.suggestions || [
          'Có những khóa học nào?',
          'Bài tập dễ để luyện tập?',
          'Tài liệu học lập trình có gì?'
        ],
        raw_data: aiResponse.data.raw_data || null
      },
      timestamp: new Date().toISOString()
    };

    console.log(`[ChatAI] Response sent successfully`);
    return res.status(200).json(formattedResponse);

  } catch (error) {
    console.error('[ChatAI] Error in askAI:', error.message);

    // Xử lý các loại lỗi khác nhau
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'Dịch vụ ChatAI hiện tại không khả dụng. Vui lòng thử lại sau.',
        error: 'SERVICE_UNAVAILABLE',
        timestamp: new Date().toISOString()
      });
    }

    if (error.code === 'ENOTFOUND') {
      return res.status(503).json({
        success: false,
        message: 'Không thể kết nối đến dịch vụ ChatAI',
        error: 'CONNECTION_ERROR',
        timestamp: new Date().toISOString()
      });
    }

    if (error.response && error.response.status === 400) {
      return res.status(400).json({
        success: false,
        message: error.response.data.message || 'Yêu cầu không hợp lệ',
        timestamp: new Date().toISOString()
      });
    }

    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        success: false,
        message: 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.',
        error: 'TIMEOUT',
        timestamp: new Date().toISOString()
      });
    }

    // Lỗi chung
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi xử lý câu hỏi của bạn. Vui lòng thử lại.',
      error: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Kiểm tra trạng thái health của AI service
 * GET /api/v1/chat-ai/health
 */
const checkHealth = async (req, res) => {
  try {
    console.log(`[ChatAI] Health check requested`);

    // Gọi health endpoint của Python AI service
    const healthResponse = await axios.get(`${PYTHON_AI_API_URL}/health`, {
      timeout: 10000 // 10 seconds timeout
    });

    return res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        ai_service: healthResponse.data,
        node_api: {
          status: 'running',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ChatAI] Health check failed:', error.message);

    return res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        ai_service: {
          status: 'unavailable',
          error: error.message
        },
        node_api: {
          status: 'running',
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Lấy thống kê từ AI service
 * GET /api/v1/chat-ai/stats
 */
const getStats = async (req, res) => {
  try {
    console.log(`[ChatAI] Stats requested`);

    // Gọi stats endpoint của Python AI service
    const statsResponse = await axios.get(`${PYTHON_AI_API_URL}/stats`, {
      timeout: 10000 // 10 seconds timeout
    });

    return res.status(200).json({
      success: true,
      data: statsResponse.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ChatAI] Error getting stats:', error.message);

    return res.status(503).json({
      success: false,
      message: 'Không thể lấy thống kê từ dịch vụ ChatAI',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Lấy danh sách câu hỏi gợi ý nhanh
 * GET /api/v1/chat-ai/quick-questions
 */
const getQuickQuestions = async (req, res) => {
  try {
    const quickQuestions = [
      'Có những khóa học nào?',
      'Bài tập dễ để luyện tập?', 
      'Tài liệu học lập trình có gì?',
      'Khóa học Python cho người mới bắt đầu',
      'Cuộc thi nào đang diễn ra?',
      'Bài tập về cấu trúc dữ liệu',
      'Thống kê hệ thống',
      'Khóa học nâng cao có gì?'
    ];

    return res.status(200).json({
      success: true,
      data: {
        questions: quickQuestions
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ChatAI] Error getting quick questions:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy câu hỏi gợi ý',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Gửi câu hỏi cho AI và nhận streaming response
 * POST /api/v1/chat-ai/ask-stream
 */
const askAIStream = async (req, res) => {
  try {
    const { question } = req.body;

    // Validation
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Câu hỏi không được để trống',
        timestamp: new Date().toISOString()
      });
    }

    // Kiểm tra độ dài câu hỏi (giới hạn 1000 ký tự)
    if (question.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Câu hỏi không được vượt quá 1000 ký tự',
        timestamp: new Date().toISOString()
      });
    }

    // Log request để monitoring
    console.log(`[ChatAI] Received streaming question: ${question.substring(0, 100)}${question.length > 100 ? '...' : ''}`);

    // Set headers cho Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for nginx

    // Gọi Python AI service với streaming
    try {
      const response = await axios.post(
        `${PYTHON_AI_API_URL}/ask-stream`,
        { question: question.trim() },
        {
          responseType: 'stream',
          timeout: 60000, // 60 seconds timeout cho streaming
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Forward streaming từ Python service
      response.data.on('data', (chunk) => {
        res.write(chunk);
      });

      response.data.on('end', () => {
        res.end();
        console.log(`[ChatAI] Streaming completed`);
      });

      response.data.on('error', (error) => {
        console.error('[ChatAI] Streaming error:', error);
        const errorData = JSON.stringify({
          type: 'error',
          content: 'Có lỗi xảy ra khi nhận streaming response'
        });
        res.write(`data: ${errorData}\n\n`);
        res.end();
      });

    } catch (error) {
      console.error('[ChatAI] Error in streaming request:', error.message);

      // Xử lý các loại lỗi khác nhau
      let errorMessage = 'Có lỗi xảy ra khi xử lý câu hỏi của bạn. Vui lòng thử lại.';
      
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Dịch vụ ChatAI hiện tại không khả dụng. Vui lòng thử lại sau.';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Không thể kết nối đến dịch vụ ChatAI';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.';
      }

      const errorData = JSON.stringify({
        type: 'error',
        content: errorMessage
      });
      res.write(`data: ${errorData}\n\n`);
      res.end();
    }

  } catch (error) {
    console.error('[ChatAI] Error in askAIStream:', error.message);
    const errorData = JSON.stringify({
      type: 'error',
      content: 'Có lỗi xảy ra. Vui lòng thử lại sau.'
    });
    res.write(`data: ${errorData}\n\n`);
    res.end();
  }
};

module.exports = {
  askAI,
  askAIStream,
  checkHealth,
  getStats,
  getQuickQuestions
};