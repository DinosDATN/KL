const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWTDebugger = require('../utils/jwtDebugger');

/**
 * Robust Socket.IO Authentication Middleware
 * Handles multiple token sources and provides comprehensive error handling
 */

/**
 * Extract JWT token from multiple possible sources
 * @param {Object} socket - Socket.IO socket instance
 * @returns {string|null} Extracted token or null
 */
const extractToken = (socket) => {
  const tokenSources = [
    // Method 1: auth.token (most common for Socket.IO)
    socket.handshake.auth?.token,
    
    // Method 2: Authorization header (Bearer format)
    socket.handshake.headers?.authorization?.replace('Bearer ', ''),
    socket.handshake.headers?.Authorization?.replace('Bearer ', ''),
    
    // Method 3: Query parameters (fallback)
    socket.handshake.query?.token,
    socket.handshake.query?.jwt,
    socket.handshake.query?.access_token,
    
    // Method 4: Direct auth properties
    socket.handshake.auth?.accessToken,
    socket.handshake.auth?.jwt,
    
    // Method 5: Headers without Bearer prefix
    socket.handshake.headers?.token,
    socket.handshake.headers?.jwt,
    socket.handshake.headers?.['x-auth-token'],
    socket.handshake.headers?.['x-access-token']
  ];

  // Return first non-empty token found
  for (const token of tokenSources) {
    if (token && typeof token === 'string' && token.trim()) {
      return token.trim();
    }
  }

  return null;
};

/**
 * Extract user ID from decoded JWT token with multiple field fallbacks
 * @param {Object} decoded - Decoded JWT payload
 * @returns {number|string|null} User ID or null
 */
const extractUserId = (decoded) => {
  const userIdFields = [
    'userId',    // Primary field used by your app
    'id',        // Common alternative
    'user_id',   // Snake case variant
    'sub',       // JWT standard subject field
    'uid',       // Short form
    'accountId', // Alternative naming
    'account_id' // Snake case alternative
  ];

  for (const field of userIdFields) {
    if (decoded[field] !== undefined && decoded[field] !== null) {
      // Convert to appropriate type if needed
      const value = decoded[field];
      if (typeof value === 'string' && !isNaN(value)) {
        return parseInt(value, 10);
      }
      if (typeof value === 'number' && value > 0) {
        return value;
      }
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }
  }

  return null;
};

/**
 * Validate user exists and is active in database
 * @param {number|string} userId - User ID to validate
 * @returns {Object} Validation result with user data or error
 */
const validateUser = async (userId) => {
  if (!userId) {
    return {
      valid: false,
      error: 'No user ID provided',
      user: null
    };
  }

  try {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'is_active', 'role', 'last_seen_at']
    });

    if (!user) {
      return {
        valid: false,
        error: `User with ID ${userId} not found in database`,
        user: null
      };
    }

    if (!user.is_active) {
      return {
        valid: false,
        error: `User ${user.name} (ID: ${userId}) account is deactivated`,
        user: user
      };
    }

    return {
      valid: true,
      error: null,
      user: user
    };

  } catch (dbError) {
    return {
      valid: false,
      error: `Database error during user validation: ${dbError.message}`,
      user: null
    };
  }
};

/**
 * Main Socket.IO authentication middleware
 * @param {Object} socket - Socket.IO socket instance
 * @param {Function} next - Next middleware function
 */
