const axios = require('axios');
const { Readable } = require('stream');
const SQLExecutor = require('../services/sqlExecutor');
const DatabaseSchemaService = require('../services/databaseSchemaService');

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

    const userId = req.user?.id || null;

    // Lấy conversation history từ request (nếu có)
    const conversationHistory = req.body.conversation_history || null;
    
    console.log(`[ChatAI] Raw conversation_history from request:`, conversationHistory ? JSON.stringify(conversationHistory, null, 2) : 'null');
    
    // Gọi Python AI service với decision layer
    const requestBody = {
      question: question.trim()
    };
    
    // Thêm conversation history nếu có
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      requestBody.conversation_history = conversationHistory.map(msg => ({
        role: msg.role || (msg.isUser ? 'user' : 'assistant'),
        content: msg.text || msg.content || msg.message || ''
      })).filter(msg => msg.content.trim().length > 0);
      
      console.log(`[ChatAI] Processed conversation_history (${requestBody.conversation_history.length} messages):`, JSON.stringify(requestBody.conversation_history, null, 2));
    } else {
      console.log(`[ChatAI] No conversation history to send (received: ${conversationHistory ? 'empty array' : 'null'})`);
    }
    
    const aiResponse = await axios.post(`${PYTHON_AI_API_URL}/ask`, requestBody, {
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Log response từ Python để debug
    console.log(`[ChatAI] Python response:`, JSON.stringify({
      requires_sql: aiResponse.data.requires_sql,
      has_sql: !!aiResponse.data.sql,
      sql_preview: aiResponse.data.sql ? aiResponse.data.sql.substring(0, 100) : null,
      data_source: aiResponse.data.data_source
    }));

    // Kiểm tra xem AI có trả về SQL không
    let finalAnswer = aiResponse.data.answer;
    let dataSource = aiResponse.data.data_source || 'ai_general';
    let rawData = aiResponse.data.raw_data || null;
    let queryInfo = aiResponse.data.query_info || null;

    // Nếu AI trả về SQL, thực thi và format kết quả
    if (aiResponse.data.requires_sql && aiResponse.data.sql) {
      console.log(`[ChatAI] AI generated SQL, executing: ${aiResponse.data.sql}`);
      
      try {
        // Thực thi SQL query
        const queryResult = await SQLExecutor.executeQuery(aiResponse.data.sql, {
          timeout: 10000,
          maxRows: 100,
          userId: userId
        });

        if (queryResult.success) {
          // Format kết quả query
          const formattedData = SQLExecutor.formatResult(queryResult);
          
          // Gửi kết quả về Python để format lại câu trả lời
          try {
            const formatRequestBody = {
              question: question.trim(),
              query_result: queryResult.data,
              query_info: queryInfo
            };
            
            // Thêm conversation history nếu có
            if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
              formatRequestBody.conversation_history = conversationHistory.map(msg => ({
                role: msg.role || (msg.isUser ? 'user' : 'assistant'),
                content: msg.text || msg.content || msg.message || ''
              })).filter(msg => msg.content.trim().length > 0);
              
              console.log(`[ChatAI] Sending conversation_history to format-answer: ${formatRequestBody.conversation_history.length} messages`);
            }
            
            const formattedResponse = await axios.post(`${PYTHON_AI_API_URL}/format-answer`, formatRequestBody, {
              timeout: 15000,
              headers: {
                'Content-Type': 'application/json'
              }
            });

            finalAnswer = formattedResponse.data.answer || formattedData;
            dataSource = 'database';
            rawData = queryResult.data;
          } catch (formatError) {
            // Fallback: sử dụng formatted data trực tiếp
            console.warn('[ChatAI] Error formatting answer with AI, using direct format:', formatError.message);
            finalAnswer = `Dựa trên dữ liệu từ hệ thống:\n\n${formattedData}`;
            dataSource = 'database';
            rawData = queryResult.data;
          }
        } else {
          // SQL execution failed, fallback to AI answer
          console.warn('[ChatAI] SQL execution failed:', queryResult.error);
          finalAnswer = `Xin lỗi, tôi không thể truy vấn dữ liệu lúc này. ${aiResponse.data.answer}`;
          dataSource = 'ai_fallback';
        }
      } catch (sqlError) {
        // SQL execution error, fallback to AI answer
        console.error('[ChatAI] SQL execution error:', sqlError.message);
        finalAnswer = `Xin lỗi, có lỗi xảy ra khi truy vấn dữ liệu. ${aiResponse.data.answer}`;
        dataSource = 'ai_fallback';
      }
    }

    // Format response cho frontend
    const formattedResponse = {
      success: true,
      data: {
        answer: finalAnswer,
        data_source: dataSource,
        query_info: queryInfo,
        suggestions: aiResponse.data.suggestions || [
          'Có những khóa học nào?',
          'Bài tập dễ để luyện tập?',
          'Tài liệu học lập trình có gì?'
        ],
        raw_data: rawData
      },
      timestamp: new Date().toISOString()
    };

    console.log(`[ChatAI] Response sent successfully (source: ${dataSource})`);
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
    // Log toàn bộ request body để debug
    console.log(`[ChatAI Stream] Full request body keys:`, Object.keys(req.body || {}));
    console.log(`[ChatAI Stream] Request body:`, JSON.stringify(req.body, null, 2));
    
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

    const userId = req.user?.id || null;

    // Set headers cho Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for nginx

    try {
      // Lấy conversation history từ request (nếu có)
      const conversationHistory = req.body.conversation_history || null;
      
      console.log(`[ChatAI Stream] Conversation history received: ${conversationHistory ? conversationHistory.length : 0} messages`);
      if (conversationHistory && conversationHistory.length > 0) {
        console.log(`[ChatAI Stream] First message: ${JSON.stringify(conversationHistory[0])}`);
        console.log(`[ChatAI Stream] Last message: ${JSON.stringify(conversationHistory[conversationHistory.length - 1])}`);
      }
      
      // Bước 1: Gọi Python AI service với /ask (non-streaming) để check SQL
      const requestBody = {
        question: question.trim()
      };
      
      // Thêm conversation history nếu có
      if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
        requestBody.conversation_history = conversationHistory.map(msg => ({
          role: msg.role || (msg.isUser ? 'user' : 'assistant'),
          content: msg.text || msg.content || msg.message || ''
        })).filter(msg => msg.content && msg.content.trim().length > 0);
        
        console.log(`[ChatAI Stream] Sending ${requestBody.conversation_history.length} messages to Python`);
      } else {
        console.log(`[ChatAI Stream] No conversation history to send`);
      }
      
      const aiResponse = await axios.post(`${PYTHON_AI_API_URL}/ask`, requestBody, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`[ChatAI Stream] Python response:`, JSON.stringify({
        requires_sql: aiResponse.data.requires_sql,
        has_sql: !!aiResponse.data.sql,
        sql_preview: aiResponse.data.sql ? aiResponse.data.sql.substring(0, 100) : null
      }));

      // Bước 2: Nếu có SQL, thực thi và stream kết quả
      if (aiResponse.data.requires_sql && aiResponse.data.sql) {
        console.log(`[ChatAI Stream] Executing SQL: ${aiResponse.data.sql}`);
        
        try {
          // Thực thi SQL query
          const queryResult = await SQLExecutor.executeQuery(aiResponse.data.sql, {
            timeout: 10000,
            maxRows: 100,
            userId: userId
          });

          if (queryResult.success) {
            // Format kết quả query
            const formattedData = SQLExecutor.formatResult(queryResult);
            
            // Gửi kết quả về Python để format lại câu trả lời
            try {
              const formatRequestBody = {
                question: question.trim(),
                query_result: queryResult.data,
                query_info: aiResponse.data.query_info
              };
              
              // Thêm conversation history nếu có
              if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
                formatRequestBody.conversation_history = conversationHistory.map(msg => ({
                  role: msg.role || (msg.isUser ? 'user' : 'assistant'),
                  content: msg.text || msg.content || msg.message || ''
                })).filter(msg => msg.content.trim().length > 0);
              }
              
              const formattedResponse = await axios.post(`${PYTHON_AI_API_URL}/format-answer`, formatRequestBody, {
                timeout: 15000,
                headers: {
                  'Content-Type': 'application/json'
                }
              });

              const finalAnswer = formattedResponse.data.answer || formattedData;
              
              // Stream kết quả về frontend
              const answerChunks = finalAnswer.split(' ');
              for (let i = 0; i < answerChunks.length; i++) {
                const chunk = (i === 0 ? '' : ' ') + answerChunks[i];
                const data = JSON.stringify({
                  type: 'chunk',
                  content: chunk
                }, { ensureAscii: false });
                res.write(`data: ${data}\n\n`);
                
                // Small delay để tạo hiệu ứng streaming
                await new Promise(resolve => setTimeout(resolve, 30));
              }
              
              // Gửi signal kết thúc
              res.write(`data: ${JSON.stringify({ type: 'done' }, { ensureAscii: false })}\n\n`);
              res.end();
              console.log(`[ChatAI Stream] SQL query completed and streamed`);
              return;
              
            } catch (formatError) {
              console.warn('[ChatAI Stream] Error formatting answer, using direct format:', formatError.message);
              // Fallback: stream formatted data trực tiếp
              const finalAnswer = `Dựa trên dữ liệu từ hệ thống:\n\n${formattedData}`;
              const answerChunks = finalAnswer.split(' ');
              for (let i = 0; i < answerChunks.length; i++) {
                const chunk = (i === 0 ? '' : ' ') + answerChunks[i];
                const data = JSON.stringify({
                  type: 'chunk',
                  content: chunk
                }, { ensureAscii: false });
                res.write(`data: ${data}\n\n`);
                await new Promise(resolve => setTimeout(resolve, 30));
              }
              res.write(`data: ${JSON.stringify({ type: 'done' }, { ensureAscii: false })}\n\n`);
              res.end();
              return;
            }
          } else {
            // SQL execution failed, fallback to AI answer
            console.warn('[ChatAI Stream] SQL execution failed:', queryResult.error);
            const fallbackAnswer = `Xin lỗi, tôi không thể truy vấn dữ liệu lúc này. ${aiResponse.data.answer}`;
            const answerChunks = fallbackAnswer.split(' ');
            for (let i = 0; i < answerChunks.length; i++) {
              const chunk = (i === 0 ? '' : ' ') + answerChunks[i];
              const data = JSON.stringify({
                type: 'chunk',
                content: chunk
              }, { ensureAscii: false });
              res.write(`data: ${data}\n\n`);
              await new Promise(resolve => setTimeout(resolve, 30));
            }
            res.write(`data: ${JSON.stringify({ type: 'done' }, { ensureAscii: false })}\n\n`);
            res.end();
            return;
          }
        } catch (sqlError) {
          console.error('[ChatAI Stream] SQL execution error:', sqlError.message);
          const errorAnswer = `Xin lỗi, có lỗi xảy ra khi truy vấn dữ liệu. ${aiResponse.data.answer}`;
          const answerChunks = errorAnswer.split(' ');
          for (let i = 0; i < answerChunks.length; i++) {
            const chunk = (i === 0 ? '' : ' ') + answerChunks[i];
            const data = JSON.stringify({
              type: 'chunk',
              content: chunk
            }, { ensureAscii: false });
            res.write(`data: ${data}\n\n`);
            await new Promise(resolve => setTimeout(resolve, 30));
          }
          res.write(`data: ${JSON.stringify({ type: 'done' }, { ensureAscii: false })}\n\n`);
          res.end();
          return;
        }
      }

      // Bước 3: Nếu không có SQL, dùng streaming từ Python service
      console.log(`[ChatAI Stream] No SQL, using Python streaming`);
      
      const streamRequestBody = {
        question: question.trim()
      };
      
      // Thêm conversation history nếu có
      if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
        streamRequestBody.conversation_history = conversationHistory.map(msg => ({
          role: msg.role || (msg.isUser ? 'user' : 'assistant'),
          content: msg.text || msg.content || msg.message || ''
        })).filter(msg => msg.content && msg.content.trim().length > 0);
        
        console.log(`[ChatAI Stream] Sending ${streamRequestBody.conversation_history.length} messages to Python streaming`);
      }
      
      const response = await axios.post(
        `${PYTHON_AI_API_URL}/ask-stream`,
        streamRequestBody,
        {
          responseType: 'stream',
          timeout: 60000,
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
        console.log(`[ChatAI Stream] Streaming completed`);
      });

      response.data.on('error', (error) => {
        console.error('[ChatAI Stream] Streaming error:', error);
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

/**
 * Lấy database schema để cung cấp cho AI service
 * GET /api/v1/chat-ai/schema
 */
const getSchema = async (req, res) => {
  try {
    console.log(`[ChatAI] Schema requested`);

    const format = req.query.format || 'text'; // 'text' or 'json'

    if (format === 'json') {
      const schema = await DatabaseSchemaService.getSchemaJSON();
      return res.status(200).json({
        success: true,
        data: schema,
        timestamp: new Date().toISOString()
      });
    } else {
      const schemaText = await DatabaseSchemaService.getSchemaDescription();
      return res.status(200).json({
        success: true,
        data: {
          schema: schemaText,
          format: 'text'
        },
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('[ChatAI] Error getting schema:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy database schema',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  askAI,
  askAIStream,
  checkHealth,
  getStats,
  getQuickQuestions,
  getSchema
};