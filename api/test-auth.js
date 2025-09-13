#!/usr/bin/env node

/**
 * Authentication Testing and Debugging Script
 * Run this script to diagnose and fix Socket.IO authentication issues
 * 
 * Usage:
 * node test-auth.js [userId] [token]
 * node test-auth.js --help
 */

require('dotenv').config();
const AuthDebugger = require('./src/utils/authDebugger');
const JWTDebugger = require('./src/utils/jwtDebugger');
const { User } = require('./src/models');

const COLORS = {
  RESET: '\x1b[0m',
  BRIGHT: '\x1b[1m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m'
};

function colorLog(message, color = COLORS.RESET) {
  console.log(color + message + COLORS.RESET);
}

function showHelp() {
  colorLog('\n🔧 AUTHENTICATION TESTING AND DEBUGGING SCRIPT', COLORS.CYAN + COLORS.BRIGHT);
  colorLog('='.repeat(60), COLORS.CYAN);
  
  console.log('\nUsage:');
  console.log('  node test-auth.js                     # Run system health check');
  console.log('  node test-auth.js [userId]             # Test with specific user ID');
  console.log('  node test-auth.js [userId] [token]     # Test with user ID and token');
  console.log('  node test-auth.js --token [token]      # Test specific token');
  console.log('  node test-auth.js --create-token [id]  # Create test token for user');
  console.log('  node test-auth.js --help               # Show this help');
  
  console.log('\nExamples:');
  console.log('  node test-auth.js 1                    # Test user ID 1');
  console.log('  node test-auth.js 1 eyJ0eXAi...        # Test user 1 with token');
  console.log('  node test-auth.js --create-token 1     # Create test token for user 1');
  
  console.log('\nThis script will:');
  console.log('  ✅ Check system health and configuration');
  console.log('  ✅ Test JWT token validation and user extraction');
  console.log('  ✅ Validate database operations');
  console.log('  ✅ Generate recommendations for fixes');
  console.log('  ✅ Create test tokens for debugging');
}

async function main() {
  const args = process.argv.slice(2);
  
  // Handle help
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  colorLog('\n🚀 SOCKET.IO AUTHENTICATION DEBUGGER', COLORS.MAGENTA + COLORS.BRIGHT);
  colorLog('='.repeat(50), COLORS.MAGENTA);
  colorLog(`Environment: ${process.env.NODE_ENV || 'development'}`, COLORS.BLUE);
  colorLog(`Timestamp: ${new Date().toISOString()}`, COLORS.BLUE);

  try {
    // Handle special flags
    if (args.includes('--create-token')) {
      const tokenIndex = args.indexOf('--create-token');
      const userId = args[tokenIndex + 1];
      
      if (!userId || isNaN(userId)) {
        colorLog('\n❌ Error: Please provide a valid user ID for token creation', COLORS.RED);
        process.exit(1);
      }
      
      colorLog('\n🔨 Creating test token...', COLORS.YELLOW);
      const token = AuthDebugger.createTestToken(parseInt(userId));
      
      colorLog('\n✅ Test token created successfully!', COLORS.GREEN);
      console.log('\nToken:', token);
      console.log('\nYou can now test this token with:');
      console.log(`node test-auth.js ${userId} ${token}`);
      
      process.exit(0);
    }

    if (args.includes('--token')) {
      const tokenIndex = args.indexOf('--token');
      const token = args[tokenIndex + 1];
      
      if (!token) {
        colorLog('\n❌ Error: Please provide a token to test', COLORS.RED);
        process.exit(1);
      }
      
      const results = await AuthDebugger.testAuthenticationFlow(token, 'CLI Test');
      printResults(results);
      process.exit(results.success ? 0 : 1);
    }

    // Parse regular arguments
    const userId = args[0] ? parseInt(args[0]) : null;
    const token = args[1] || null;

    // Run comprehensive test suite
    const results = await AuthDebugger.runTestSuite(token, userId);
    
    // Print results
    printDetailedResults(results);
    
    // Generate final recommendations
    generateFinalRecommendations(results);
    
    // Exit with appropriate code
    process.exit(results.overallSuccess ? 0 : 1);
    
  } catch (error) {
    colorLog(`\n💥 Fatal error: ${error.message}`, COLORS.RED);
    console.error(error.stack);
    process.exit(1);
  }
}

function printResults(results) {
  colorLog('\n📊 TEST RESULTS:', COLORS.CYAN + COLORS.BRIGHT);
  colorLog('-'.repeat(30), COLORS.CYAN);
  
  const status = results.success ? '✅ SUCCESS' : '❌ FAILED';
  const color = results.success ? COLORS.GREEN : COLORS.RED;
  
  colorLog(`Overall Status: ${status}`, color + COLORS.BRIGHT);
  
  if (results.finalResult) {
    console.log('\n👤 User Details:');
    console.log(`   ID: ${results.finalResult.id}`);
    console.log(`   Name: ${results.finalResult.name}`);
    console.log(`   Email: ${results.finalResult.email}`);
    console.log(`   Active: ${results.finalResult.is_active ? '✅' : '❌'}`);
  }
  
  if (results.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    results.recommendations.forEach(rec => {
      const icon = rec.startsWith('✅') ? '  ' : '  • ';
      console.log(`${icon}${rec}`);
    });
  }
}

