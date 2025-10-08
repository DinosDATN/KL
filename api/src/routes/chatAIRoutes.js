const express = require('express');
const router = express.Router();
const axios = require('axios');

// ChatAI Service để tương tác với Python AI API
class ChatAIService {
  constructor() {
    this.pythonApiUrl = process.env.PYTHON_AI_API_URL || 'http://localhost:8000';
  }

  async askQuestion(question) {
    try {
      const response = await axios.post(`${this.pythonApiUrl}/ask`, {
        question: question
      }, {
        timeout: 30000, // 30 seconds timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error calling Python AI API:', error.message);
      
      // Handle different types of errors
      if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: 'AI service is currently unavailable. Please try again later.',
          type: 'connection_error'
        };
      } else if (error.response && error.response.status) {
        return {
          success: false,
          error: error.response.data?.error || 'AI service error',
          type: 'api_error',
          status: error.response.status
        };
      } else if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'Request timeout. Please try again.',
          type: 'timeout_error'
        };
      }

      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
        type: 'unknown_error'
      };
    }
  }

  async getHealthStatus() {
    try {
      const response = await axios.get(`${this.pythonApiUrl}/health`, {
        timeout: 5000
      });

      return {
        success: true,
        status: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

const chatAIService = new ChatAIService();

// POST /api/v1/chat-ai/ask - Hỏi ChatAI
router.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;

    // Validation
    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Question is required and must be a non-empty string'
      });
    }

    // Giới hạn độ dài câu hỏi
    if (question.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Question is too long. Please limit to 1000 characters.'
      });
    }

    // Gọi Python AI API
    const result = await chatAIService.askQuestion(question.trim());

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString()
      });
    } else {
      // Trả về error từ AI service
      const statusCode = result.type === 'connection_error' ? 503 : 
                        result.type === 'timeout_error' ? 408 : 
                        result.status || 500;

      res.status(statusCode).json({
        success: false,
        message: result.error,
        type: result.type,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error in chat-ai/ask:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/v1/chat-ai/health - Kiểm tra trạng thái AI service
router.get('/health', async (req, res) => {
  try {
    const result = await chatAIService.getHealthStatus();

    if (result.success) {
      res.json({
        success: true,
        ai_service: result.status,
        backend_service: {
          status: 'healthy',
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'AI service is unhealthy',
        error: result.error,
        backend_service: {
          status: 'healthy',
          timestamp: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('Error in chat-ai/health:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/v1/chat-ai/stats - Lấy thống kê từ AI service
router.get('/stats', async (req, res) => {
  try {
    const response = await axios.get(`${chatAIService.pythonApiUrl}/stats`, {
      timeout: 10000
    });

    res.json({
      success: true,
      data: response.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in chat-ai/stats:', error);
    
    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        message: 'AI service is currently unavailable',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to get AI service statistics',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
});

module.exports = router;