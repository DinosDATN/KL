// Standalone Socket.IO Connection Test
// Run with: node test-socket-connection.js

const { io } = require('socket.io-client');

console.log('🔍 Socket.IO Connection Test Starting...\n');

// Test configuration
const SERVER_URL = 'http://localhost:3000';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwibmFtZSI6IlRlc3QgVXNlciIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzM3MDAzMjAwLCJleHAiOjE3Mzc2MDgwMDB9.test'; // You'll need to replace this with a real token

console.log('🌐 Server URL:', SERVER_URL);
console.log('🔑 Using test token (replace with real token from localStorage)');

// Create socket connection
const socket = io(SERVER_URL, {
  auth: {
    token: TEST_TOKEN
  },
  transports: ['websocket', 'polling']
});

// Connection handlers
socket.on('connect', () => {
  console.log('✅ Socket connected successfully!');
  console.log('📝 Socket ID:', socket.id);
  
  // Test joining a room
  console.log('\n🚪 Testing room join...');
  socket.emit('join_room', 1);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection failed:', error.message);
  console.error('🔍 Error details:', error);
  
  if (error.message.includes('Authentication')) {
    console.log('\n💡 Authentication failed. To fix:');
    console.log('1. Login to your application');  
    console.log('2. Get token from localStorage: localStorage.getItem("token")');
    console.log('3. Replace TEST_TOKEN in this script with the real token');
  }
});

socket.on('joined_room', (data) => {
  console.log('✅ Successfully joined room:', data);
  
  // Test sending a message
  console.log('\n💬 Testing message sending...');
  const testMessage = {
    roomId: 1,
    content: 'Test message from standalone script - ' + new Date().toISOString(),
    type: 'text'
  };
  
  console.log('📤 Sending message:', testMessage);
  socket.emit('send_message', testMessage);
});

socket.on('new_message', (message) => {
  console.log('✅ Received new message:', message);
  console.log('🎉 Socket.IO is working correctly!');
  
  // Clean up
  setTimeout(() => {
    console.log('\n🔌 Disconnecting...');
    socket.disconnect();
    process.exit(0);
  }, 1000);
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('\n⏰ Test timeout - check if API server is running');
  console.log('Start API server with: cd api && npm start');
  socket.disconnect();
  process.exit(1);
}, 10000);

console.log('⏳ Attempting to connect to Socket.IO server...');
console.log('📋 Make sure:');
console.log('  - API server is running on port 3000');
console.log('  - Database is connected');
console.log('  - JWT token is valid\n');
