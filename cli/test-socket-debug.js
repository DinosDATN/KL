// Test script to debug JWT token and Socket.IO message sending
// Run this script in the browser console

async function debugJWTAndSocket() {
  console.log('🔍 Starting JWT and Socket.IO debugging...\n');
  
  // 1. Check JWT token
  const token = localStorage.getItem('token');
  console.log('1. JWT Token check:');
  if (!token) {
    console.error('❌ No JWT token found in localStorage');
    return;
  }
  
  try {
    // Decode JWT token
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('✅ JWT Token decoded successfully:');
    console.log('   User ID:', payload.id);
    console.log('   Username:', payload.name);
    console.log('   Email:', payload.email);
    console.log('   Expires:', new Date(payload.exp * 1000).toLocaleString());
    console.log('   Current time:', new Date().toLocaleString());
    console.log('   Token valid:', payload.exp * 1000 > Date.now() ? '✅ Yes' : '❌ Expired');
  } catch (error) {
    console.error('❌ Failed to decode JWT token:', error);
    return;
  }
  
  console.log('\n2. Socket.IO Connection Test:');
  
  // 2. Test Socket.IO connection
  if (typeof io === 'undefined') {
    console.error('❌ Socket.IO not loaded');
    return;
  }
  
  console.log('🔌 Creating new Socket.IO connection...');
  const socket = io('http://localhost:3000', {
    auth: {
      token: token
    },
    transports: ['websocket', 'polling']
  });
  
  // Connection event handlers
  socket.on('connect', () => {
    console.log('✅ Socket connected! ID:', socket.id);
    
    // Test message sending
    console.log('\n3. Testing message sending...');
    const testMessage = {
      roomId: 1, // Use roomId instead of chatRoomId
      content: 'Test message from debug script - ' + new Date().toISOString(),
      type: 'text'
    };
    
    console.log('📤 Sending test message:', testMessage);
    socket.emit('send_message', testMessage);
  });
  
  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
    console.error('   Error details:', error);
  });
  
  socket.on('new_message', (message) => {
    console.log('✅ Received new_message event:', message);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });
  
  // Wait a bit for connection
  setTimeout(() => {
    console.log('\n4. Current connection status:');
    console.log('   Connected:', socket.connected);
    console.log('   Socket ID:', socket.id);
    
    if (socket.connected) {
      console.log('\n5. Testing join room...');
      socket.emit('join_room', 1);
      console.log('📤 Sent join_room event for room 1');
    }
  }, 2000);
  
  // Keep socket reference for manual testing
  window.debugSocket = socket;
  console.log('\n💡 Socket stored as window.debugSocket for manual testing');
  console.log('   Try: debugSocket.emit("send_message", {roomId: 1, content: "Manual test", type: "text"})');
}

// Auto-run the debug
debugJWTAndSocket();
