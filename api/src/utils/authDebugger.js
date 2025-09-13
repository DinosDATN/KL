const JWTDebugger = require('./jwtDebugger');
const DatabaseValidator = require('./dbValidator');
const { User, ChatRoom, ChatMessage } = require('../models');

/**
 * Comprehensive Authentication Debugging and Testing Utilities
 * Provides detailed logging, testing, and debugging for authentication flows
 */

class AuthDebugger {
  /**
   * Test complete authentication flow
   * @param {string} token - JWT token to test
   * @param {string} source - Source of the test (e.g., 'Socket.IO', 'HTTP API')
   * @returns {Promise<Object>} Complete test results
   */
  static async testAuthenticationFlow(token, source = 'Unknown') {
    console.log(`\n🧪 TESTING AUTHENTICATION FLOW - ${source.toUpperCase()}`);
    console.log('='.repeat(60));
    
    const results = {
      source,
      timestamp: new Date().toISOString(),
      success: false,
      steps: {
        tokenPresent: { success: false, details: null, error: null },
        tokenValid: { success: false, details: null, error: null },
        userIdExtracted: { success: false, details: null, error: null },
        userFound: { success: false, details: null, error: null },
        userActive: { success: false, details: null, error: null }
      },
      finalResult: null,
      recommendations: []
    };

    try {
      // Step 1: Check if token is present
      console.log('\n📝 Step 1: Token Presence Check');
      if (!token) {
        results.steps.tokenPresent.error = 'No token provided';
        results.recommendations.push('Ensure JWT token is being sent from client');
        console.log('❌ FAILED: No token provided');
        return results;
      }

      results.steps.tokenPresent.success = true;
      results.steps.tokenPresent.details = `Token present (${token.length} characters)`;
      console.log(`✅ PASSED: Token present (${token.length} characters)`);

      // Step 2: Token validation
      console.log('\n🔐 Step 2: Token Validation');
      const jwtAnalysis = await JWTDebugger.generateDebugReport(token);
      
      if (!jwtAnalysis.tokenAnalysis.valid) {
        results.steps.tokenValid.error = jwtAnalysis.tokenAnalysis.errors.join(', ');
        results.recommendations.push('Fix JWT token validation issues');
        console.log('❌ FAILED: Token validation failed');
        return results;
      }

      results.steps.tokenValid.success = true;
      results.steps.tokenValid.details = jwtAnalysis.tokenAnalysis;
      console.log('✅ PASSED: Token is valid');

      // Step 3: User ID extraction
      console.log('\n👤 Step 3: User ID Extraction');
      const decoded = jwtAnalysis.tokenAnalysis.decoded;
      let userId = null;

      // Try multiple field names
      const userIdFields = ['userId', 'id', 'user_id', 'sub'];
      for (const field of userIdFields) {
        if (decoded[field]) {
          userId = decoded[field];
          results.steps.userIdExtracted.details = { field, value: userId };
          break;
        }
      }

      if (!userId) {
        results.steps.userIdExtracted.error = 'No user ID found in token payload';
        results.recommendations.push('Fix JWT token generation to include user ID');
        console.log('❌ FAILED: No user ID found in token');
        return results;
      }

      results.steps.userIdExtracted.success = true;
      console.log(`✅ PASSED: User ID extracted: ${userId}`);

      // Step 4: Database user lookup
      console.log('\n🗄️ Step 4: Database User Lookup');
      const userValidation = DatabaseValidator.validateUserId(userId);
      if (!userValidation.valid) {
        results.steps.userFound.error = userValidation.error;
        results.recommendations.push('Ensure user ID is valid');
        console.log('❌ FAILED: Invalid user ID');
        return results;
      }

      const userLookup = await DatabaseValidator.safeFindByPk(User, userId, {
        attributes: ['id', 'name', 'email', 'is_active', 'role', 'created_at']
      });

      if (!userLookup.success) {
        results.steps.userFound.error = userLookup.error;
        results.recommendations.push('Check database connectivity and user existence');
        console.log('❌ FAILED: Database lookup failed');
        return results;
      }

      if (!userLookup.data) {
        results.steps.userFound.error = `User with ID ${userId} not found in database`;
        results.recommendations.push('Ensure user exists in database or handle missing users');
        console.log('❌ FAILED: User not found');
        return results;
      }

      results.steps.userFound.success = true;
      results.steps.userFound.details = userLookup.data;
      console.log(`✅ PASSED: User found: ${userLookup.data.name} (${userLookup.data.email})`);

      // Step 5: User active status check
      console.log('\n✅ Step 5: User Active Status Check');
      if (!userLookup.data.is_active) {
        results.steps.userActive.error = 'User account is deactivated';
        results.recommendations.push('Reactivate user account or handle deactivated users');
        console.log('❌ FAILED: User account is deactivated');
        return results;
      }

      results.steps.userActive.success = true;
      results.steps.userActive.details = { is_active: true };
      console.log('✅ PASSED: User account is active');

      // All steps passed
      results.success = true;
      results.finalResult = userLookup.data;
      results.recommendations.push('✅ Authentication flow completed successfully');

      console.log('\n🎉 AUTHENTICATION FLOW: COMPLETE SUCCESS');
      console.log('='.repeat(60));

    } catch (error) {
      console.error('\n💥 Unexpected error during authentication test:', error);
      results.recommendations.push(`Fix unexpected error: ${error.message}`);
    }

    return results;
  }

