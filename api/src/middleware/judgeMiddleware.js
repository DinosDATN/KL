const judgeService = require('../services/judgeService');

/**
 * Rate limiting for Judge0 operations
 * Prevents abuse and ensures fair usage
 */
const rateLimitMap = new Map();

const rateLimit = (maxRequests = 10, windowMs = 60000) => {
  return (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitMap.has(identifier)) {
      rateLimitMap.set(identifier, []);
    }
    
    const requests = rateLimitMap.get(identifier);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    // Add current request
    validRequests.push(now);
    rateLimitMap.set(identifier, validRequests);
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      cleanupRateLimit(windowMs);
    }
    
    next();
  };
};

/**
 * Cleanup old rate limit entries
 */
function cleanupRateLimit(windowMs) {
  const now = Date.now();
  for (const [identifier, requests] of rateLimitMap.entries()) {
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
    if (validRequests.length === 0) {
      rateLimitMap.delete(identifier);
    } else {
      rateLimitMap.set(identifier, validRequests);
    }
  }
}

/**
 * Validate source code input
 */
const validateSourceCode = (req, res, next) => {
  const { sourceCode, language } = req.body;
  
  if (!sourceCode) {
    return res.status(400).json({
      success: false,
      message: 'Source code is required'
    });
  }
  
  if (!language) {
    return res.status(400).json({
      success: false,
      message: 'Programming language is required'
    });
  }
  
  // Check source code length (prevent abuse)
  if (sourceCode.length > 65535) { // 64KB limit
    return res.status(400).json({
      success: false,
      message: 'Source code is too long. Maximum size is 64KB.'
    });
  }
  
  // Check if language is supported
  if (!judgeService.isLanguageSupported(language)) {
    return res.status(400).json({
      success: false,
      message: `Unsupported programming language: ${language}`,
      supportedLanguages: judgeService.getSupportedLanguages().map(l => l.id)
    });
  }
  
  next();
};

/**
 * Validate input data
 */
const validateInput = (req, res, next) => {
  const { input } = req.body;
  
  if (input && input.length > 10240) { // 10KB limit for input
    return res.status(400).json({
      success: false,
      message: 'Input data is too long. Maximum size is 10KB.'
    });
  }
  
  next();
};

/**
 * Log Judge0 operations for monitoring and debugging
 */
const logJudgeOperation = (req, res, next) => {
  const startTime = Date.now();
  const { sourceCode, language, input } = req.body;
  
  // Log request
  console.log(`[Judge0] ${new Date().toISOString()} - ${req.method} ${req.path}`, {
    language,
    sourceCodeLength: sourceCode ? sourceCode.length : 0,
    inputLength: input ? input.length : 0,
    userId: req.body.userId || 'anonymous',
    ip: req.ip
  });
  
  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    console.log(`[Judge0] Response ${res.statusCode}`, {
      duration: `${duration}ms`,
      success: data.success,
      hasData: !!data.data,
      error: data.error || null
    });
    
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Security headers for Judge0 operations
 */
const securityHeaders = (req, res, next) => {
  // Prevent caching of sensitive responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  next();
};

/**
 * Error handler for Judge0 operations
 */
const errorHandler = (error, req, res, next) => {
  console.error('[Judge0] Error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });
  
  // Don't expose internal errors to client
  if (error.message.includes('Judge0') || error.message.includes('RapidAPI')) {
    return res.status(503).json({
      success: false,
      message: 'Code execution service is temporarily unavailable',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

/**
 * Sanitize output for security
 */
const sanitizeOutput = (req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    if (data.data && typeof data.data === 'object') {
      // Remove potentially sensitive information
      if (data.data.rawResult) {
        delete data.data.rawResult.token;
      }
      
      // Sanitize stdout/stderr
      if (data.data.stdout) {
        data.data.stdout = data.data.stdout.replace(/\/[a-zA-Z0-9\/\-_\.]+/g, '[PATH]');
      }
      
      if (data.data.stderr) {
        data.data.stderr = data.data.stderr.replace(/\/[a-zA-Z0-9\/\-_\.]+/g, '[PATH]');
      }
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = {
  rateLimit,
  validateSourceCode,
  validateInput,
  logJudgeOperation,
  securityHeaders,
  errorHandler,
  sanitizeOutput
};
