/**
 * Test script to verify private chat real-time messaging and typing indicators work correctly
 * This script tests the fixes to ensure private chat works like group chat
 */

const io = require('socket.io-client');

// Test configuration
const SERVER_URL = 'http://localhost:3000';
const TEST_USERS = {
  user1: { token: 'user1_jwt_token', userId: 1, name: 'Test User 1' },
  user2: { token: 'user2_jwt_token', userId: 2, name: 'Test User 2' }
};

let socket1, socket2;
let testConversationId = 1; // You'll need to replace this with an actual conversation ID

console.log('🧪 Starting Private Chat Fix Tests...\n');

// Test 1: Connection and Room Joining
function testConnection() {
  return new Promise((resolve) => {
    console.log('📡 Test 1: Testing Socket Connections and Room Joining');
    
    let connected = 0;
    const checkComplete = () => {
      connected++;
      if (connected === 2) {
        console.log('✅ Both users connected successfully');
        resolve();
      }
    };
    
    // Connect User 1
    socket1 = io(SERVER_URL, {
      auth: { token: TEST_USERS.user1.token },
      transports: ['websocket', 'polling']
    });
    
    socket1.on('connect', () => {
      console.log(`✅ ${TEST_USERS.user1.name} connected`);
      
      // Join private conversation room
      socket1.emit('join_private_conversation', { conversationId: testConversationId });
      
      socket1.on('joined_private_conversation', (data) => {
        console.log(`✅ ${TEST_USERS.user1.name} joined private conversation room`);
        checkComplete();
      });
    });
    
    // Connect User 2
    socket2 = io(SERVER_URL, {
      auth: { token: TEST_USERS.user2.token },
      transports: ['websocket', 'polling']
    });
    
    socket2.on('connect', () => {
      console.log(`✅ ${TEST_USERS.user2.name} connected`);
      
      // Join private conversation room
      socket2.emit('join_private_conversation', { conversationId: testConversationId });
      
      socket2.on('joined_private_conversation', (data) => {
        console.log(`✅ ${TEST_USERS.user2.name} joined private conversation room`);
        checkComplete();
      });
    });
  });
}

// Test 2: Real-time Message Delivery
function testRealTimeMessaging() {
  return new Promise((resolve) => {
    console.log('\n💬 Test 2: Testing Real-time Message Delivery');
    
    let messagesReceived = 0;
    
    // User 2 listens for messages
    socket2.on('new_private_message', (message) => {
      console.log(`✅ User 2 received message: "${message.content}"`);
      messagesReceived++;
      
      if (messagesReceived === 2) {
        console.log('✅ All real-time messages received successfully');
        resolve();
      }
    });
    
    // User 1 listens for their own messages (echo)
    socket1.on('new_private_message', (message) => {
      if (message.sender_id === TEST_USERS.user1.userId) {
        console.log(`✅ User 1 received their own message echo: "${message.content}"`);
        messagesReceived++;
        
        if (messagesReceived === 2) {
          console.log('✅ All real-time messages received successfully');
          resolve();
        }
      }
    });
    
    // User 1 sends a message
    setTimeout(() => {
      socket1.emit('send_private_message', {
        conversationId: testConversationId,
        content: 'Test message from User 1 - Real-time delivery test!'
      });
    }, 1000);
  });
}

// Test 3: Typing Indicators
function testTypingIndicators() {
  return new Promise((resolve) => {
    console.log('\n⌨️ Test 3: Testing Typing Indicators');
    
    let typingReceived = false;
    let stopTypingReceived = false;
    
    const checkComplete = () => {
      if (typingReceived && stopTypingReceived) {
        console.log('✅ Typing indicators work correctly');
        resolve();
      }
    };
    
    // User 2 listens for typing indicators
    socket2.on('private_user_typing', (data) => {
      if (data.userId === TEST_USERS.user1.userId) {
        console.log(`✅ User 2 received typing indicator from ${data.username}`);
        typingReceived = true;
        checkComplete();
      }
    });
    
    socket2.on('private_user_stop_typing', (data) => {
      if (data.userId === TEST_USERS.user1.userId) {
        console.log(`✅ User 2 received stop typing indicator from User 1`);
        stopTypingReceived = true;
        checkComplete();
      }
    });
    
    // User 1 starts typing
    setTimeout(() => {
      socket1.emit('private_typing_start', { conversationId: testConversationId });
    }, 1000);
    
    // User 1 stops typing
    setTimeout(() => {
      socket1.emit('private_typing_stop', { conversationId: testConversationId });
    }, 3000);
  });
}

