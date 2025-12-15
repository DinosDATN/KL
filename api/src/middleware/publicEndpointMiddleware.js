/**
 * Public Endpoint Protection Middleware
 * Bảo vệ các endpoint public nhưng giới hạn thông tin trả về cho external requests
 */

const { optionalAuth } = require('./authMiddleware');

// Middleware để giới hạn dữ liệu cho external requests
const limitPublicData = (req, res, next) => {
  const origin = req.get('Origin') || req.get('Referer') || '';
  const userAgent = req.get('User-Agent') || '';
  
  // Kiểm tra xem có phải từ frontend không
  const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:4200',
    'https://pdkhang.online',
    'https://www.pdkhang.online'
  ];
  
  const isFromFrontend = allowedOrigins.some(allowedOrigin => 
    origin.includes(allowedOrigin.replace('http://', '').replace('https://', ''))
  );
  
  // Nếu không phải từ frontend, đánh dấu để giới hạn dữ liệu
  if (!isFromFrontend && !req.user) {
    req.isExternalRequest = true;
  }
  
  next();
};

// Middleware kết hợp optionalAuth và limitPublicData
const protectedPublicEndpoint = [optionalAuth, limitPublicData];

module.exports = {
  limitPublicData,
  protectedPublicEndpoint
};