  /**
   * Test Socket.IO specific authentication
   * @param {Object} socket - Socket.IO socket object
   * @returns {Promise<Object>} Socket auth test results
   */
  static async testSocketIOAuth(socket) {
    console.log('\n🔌 TESTING SOCKET.IO AUTHENTICATION');
    console.log('='.repeat(50));

    const results = {
      socketId: socket.id,
      clientAddress: socket.handshake.address,
      tokenSources: {},
      selectedToken: null,
      authResult: null
    };

    // Test all possible token sources
    const tokenSources = [
      { name: 'auth.token', value: socket.handshake.auth?.token },
      { name: 'headers.authorization', value: socket.handshake.headers?.authorization?.replace('Bearer ', '') },
      { name: 'query.token', value: socket.handshake.query?.token },
      { name: 'query.jwt', value: socket.handshake.query?.jwt },
      { name: 'query.access_token', value: socket.handshake.query?.access_token }
    ];

    console.log('\n🔍 Checking token sources:');
    for (const source of tokenSources) {
      const hasToken = !!(source.value && source.value.trim());
      results.tokenSources[source.name] = {
        present: hasToken,
        value: hasToken ? `${source.value.substring(0, 20)}...` : null
      };
      
      console.log(`${hasToken ? '✅' : '❌'} ${source.name}: ${hasToken ? 'Present' : 'Missing'}`);
      
      if (hasToken && !results.selectedToken) {
        results.selectedToken = source.value.trim();
      }
    }

    // Test authentication with selected token
    if (results.selectedToken) {
      results.authResult = await this.testAuthenticationFlow(results.selectedToken, 'Socket.IO');
    }

    return results;
  }

  /**
   * Test database operations with validation
   * @param {number} userId - User ID to test with
   * @returns {Promise<Object>} Database test results
   */
  static async testDatabaseOperations(userId) {
    console.log('\n💾 TESTING DATABASE OPERATIONS');
    console.log('='.repeat(40));

    const results = {
      userId,
      tests: {}
    };

    // Test user lookup
    console.log('\n👤 Testing user lookup...');
    results.tests.userLookup = await DatabaseValidator.safeFindByPk(User, userId);
    console.log(results.tests.userLookup.success ? '✅ User lookup: SUCCESS' : '❌ User lookup: FAILED');
    if (results.tests.userLookup.error) {
      console.log(`   Error: ${results.tests.userLookup.error}`);
    }

    // Test chat room membership lookup
    console.log('\n🏠 Testing chat room membership...');
    results.tests.chatRoomMembership = await DatabaseValidator.safeFindAll(
      require('../models').ChatRoomMember,
      { user_id: userId },
      { user_id: { type: 'id' } }
    );
    console.log(results.tests.chatRoomMembership.success ? '✅ Room membership: SUCCESS' : '❌ Room membership: FAILED');
    if (results.tests.chatRoomMembership.success) {
      console.log(`   Found ${results.tests.chatRoomMembership.count} room memberships`);
    }

    // Test message lookup
    console.log('\n💬 Testing message lookup...');
    results.tests.messages = await DatabaseValidator.safeFindAll(
      ChatMessage,
      { sender_id: userId },
      { sender_id: { type: 'id' } },
      { limit: 5, order: [['created_at', 'DESC']] }
    );
    console.log(results.tests.messages.success ? '✅ Message lookup: SUCCESS' : '❌ Message lookup: FAILED');
    if (results.tests.messages.success) {
      console.log(`   Found ${results.tests.messages.count} messages`);
    }

    return results;
  }

  /**
   * Generate comprehensive system health report
   * @returns {Promise<Object>} System health report
   */
  static async generateSystemHealthReport() {
    console.log('\n🏥 SYSTEM HEALTH REPORT');
    console.log('='.repeat(40));

    const report = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      checks: {}
    };

    // Check environment variables
    console.log('\n🔧 Environment Variables:');
    const requiredEnvVars = ['JWT_SECRET', 'DB_HOST', 'DB_NAME', 'DB_USER'];
    report.checks.environment = {};
    