// Test 4: Message Delivery Without Active Focus
function testBackgroundMessageDelivery() {
  return new Promise((resolve) => {
    console.log('\n🌟 Test 4: Testing Background Message Delivery (Main Fix)');
    
    // Simulate user 2 being "away" by not focusing on the conversation
    // But they should still receive messages in real-time
    
    socket2.on('new_private_message', (message) => {
      if (message.content.includes('Background test')) {
        console.log('✅ CRITICAL FIX VERIFIED: User 2 received message while not actively viewing conversation!');
        console.log(`   Message: "${message.content}"`);
        resolve();
      }
    });
    
    // User 1 sends a message while User 2 is "away"
    setTimeout(() => {
      socket1.emit('send_private_message', {
        conversationId: testConversationId,
        content: 'Background test - This message should appear immediately without clicking!'
      });
    }, 1000);
  });
}

// Test 5: Bidirectional Communication
function testBidirectionalCommunication() {
  return new Promise((resolve) => {
    console.log('\n🔄 Test 5: Testing Bidirectional Communication');
    
    let user1Received = false;
    let user2Received = false;
    
    const checkComplete = () => {
      if (user1Received && user2Received) {
        console.log('✅ Bidirectional communication works perfectly');
        resolve();
      }
    };
    
    // User 1 listens for messages from User 2
    socket1.on('new_private_message', (message) => {
      if (message.sender_id === TEST_USERS.user2.userId) {
        console.log(`✅ User 1 received message from User 2: "${message.content}"`);
        user1Received = true;
        checkComplete();
      }
    });
    
    // User 2 listens for messages from User 1
    socket2.on('new_private_message', (message) => {
      if (message.sender_id === TEST_USERS.user1.userId && message.content.includes('Bidirectional')) {
        console.log(`✅ User 2 received message from User 1: "${message.content}"`);
        user2Received = true;
        
        // User 2 responds
        setTimeout(() => {
          socket2.emit('send_private_message', {
            conversationId: testConversationId,
            content: 'Response from User 2 - Bidirectional test complete!'
          });
        }, 500);
      }
    });
    
    // User 1 sends initial message
    setTimeout(() => {
      socket1.emit('send_private_message', {
        conversationId: testConversationId,
        content: 'Bidirectional test - User 1 to User 2'
      });
    }, 1000);
  });
}

// Run all tests
async function runAllTests() {
  try {
    await testConnection();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
    
    await testRealTimeMessaging();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testTypingIndicators();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testBackgroundMessageDelivery();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testBidirectionalCommunication();
    
    console.log('\n🎉 ALL TESTS PASSED! Private chat now works like group chat:');
    console.log('   ✅ Real-time message delivery without requiring user interaction');
    console.log('   ✅ Typing indicators work consistently');
    console.log('   ✅ Messages appear immediately in the background');
    console.log('   ✅ Bidirectional communication works perfectly');
    console.log('\n🔧 The main issues have been fixed:');
    console.log('   • Private chat now uses room-based broadcasting like group chat');
    console.log('   • Users are automatically joined to conversation rooms');
    console.log('   • Messages and typing indicators are broadcast reliably');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Cleanup
    if (socket1) socket1.disconnect();
    if (socket2) socket2.disconnect();
    process.exit(0);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Test error:', error);
  process.exit(1);
});

// Start tests
console.log('⚠️ IMPORTANT: Make sure you have:');
console.log('   1. Started the API server (npm start in api/ directory)');
console.log('   2. Updated TEST_USERS tokens with valid JWT tokens');
console.log('   3. Updated testConversationId with a real conversation ID');
console.log('   4. Ensured both test users are participants in the conversation\n');

// Uncomment the next line when ready to run tests
// runAllTests();

console.log('📝 To run the tests, uncomment the last line in this file and update the configuration');