const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * JWT Token Analysis and Debugging Utility
 * Helps identify token structure issues and validate JWT tokens
 */
class JWTDebugger {
  /**
   * Decode JWT token and analyze its structure
   * @param {string} token - JWT token to analyze
   * @param {boolean} requireSecret - Whether to use secret for verification
   * @returns {Object} Analysis results
   */
  static analyzeToken(token, requireSecret = false) {
    const results = {
      valid: false,
      decoded: null,
      header: null,
      payload: null,
      signature: null,
      possibleUserIdFields: [],
      errors: [],
      warnings: []
    };

    try {
      // Split token into parts
      const parts = token.split('.');
      if (parts.length !== 3) {
        results.errors.push('Invalid JWT format - token must have 3 parts separated by dots');
        return results;
      }

      // Decode header
      try {
        results.header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
      } catch (error) {
        results.errors.push('Failed to decode JWT header: ' + error.message);
      }

      // Decode payload (without verification)
      try {
        results.payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      } catch (error) {
        results.errors.push('Failed to decode JWT payload: ' + error.message);
        return results;
      }

      // Store signature
      results.signature = parts[2];

      // Verify token if secret is required
      if (requireSecret) {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          results.errors.push('JWT_SECRET environment variable not set');
          return results;
        }

        try {
          results.decoded = jwt.verify(token, secret);
          results.valid = true;
        } catch (error) {
          results.errors.push('JWT verification failed: ' + error.message);
          if (error.name === 'TokenExpiredError') {
            results.warnings.push('Token is expired but payload is readable');
          }
        }
      } else {
        results.decoded = results.payload;
        results.valid = true;
      }

      // Analyze possible user ID fields
      this.findUserIdFields(results.payload || results.decoded, results);

      // Check token expiry
      if (results.payload && results.payload.exp) {
        const now = Math.floor(Date.now() / 1000);
        const isExpired = results.payload.exp < now;
        if (isExpired) {
          results.warnings.push(`Token expired ${new Date(results.payload.exp * 1000).toISOString()}`);
        } else {
          const timeLeft = results.payload.exp - now;
          results.warnings.push(`Token expires in ${Math.floor(timeLeft / 3600)} hours`);
        }
      }

      // Check issued at
      if (results.payload && results.payload.iat) {
        results.warnings.push(`Token issued at ${new Date(results.payload.iat * 1000).toISOString()}`);
      }

    } catch (error) {
      results.errors.push('General error analyzing token: ' + error.message);
    }

