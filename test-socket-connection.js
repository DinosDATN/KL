#!/usr/bin/env node

/**
 * Script để test Socket.IO connection từ server-side
 * Giúp debug vấn đề realtime không hoạt động
 */

const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');

// Cấu hình
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const TEST_USER_ID = process.env.TEST_USER_ID || 1;

console.log('🧪 SOCKET.IO CONNECTION TEST');
console.log('============================\n');

console.log(`🌍 Server URL: ${SERVER_URL}`);
console.log(`👤 Test User ID: ${TEST_USER_ID}`);

// Tạo JWT token cho test
const testToken = jwt.sign(
  { 
    userId: TEST_USER_ID,
    name: 'Test User',
    email: 'test@example.com'
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

console.log(`🔑 Generated test token: ${testToken.substring(0, 50)}...`);

// Test connection với nhiều phương thức authentication
const testMethods = [
  {
    name: 'Auth Token',
    config: {
      auth: { token: testToken }
    }
  },
  {
    name: 'Authorization Header',
    config: {
      extraHeaders: {
        'Authorization': `Bearer ${testToken}`
      }
    }
  },
  {
    name: 'Query Parameter',
    config: {
      query: { token: testToken }
    }
  },
  {
    name: 'Multiple Methods',
    config: {
      auth: { token: testToken },
      extraHeaders: { 'Authorization': `Bearer ${testToken}` },
      query: { token: testToken }
    }
  }
];

async function testConnection(method) {
  return new Promise((resolve) => {
    console.log(`\n🔄 Testing: ${method.name}`);
    
    const socket = io(SERVER_URL, {
      ...method.config,
      transports: ['websocket', 'polling'],
      timeout: 5000,
      forceNew: true
    });

    const result = {
      method: method.name,
      connected: false,
      authenticated: false,
      error: null,
      socketId: null,
      events: []
    };

    // Connection events
    socket.on('connect', () => {
      console.log(`✅ Connected with Socket ID: ${socket.id}`);
      result.connected = true;
      result.authenticated = true;
      result.socketId = socket.id;
      result.events.push('connect');
    });

    socket.on('connect_error', (error) => {
      console.log(`❌ Connection error: ${error.message}`);
      result.error = error.message;
      result.events.push('connect_error');
    });

    socket.on('auth_error', (error) => {
      console.log(`🚫 Auth error: ${error.message}`);
      result.error = `Auth: ${error.message}`;
      result.events.push('auth_error');
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Disconnected: ${reason}`);
      result.events.push('disconnect');
    });

    // Test timeout
    setTimeout(() => {
      if (result.connected) {
        console.log(`✅ ${method.name}: SUCCESS`);
        
        // Test sending a message
        socket.emit('test_message', { content: 'Hello from test script!' });
        
        setTimeout(() => {
          socket.disconnect();
          resolve(result);
        }, 1000);
      } else {
        console.log(`❌ ${method.name}: FAILED - ${result.error || 'Timeout'}`);
        socket.disconnect();
        resolve(result);
      }
    }, 3000);
  });
}

async function runTests() {
  console.log('\n🚀 Starting Socket.IO connection tests...\n');
  
  const results = [];
  
  for (const method of testMethods) {
    const result = await testConnection(method);
    results.push(result);
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('=======================');
  
  results.forEach(result => {
    const status = result.connected ? '✅ SUCCESS' : '❌ FAILED';
    console.log(`${status} ${result.method}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.socketId) {
      console.log(`   Socket ID: ${result.socketId}`);
    }
    console.log(`   Events: ${result.events.join(', ')}`);
  });
  
  const successCount = results.filter(r => r.connected).length;
  console.log(`\n📈 Success Rate: ${successCount}/${results.length} (${Math.round(successCount/results.length*100)}%)`);
  
  if (successCount === 0) {
    console.log('\n🚨 ALL TESTS FAILED - POSSIBLE ISSUES:');
    console.log('1. Server không chạy hoặc không accessible');
    console.log('2. JWT_SECRET không đúng');
    console.log('3. CORS configuration chặn connection');
    console.log('4. Socket.IO authentication middleware có lỗi');
    console.log('5. Firewall hoặc network issues');
  } else if (successCount < results.length) {
    console.log('\n⚠️ MỘT SỐ PHƯƠNG THỨC THẤT BẠI:');
    console.log('Có thể cần cải thiện authentication middleware để hỗ trợ nhiều phương thức hơn');
  } else {
    console.log('\n🎉 TẤT CẢ TESTS THÀNH CÔNG!');
    console.log('Socket.IO server hoạt động bình thường');
  }
  
  process.exit(0);
}

// Chạy tests
runTests().catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});