    for (const envVar of requiredEnvVars) {
      const present = !!process.env[envVar];
      report.checks.environment[envVar] = present;
      console.log(`${present ? '✅' : '❌'} ${envVar}: ${present ? 'Set' : 'Missing'}`);
    }

    // Check database connectivity
    console.log('\n🗄️ Database Connectivity:');
    try {
      await User.findOne({ limit: 1 });
      report.checks.database = { connected: true, error: null };
      console.log('✅ Database: Connected');
    } catch (error) {
      report.checks.database = { connected: false, error: error.message };
      console.log('❌ Database: Connection failed');
      console.log(`   Error: ${error.message}`);
    }

    // Check user table
    console.log('\n👥 User Table:');
    try {
      const userCount = await User.count();
      report.checks.userTable = { accessible: true, count: userCount, error: null };
      console.log(`✅ User table: ${userCount} users found`);
    } catch (error) {
      report.checks.userTable = { accessible: false, count: 0, error: error.message };
      console.log('❌ User table: Not accessible');
    }

    // Generate recommendations
    report.recommendations = [];
    
    if (!report.checks.environment.JWT_SECRET) {
      report.recommendations.push('Set JWT_SECRET environment variable');
    }
    
    if (!report.checks.database.connected) {
      report.recommendations.push('Fix database connection issues');
    }
    
    if (!report.checks.userTable.accessible) {
      report.recommendations.push('Ensure User model and table are properly configured');
    }

    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(rec => console.log(`• ${rec}`));

    return report;
  }

  /**
   * Create test JWT token for debugging
   * @param {number} userId - User ID to include in token
   * @param {Object} options - Token options
   * @returns {string} Test JWT token
   */
  static createTestToken(userId, options = {}) {
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'test-secret';
    
    const payload = {
      userId: userId,
      // Include alternative field names for testing
      id: userId,
      user_id: userId,
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (options.expiresIn || 3600), // 1 hour default
      ...options.extraFields
    };

    const token = jwt.sign(payload, secret);
    console.log('🔨 Test token created:', token.substring(0, 50) + '...');
    return token;
  }

  /**
   * Run complete authentication test suite
   * @param {string} token - Token to test (optional)
   * @param {number} userId - User ID to test with (optional)
   * @returns {Promise<Object>} Complete test results
   */
  static async runTestSuite(token = null, userId = null) {
    console.log('\n🧪 RUNNING COMPLETE AUTHENTICATION TEST SUITE');
    console.log('='.repeat(60));
    
    const results = {
      timestamp: new Date().toISOString(),
      systemHealth: null,
      authFlow: null,
      databaseOps: null,
      overallSuccess: false
    };

    try {
      // System health check
      results.systemHealth = await this.generateSystemHealthReport();

      // Authentication flow test (if token provided)
      if (token) {
        results.authFlow = await this.testAuthenticationFlow(token, 'Test Suite');
      } else if (userId) {
        // Create test token if user ID provided
        const testToken = this.createTestToken(userId);
        results.authFlow = await this.testAuthenticationFlow(testToken, 'Test Suite');
      }

      // Database operations test (if user ID provided or extracted)
      const testUserId = userId || results.authFlow?.finalResult?.id;
      if (testUserId) {
        results.databaseOps = await this.testDatabaseOperations(testUserId);
      }

      // Determine overall success
      results.overallSuccess = 
        results.systemHealth?.checks?.database?.connected &&
        (!results.authFlow || results.authFlow.success) &&
        (!results.databaseOps || Object.values(results.databaseOps.tests).every(test => test.success));

      console.log('\n🎯 TEST SUITE RESULTS:');
      console.log(`Overall Success: ${results.overallSuccess ? '✅ PASSED' : '❌ FAILED'}`);
      
    } catch (error) {
      console.error('\n💥 Test suite error:', error);
      results.error = error.message;
    }

    return results;
  }

  /**
   * Log authentication event for monitoring
   * @param {string} event - Event type
   * @param {Object} data - Event data
   * @param {boolean} success - Whether event was successful
   */
  static logAuthEvent(event, data, success = true) {
    const logLevel = success ? 'INFO' : 'ERROR';
    const status = success ? '✅' : '❌';
    const timestamp = new Date().toISOString();
    
    console.log(`\n[${logLevel}] ${timestamp} ${status} AUTH_${event.toUpperCase()}`);
    
    if (data.userId) console.log(`   User ID: ${data.userId}`);
    if (data.socketId) console.log(`   Socket ID: ${data.socketId}`);
    if (data.clientAddress) console.log(`   Client: ${data.clientAddress}`);
    if (data.error) console.log(`   Error: ${data.error}`);
    if (data.duration) console.log(`   Duration: ${data.duration}ms`);
    
    // In production, this could be sent to a monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to monitoring service (e.g., DataDog, New Relic, etc.)
    }
  }
}

module.exports = AuthDebugger;