    return results;
  }

  /**
   * Find potential user ID fields in the token payload
   * @param {Object} payload - JWT payload
   * @param {Object} results - Results object to populate
   */
  static findUserIdFields(payload, results) {
    const commonUserIdFields = [
      'id', 'userId', 'user_id', 'sub', 'subject', 
      'uid', 'user', 'account_id', 'accountId'
    ];

    if (!payload) {
      results.warnings.push('No payload available to analyze user ID fields');
      return;
    }

    commonUserIdFields.forEach(field => {
      if (payload.hasOwnProperty(field)) {
        results.possibleUserIdFields.push({
          field: field,
          value: payload[field],
          type: typeof payload[field]
        });
      }
    });

    // Check for any numeric fields that might be user IDs
    Object.keys(payload).forEach(key => {
      const value = payload[key];
      if (typeof value === 'number' && value > 0 && !commonUserIdFields.includes(key)) {
        results.possibleUserIdFields.push({
          field: key,
          value: value,
          type: 'number',
          note: 'Detected as potential user ID (numeric value)'
        });
      }
    });

    if (results.possibleUserIdFields.length === 0) {
      results.warnings.push('No obvious user ID fields found in token');
    }
  }

  /**
   * Test token against database user lookup
   * @param {string} token - JWT token
   * @param {string[]} userIdFields - Fields to test for user lookup
   * @returns {Object} Test results
   */
  static async testUserLookup(token, userIdFields = ['id', 'userId', 'user_id', 'sub']) {
    const results = {
      tokenAnalysis: null,
      userLookupResults: {},
      recommendations: []
    };

    try {
      // Analyze token first
      results.tokenAnalysis = this.analyzeToken(token, true);
      
      if (!results.tokenAnalysis.valid || !results.tokenAnalysis.decoded) {
        results.recommendations.push('Fix token validation issues first');
        return results;
      }

      const decoded = results.tokenAnalysis.decoded;

      // Test each potential user ID field
      for (const field of userIdFields) {
        if (decoded[field]) {
          try {
            const user = await User.findByPk(decoded[field], {
              attributes: ['id', 'name', 'email', 'is_active']
            });

            results.userLookupResults[field] = {
              userId: decoded[field],
              userFound: !!user,
              user: user ? {
                id: user.id,
                name: user.name,
                email: user.email,
                is_active: user.is_active
              } : null,
              error: null
            };

            if (user && user.is_active) {
              results.recommendations.push(`✅ Field '${field}' successfully found active user: ${user.name}`);
            } else if (user && !user.is_active) {
              results.recommendations.push(`⚠️ Field '${field}' found user but account is inactive: ${user.name}`);
            } else {
              results.recommendations.push(`❌ Field '${field}' value ${decoded[field]} not found in database`);
            }

          } catch (error) {
            results.userLookupResults[field] = {
              userId: decoded[field],
              userFound: false,
              user: null,
              error: error.message
            };
            results.recommendations.push(`❌ Error testing field '${field}': ${error.message}`);
          }
        } else {
          results.recommendations.push(`⚠️ Field '${field}' not found in token`);
        }
      }

    } catch (error) {
      results.recommendations.push(`Fatal error in user lookup test: ${error.message}`);
    }

    return results;
  }

  /**
   * Generate a comprehensive debugging report
   * @param {string} token - JWT token to debug
   * @returns {Object} Complete debugging report
   */
  static async generateDebugReport(token) {
    console.log('\n🔍 JWT TOKEN DEBUGGING REPORT');
    console.log('================================');
    
    const tokenAnalysis = this.analyzeToken(token, true);
    const userLookupResults = await this.testUserLookup(token);

    const report = {
      timestamp: new Date().toISOString(),
      tokenAnalysis,
      userLookupResults,
      summary: {
        tokenValid: tokenAnalysis.valid,
        possibleUserIdFields: tokenAnalysis.possibleUserIdFields.length,
        recommendedField: null,
        criticalIssues: [],
        suggestions: []
      }
    };

    // Generate summary
    if (!tokenAnalysis.valid) {
      report.summary.criticalIssues.push('JWT token validation failed');
    }

    if (tokenAnalysis.possibleUserIdFields.length === 0) {
      report.summary.criticalIssues.push('No user ID fields found in token');
    }

    // Find recommended field
    const successfulFields = Object.entries(userLookupResults.userLookupResults)
      .filter(([_, result]) => result.userFound && result.user?.is_active);

    if (successfulFields.length > 0) {
      report.summary.recommendedField = successfulFields[0][0];
      report.summary.suggestions.push(`Use '${successfulFields[0][0]}' field for user ID extraction`);
    }

    // Print report to console
    this.printDebugReport(report);

    return report;
  }

  /**
   * Print formatted debug report to console
   * @param {Object} report - Debug report to print
   */
  static printDebugReport(report) {
    console.log('\n📊 TOKEN ANALYSIS:');
    console.log('Valid:', report.tokenAnalysis.valid ? '✅' : '❌');
    console.log('Errors:', report.tokenAnalysis.errors.length);
    console.log('Warnings:', report.tokenAnalysis.warnings.length);

    if (report.tokenAnalysis.payload) {
      console.log('\n📄 TOKEN PAYLOAD:');
      console.log(JSON.stringify(report.tokenAnalysis.payload, null, 2));
    }

    console.log('\n🔑 POSSIBLE USER ID FIELDS:');
    if (report.tokenAnalysis.possibleUserIdFields.length > 0) {
      report.tokenAnalysis.possibleUserIdFields.forEach(field => {
        console.log(`- ${field.field}: ${field.value} (${field.type})${field.note ? ` - ${field.note}` : ''}`);
      });
    } else {
      console.log('❌ No user ID fields detected');
    }

    console.log('\n👤 USER LOOKUP RESULTS:');
    Object.entries(report.userLookupResults.userLookupResults).forEach(([field, result]) => {
      const status = result.userFound ? (result.user?.is_active ? '✅' : '⚠️') : '❌';
      console.log(`${status} ${field}: ${result.userId} → ${result.userFound ? `Found: ${result.user?.name}` : 'Not found'}`);
    });

    console.log('\n💡 RECOMMENDATIONS:');
    report.userLookupResults.recommendations.forEach(rec => {
      console.log(rec);
    });

    if (report.summary.recommendedField) {
      console.log(`\n✅ RECOMMENDED SOLUTION: Use decoded.${report.summary.recommendedField} for user ID extraction`);
    }

    console.log('\n================================\n');
  }

  /**
   * Quick test method for Socket.IO authentication debugging
   * @param {string} token - Token from Socket.IO handshake
   */
  static async debugSocketAuth(token) {
    console.log('\n🚀 SOCKET.IO AUTH DEBUG');
    console.log('Token received:', token ? `${token.substring(0, 20)}...` : 'null');
    
    if (!token) {
      console.log('❌ No token provided');
      return null;
    }

    return await this.generateDebugReport(token);
  }
}

module.exports = JWTDebugger;