const authenticateSocket = async (socket, next) => {
  const startTime = Date.now();
  let debugInfo = {
    socketId: socket.id,
    clientAddress: socket.handshake.address,
    userAgent: socket.handshake.headers['user-agent'],
    timestamp: new Date().toISOString()
  };

  try {
    console.log('\n🔐 Starting Socket.IO authentication...');
    console.log(`📡 Socket ID: ${socket.id}`);
    console.log(`🌐 Client: ${socket.handshake.address}`);

    // Step 1: Extract token from multiple sources
    const token = extractToken(socket);
    
    if (!token) {
      console.log('❌ No authentication token found in any source');
      console.log('📋 Checked sources: auth.token, headers.authorization, query.token, etc.');
      
      const error = new Error('Authentication required - no token provided');
      error.data = { 
        type: 'NO_TOKEN', 
        sources_checked: [
          'handshake.auth.token',
          'headers.authorization',
          'query.token',
          'query.jwt',
          'query.access_token'
        ]
      };
      return next(error);
    }

    console.log(`🔑 Token found: ${token.substring(0, 20)}...`);
    debugInfo.tokenSource = 'detected';
    debugInfo.tokenLength = token.length;

    // Step 2: Verify JWT secret is available
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('❌ JWT_SECRET environment variable is not configured');
      const error = new Error('Server configuration error');
      error.data = { type: 'SERVER_CONFIG', message: 'JWT secret not configured' };
      return next(error);
    }

    // Step 3: Verify and decode JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
      console.log('✅ JWT token verified successfully');
      debugInfo.tokenValid = true;
    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError.message);
      
      // Enhanced JWT error handling
      let errorType = 'INVALID_TOKEN';
      let userMessage = 'Invalid authentication token';
      
      switch (jwtError.name) {
        case 'TokenExpiredError':
          errorType = 'TOKEN_EXPIRED';
          userMessage = 'Authentication token has expired - please login again';
          break;
        case 'JsonWebTokenError':
          errorType = 'MALFORMED_TOKEN';
          userMessage = 'Malformed authentication token';
          break;
        case 'NotBeforeError':
          errorType = 'TOKEN_NOT_ACTIVE';
          userMessage = 'Token is not yet valid';
          break;
        default:
          errorType = 'TOKEN_VERIFICATION_FAILED';
          break;
      }

      const error = new Error(userMessage);
      error.data = { 
        type: errorType, 
        jwtError: jwtError.message,
        expiredAt: jwtError.expiredAt 
      };
      return next(error);
    }

    // Step 4: Extract user ID with fallback options
    const userId = extractUserId(decoded);
    debugInfo.extractedUserId = userId;
    debugInfo.decodedPayload = decoded;

    if (!userId) {
      console.error('❌ No user ID found in JWT token');
      console.error('📄 Token payload:', JSON.stringify(decoded, null, 2));
      
      // Use JWT debugger for detailed analysis in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Running detailed JWT analysis...');
        await JWTDebugger.debugSocketAuth(token);
      }

      const error = new Error('Invalid token structure - no user ID found');
      error.data = { 
        type: 'INVALID_TOKEN_STRUCTURE',
        payload: decoded,
        expected_fields: ['userId', 'id', 'user_id', 'sub']
      };
      return next(error);
    }

    console.log(`👤 User ID extracted: ${userId}`);

    // Step 5: Validate user in database
    const userValidation = await validateUser(userId);
    debugInfo.userValidation = userValidation;

    if (!userValidation.valid) {
      console.error(`❌ User validation failed: ${userValidation.error}`);
      
      const error = new Error(`User validation failed: ${userValidation.error}`);
      error.data = { 
        type: 'USER_VALIDATION_FAILED',
        userId: userId,
        validation_error: userValidation.error 
      };
      return next(error);
    }

    const user = userValidation.user;
    console.log(`✅ User validated: ${user.name} (${user.email})`);

    // Step 6: Attach user data to socket
    socket.userId = user.id;
    socket.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
      lastSeenAt: user.last_seen_at
    };
    socket.authDebugInfo = debugInfo;

    // Step 7: Update user's online status
    try {
      await User.update(
        { 
          is_online: true, 
          last_seen_at: new Date() 
        },
        { 
          where: { id: user.id },
          silent: true // Don't trigger model hooks for performance
        }
      );
    } catch (updateError) {
      // Non-critical error - log but don't fail authentication
      console.warn(`⚠️ Failed to update user online status: ${updateError.message}`);
    }

    const authDuration = Date.now() - startTime;
    console.log(`✅ Socket authentication successful in ${authDuration}ms for user: ${user.name}`);
    
    // Success - proceed to next middleware
    next();

  } catch (unexpectedError) {
    console.error('❌ Unexpected error during Socket.IO authentication:', unexpectedError);
    
    const error = new Error('Authentication system error');
    error.data = { 
      type: 'SYSTEM_ERROR',
      original_error: process.env.NODE_ENV === 'development' ? unexpectedError.message : 'Internal error',
      debug_info: debugInfo
    };
    
    next(error);
  }
};

/**
 * Enhanced error handler for Socket.IO authentication
 * @param {Error} error - Authentication error
 * @param {Object} socket - Socket.IO socket instance
 */
const handleAuthError = (error, socket) => {
  console.error(`🚫 Socket authentication failed for ${socket.id}:`, error.message);
  
  // Send structured error to client
  socket.emit('auth_error', {
    type: error.data?.type || 'AUTHENTICATION_FAILED',
    message: error.message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { debug: error.data })
  });

  // Disconnect socket
  socket.disconnect(true);
};

/**
 * Optional authentication middleware (doesn't fail on missing token)
 * @param {Object} socket - Socket.IO socket instance
 * @param {Function} next - Next middleware function
 */
const optionalSocketAuth = async (socket, next) => {
  try {
    // Try to authenticate, but don't fail if no token
    const token = extractToken(socket);
    
    if (!token) {
      // No token provided - set anonymous user
      socket.userId = null;
      socket.user = null;
      socket.isAnonymous = true;
      console.log(`👻 Anonymous socket connection: ${socket.id}`);
      return next();
    }

    // If token provided, validate it fully
    return authenticateSocket(socket, next);

  } catch (error) {
    // For optional auth, log error but don't fail
    console.warn(`⚠️ Optional authentication failed for ${socket.id}:`, error.message);
    socket.userId = null;
    socket.user = null;
    socket.isAnonymous = true;
    next();
  }
};

module.exports = {
  authenticateSocket,
  optionalSocketAuth,
  handleAuthError,
  extractToken,
  extractUserId,
  validateUser
};