function printDetailedResults(results) {
  colorLog('\n📈 DETAILED TEST RESULTS:', COLORS.CYAN + COLORS.BRIGHT);
  colorLog('='.repeat(40), COLORS.CYAN);
  
  // Overall status
  const overallStatus = results.overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED';
  const overallColor = results.overallSuccess ? COLORS.GREEN : COLORS.RED;
  colorLog(`\nOverall Status: ${overallStatus}`, overallColor + COLORS.BRIGHT);
  
  // System health
  if (results.systemHealth) {
    colorLog('\n🏥 System Health:', COLORS.BLUE + COLORS.BRIGHT);
    const dbStatus = results.systemHealth.checks.database?.connected ? '✅ Connected' : '❌ Failed';
    console.log(`   Database: ${dbStatus}`);
    
    const envVars = results.systemHealth.checks.environment || {};
    const jwtSecretStatus = envVars.JWT_SECRET ? '✅ Set' : '❌ Missing';
    console.log(`   JWT Secret: ${jwtSecretStatus}`);
    
    const userTableStatus = results.systemHealth.checks.userTable?.accessible ? '✅ Accessible' : '❌ Failed';
    console.log(`   User Table: ${userTableStatus}`);
    
    if (results.systemHealth.checks.userTable?.count !== undefined) {
      console.log(`   User Count: ${results.systemHealth.checks.userTable.count}`);
    }
  }
  
  // Authentication flow
  if (results.authFlow) {
    colorLog('\n🔐 Authentication Flow:', COLORS.BLUE + COLORS.BRIGHT);
    const authStatus = results.authFlow.success ? '✅ Passed' : '❌ Failed';
    const authColor = results.authFlow.success ? COLORS.GREEN : COLORS.RED;
    colorLog(`   Status: ${authStatus}`, authColor);
    
    // Show step details
    Object.entries(results.authFlow.steps).forEach(([step, data]) => {
      const stepStatus = data.success ? '✅' : '❌';
      console.log(`   ${step}: ${stepStatus}`);
      if (data.error) {
        console.log(`      Error: ${data.error}`);
      }
    });
    
    if (results.authFlow.finalResult) {
      console.log(`   User Found: ${results.authFlow.finalResult.name} (${results.authFlow.finalResult.email})`);
    }
  }
  
  // Database operations
  if (results.databaseOps) {
    colorLog('\n💾 Database Operations:', COLORS.BLUE + COLORS.BRIGHT);
    Object.entries(results.databaseOps.tests).forEach(([test, result]) => {
      const testStatus = result.success ? '✅' : '❌';
      console.log(`   ${test}: ${testStatus}`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
      if (result.count !== undefined) {
        console.log(`      Records: ${result.count}`);
      }
    });
  }
}

function generateFinalRecommendations(results) {
  colorLog('\n🎯 FINAL RECOMMENDATIONS:', COLORS.YELLOW + COLORS.BRIGHT);
  colorLog('='.repeat(40), COLORS.YELLOW);
  
  const recommendations = [];
  
  // System health recommendations
  if (!results.systemHealth?.checks?.database?.connected) {
    recommendations.push('🔥 CRITICAL: Fix database connection issues');
  }
  
  if (!results.systemHealth?.checks?.environment?.JWT_SECRET) {
    recommendations.push('🔥 CRITICAL: Set JWT_SECRET environment variable');
  }
  
  // Authentication flow recommendations
  if (results.authFlow && !results.authFlow.success) {
    const failedStep = Object.entries(results.authFlow.steps).find(([_, data]) => !data.success);
    if (failedStep) {
      const [stepName, stepData] = failedStep;
      recommendations.push(`🚨 URGENT: Fix ${stepName} - ${stepData.error}`);
    }
  }
  
  // Database operation recommendations
  if (results.databaseOps) {
    const failedTests = Object.entries(results.databaseOps.tests).filter(([_, test]) => !test.success);
    failedTests.forEach(([testName, test]) => {
      recommendations.push(`⚠️ WARNING: ${testName} failed - ${test.error}`);
    });
  }
  
  // Specific fixes for common issues
  if (results.authFlow?.steps?.userIdExtracted?.error?.includes('No user ID found')) {
    recommendations.push('🔧 FIX: Update Socket.IO auth to use decoded.userId instead of decoded.id');
  }
  
  if (recommendations.length === 0) {
    colorLog('\n🎉 All systems are working correctly!', COLORS.GREEN + COLORS.BRIGHT);
    colorLog('Your Socket.IO authentication should be working properly.', COLORS.GREEN);
  } else {
    recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. ${rec}`);
    });
  }
  
  // Show quick fix commands
  colorLog('\n🚀 QUICK FIX COMMANDS:', COLORS.MAGENTA + COLORS.BRIGHT);
  console.log('\n1. To fix the main Socket.IO authentication issue:');
  colorLog('   Edit: api/src/socket/chatHandler.js', COLORS.CYAN);
  colorLog('   Change: decoded.id → decoded.userId', COLORS.CYAN);
  
  console.log('\n2. To use the new enhanced authentication middleware:');
  colorLog('   Replace the authenticateSocket function with the new middleware', COLORS.CYAN);
  
  console.log('\n3. To test a specific user:');
  colorLog('   node test-auth.js [userId]', COLORS.CYAN);
  
  console.log('\n4. To create a test token:');
  colorLog('   node test-auth.js --create-token [userId]', COLORS.CYAN);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  colorLog('\n💥 Unhandled Rejection:', COLORS.RED);
  console.error(reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  colorLog('\n💥 Uncaught Exception:', COLORS.RED);
  console.error(error);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main();
}
