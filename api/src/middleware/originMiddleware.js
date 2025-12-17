/**
 * Origin Protection Middleware
 * Chỉ cho phép requests từ frontend domain được phép
 */

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:4200',
  'https://pdkhang.online',
  'https://www.pdkhang.online',
  'http://localhost:4200',
  'http://127.0.0.1:4200'
];

const checkOrigin = (req, res, next) => {
  // Skip origin check for health endpoint and OAuth callbacks (Google redirects không có Origin)
  if (
    req.path === '/health' ||
    req.path === '/api/v1/auth/google/callback' ||
    req.path === '/api/v1/auth/google/failure'
  ) {
    return next();
  }

  // Allow localhost/server-side requests (no Origin header)
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  if (clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === '::ffff:127.0.0.1') {
    return next();
  }

  const origin = req.get('Origin') || req.get('Referer');
  const userAgent = req.get('User-Agent') || '';

  // Allow requests from allowed origins
  if (origin) {
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (origin === allowedOrigin) return true;
      if (origin.startsWith(allowedOrigin)) return true;
      return false;
    });

    if (isAllowed) {
      return next();
    }
  }

  // Allow requests from browsers (có User-Agent của browser)
  const browserPatterns = [
    /Mozilla/i,
    /Chrome/i,
    /Safari/i,
    /Firefox/i,
    /Edge/i
  ];

  const isBrowser = browserPatterns.some(pattern => pattern.test(userAgent));
  
  // Nếu là browser và có Referer từ domain được phép
  if (isBrowser && req.get('Referer')) {
    const referer = req.get('Referer');
    const isAllowedReferer = allowedOrigins.some(allowedOrigin => 
      referer.startsWith(allowedOrigin)
    );
    
    if (isAllowedReferer) {
      return next();
    }
  }

  // Block tất cả requests khác (curl, postman, etc.)
  console.log(`🚫 Blocked request from origin: ${origin}, User-Agent: ${userAgent}, Path: ${req.path}`);
  
  return res.status(403).json({
    success: false,
    message: 'Access denied. This API is only accessible from authorized applications.',
    error: 'Invalid origin'
  });
};

module.exports = {
  checkOrigin
};