#!/usr/bin/env node

/**
 * Script test realtime features trong development
 * Chạy script này để đảm bảo Socket.IO hoạt động trước khi deploy production
 */

const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');

console.log('🧪 TEST REALTIME FEATURES - DEVELOPMENT');
console.log('======================================\n');

// Cấu hình development
const DEV_SERVER_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const TEST_USER_ID = 1;

// Tạo test token
const testToken = jwt.sign(
  { 
    userId: TEST_USER_ID,
    name: 'Test User Dev',
    email: 'testdev@example.com'
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

console.log(`🌍 Testing server: ${DEV_SERVER_URL}`);
console.log(`🔑 Test token: ${testToken.substring(0, 30)}...`);

async function testDevelopmentSocket() {
  return new Promise((resolve) => {
    console.log('\n🔄 Connecting to development server...');
    
    const socket = io(DEV_SERVER_URL, {
      // Test multiple auth methods
      auth: { token: testToken },
      extraHeaders: { 'Authorization': `Bearer ${testToken}` },
      query: { token: testToken },
      
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true
    });

    let result = {
      connected: false,
      authenticated: false,
      socketId: null,
      events: [],
      errors: []
    };

    // Connection events
    socket.on('connect', () => {
      console.log(`✅ Connected! Socket ID: ${socket.id}`);
      result.connected = true;
      result.authenticated = true;
      result.socketId = socket.id;
      result.events.push('connect');
      
      // Test joining a room
      console.log('🚪 Testing room join...');
      socket.emit('join_room', 1);
      
      // Test sending a message
      setTimeout(() => {
        console.log('💬 Testing message send...');
        socket.emit('send_message', {
          roomId: 1,
          content: 'Test message from development script',
          type: 'text'
        });
      }, 1000);
    });

    socket.on('connect_error', (error) => {
      console.log(`❌ Connection error: ${error.message}`);
      result.errors.push(`Connection: ${error.message}`);
      result.events.push('connect_error');
    });

    socket.on('auth_error', (error) => {
      console.log(`🚫 Auth error: ${error.message}`);
      result.errors.push(`Auth: ${error.message}`);
      result.events.push('auth_error');
    });

    socket.on('joined_room', (data) => {
      console.log(`✅ Joined room: ${JSON.stringify(data)}`);
      result.events.push('joined_room');
    });

    socket.on('new_message', (message) => {
      console.log(`📨 Received message: ${message.content}`);
      result.events.push('new_message');
    });

    socket.on('error', (error) => {
      console.log(`⚠️ Socket error: ${error.message}`);
      result.errors.push(`Socket: ${error.message}`);
      result.events.push('error');
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Disconnected: ${reason}`);
      result.events.push('disconnect');
    });

    // Test timeout
    setTimeout(() => {
      console.log('\n📊 TEST RESULTS:');
      console.log('================');
      console.log(`Connected: ${result.connected ? '✅' : '❌'}`);
      console.log(`Authenticated: ${result.authenticated ? '✅' : '❌'}`);
      console.log(`Socket ID: ${result.socketId || 'N/A'}`);
      console.log(`Events: ${result.events.join(', ')}`);
      
      if (result.errors.length > 0) {
        console.log(`Errors: ${result.errors.join(', ')}`);
      }
      
      if (result.connected && result.authenticated) {
        console.log('\n🎉 SUCCESS: Development Socket.IO is working!');
        console.log('✅ Ready to deploy to production');
      } else {
        console.log('\n❌ FAILED: Fix development issues before deploying');
        console.log('\n🔧 Common fixes:');
        console.log('1. Make sure API server is running: npm run dev (in api folder)');
        console.log('2. Check JWT_SECRET in api/.env');
        console.log('3. Verify CORS settings in api/src/app.js');
        console.log('4. Check if port 3000 is available');
      }
      
      socket.disconnect();
      resolve(result);
    }, 5000);
  });
}

// Run test
testDevelopmentSocket().then(() => {
  console.log('\n✅ Development test completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});