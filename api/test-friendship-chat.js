const axios = require('axios');

// Configure base URL and test user credentials
const BASE_URL = process.env.API_URL || 'http://localhost:3000/api/v1';
const TEST_USER_1 = {
  email: 'user1@test.com',
  password: 'password123'
};
const TEST_USER_2 = {
  email: 'user2@test.com', 
  password: 'password123'
};

let user1Token = '';
let user2Token = '';
let friendshipId = '';
let conversationId = '';

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null, token = user1Token) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error in ${method} ${url}:`, error.response?.data || error.message);
    throw error;
  }
};

// Test functions
const testFriendshipAPIs = async () => {
  console.log('\n=== Testing Friendship APIs ===');
  
  try {
    // Login both users (assuming they exist)
    console.log('1. Logging in test users...');
    const loginUser1 = await axios.post(`${BASE_URL}/auth/login`, TEST_USER_1);
    user1Token = loginUser1.data.data.token;
    console.log('✓ User 1 logged in successfully');
    
    const loginUser2 = await axios.post(`${BASE_URL}/auth/login`, TEST_USER_2);
    user2Token = loginUser2.data.data.token;
    console.log('✓ User 2 logged in successfully');

    // Get user IDs
    const user1Info = await makeRequest('GET', '/users/me', null, user1Token);
    const user2Info = await makeRequest('GET', '/users/me', null, user2Token);
    
    const user1Id = user1Info.data.id;
    const user2Id = user2Info.data.id;
    
    console.log(`User 1 ID: ${user1Id}, User 2 ID: ${user2Id}`);

    // Test sending friend request
    console.log('\n2. Testing send friend request...');
    const friendRequest = await makeRequest('POST', '/friendship/requests', {
      addressee_id: user2Id
    }, user1Token);
    friendshipId = friendRequest.data.id;
    console.log('✓ Friend request sent successfully');
    console.log('Friendship ID:', friendshipId);

    // Test getting pending requests for user 2
    console.log('\n3. Testing get pending requests...');
    const pendingRequests = await makeRequest('GET', '/friendship/requests/pending', null, user2Token);
    console.log('✓ Pending requests retrieved:', pendingRequests.data.requests.length);

    // Test getting sent requests for user 1
    console.log('\n4. Testing get sent requests...');
    const sentRequests = await makeRequest('GET', '/friendship/requests/sent', null, user1Token);
    console.log('✓ Sent requests retrieved:', sentRequests.data.requests.length);

    // Test accepting friend request
    console.log('\n5. Testing accept friend request...');
    await makeRequest('PUT', `/friendship/requests/${friendshipId}/respond`, {
      action: 'accept'
    }, user2Token);
    console.log('✓ Friend request accepted successfully');

    // Test getting friends list
    console.log('\n6. Testing get friends list...');
    const friendsList = await makeRequest('GET', '/friendship/friends', null, user1Token);
    console.log('✓ Friends list retrieved:', friendsList.data.friends.length);

    // Test friendship status
    console.log('\n7. Testing friendship status...');
    const status = await makeRequest('GET', `/friendship/status/${user2Id}`, null, user1Token);
    console.log('✓ Friendship status:', status.data.status);

    console.log('\n✅ All Friendship API tests passed!');
    return { user1Id, user2Id };
    
  } catch (error) {
    console.error('❌ Friendship API test failed:', error.message);
    throw error;
  }
};

const testPrivateChatAPIs = async (user1Id, user2Id) => {
  console.log('\n=== Testing Private Chat APIs ===');
  
  try {
    // Test creating/getting conversation
    console.log('\n1. Testing get or create conversation...');
    const conversation = await makeRequest('POST', `/private-chat/conversations/with/${user2Id}`, {}, user1Token);
    conversationId = conversation.data.id;
    console.log('✓ Conversation created/retrieved successfully');
    console.log('Conversation ID:', conversationId);

    // Test getting conversations list
    console.log('\n2. Testing get user conversations...');
    const conversations = await makeRequest('GET', '/private-chat/conversations', null, user1Token);
    console.log('✓ Conversations list retrieved:', conversations.data.conversations.length);

    // Test sending private message
    console.log('\n3. Testing send private message...');
    const message1 = await makeRequest('POST', `/private-chat/conversations/${conversationId}/messages`, {
      content: 'Hello! This is a test message from user 1.',
      message_type: 'text'
    }, user1Token);
    console.log('✓ Message sent successfully');
    console.log('Message ID:', message1.data.id);

    // Test sending reply message
    console.log('\n4. Testing send reply message...');
    const message2 = await makeRequest('POST', `/private-chat/conversations/${conversationId}/messages`, {
      content: 'Hi there! This is a reply from user 2.',
      message_type: 'text'
    }, user2Token);
    console.log('✓ Reply message sent successfully');

    // Test getting conversation messages
    console.log('\n5. Testing get conversation messages...');
    const messages = await makeRequest('GET', `/private-chat/conversations/${conversationId}/messages`, null, user1Token);
    console.log('✓ Messages retrieved:', messages.data.messages.length);

    // Test marking messages as read
    console.log('\n6. Testing mark messages as read...');
    const messageIds = messages.data.messages.map(msg => msg.id);
    await makeRequest('PUT', `/private-chat/conversations/${conversationId}/messages/read`, {
      messageIds
    }, user2Token);
    console.log('✓ Messages marked as read successfully');

    // Test getting unread count
    console.log('\n7. Testing get unread count...');
    const unreadCount = await makeRequest('GET', '/private-chat/unread-count', null, user1Token);
    console.log('✓ Unread count retrieved:', unreadCount.data.unread_count);

    // Test editing message
    console.log('\n8. Testing edit message...');
    await makeRequest('PUT', `/private-chat/messages/${message1.data.id}/edit`, {
      content: 'Hello! This is an edited test message from user 1.'
    }, user1Token);
    console.log('✓ Message edited successfully');

    // Test archiving conversation
    console.log('\n9. Testing archive conversation...');
    await makeRequest('PUT', `/private-chat/conversations/${conversationId}/archive`, {}, user1Token);
    console.log('✓ Conversation archived successfully');

    console.log('\n✅ All Private Chat API tests passed!');
    
  } catch (error) {
    console.error('❌ Private Chat API test failed:', error.message);
    throw error;
  }
};

const testBlockingAPIs = async (user1Id, user2Id) => {
  console.log('\n=== Testing Blocking APIs ===');
  
  try {
    // Test blocking user
    console.log('\n1. Testing block user...');
    await makeRequest('POST', `/friendship/block/${user2Id}`, {
      reason: 'Test blocking functionality'
    }, user1Token);
    console.log('✓ User blocked successfully');

    // Test getting blocked users list
    console.log('\n2. Testing get blocked users...');
    const blockedUsers = await makeRequest('GET', '/friendship/blocked', null, user1Token);
    console.log('✓ Blocked users retrieved:', blockedUsers.data.blockedUsers.length);

    // Test trying to send message while blocked
    console.log('\n3. Testing send message while blocked (should fail)...');
    try {
      await makeRequest('POST', `/private-chat/conversations/${conversationId}/messages`, {
        content: 'This should fail due to blocking',
        message_type: 'text'
      }, user1Token);
      console.log('❌ Message sent when it should have failed');
    } catch (error) {
      console.log('✓ Message correctly blocked due to user blocking');
    }

    // Test unblocking user
    console.log('\n4. Testing unblock user...');
    await makeRequest('DELETE', `/friendship/block/${user2Id}`, null, user1Token);
    console.log('✓ User unblocked successfully');

    console.log('\n✅ All Blocking API tests passed!');
    
  } catch (error) {
    console.error('❌ Blocking API test failed:', error.message);
    throw error;
  }
};

// Main test runner
const runAllTests = async () => {
  try {
    console.log('🚀 Starting Friendship and Private Chat API Tests...');
    console.log('Make sure the API server is running and test users exist in the database.');
    
    // Test friendship functionality
    const { user1Id, user2Id } = await testFriendshipAPIs();
    
    // Test private chat functionality
    await testPrivateChatAPIs(user1Id, user2Id);
    
    // Test blocking functionality
    await testBlockingAPIs(user1Id, user2Id);
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\nAPI Endpoints Summary:');
    console.log('Friendship APIs:');
    console.log('  POST /friendship/requests - Send friend request');
    console.log('  PUT /friendship/requests/:id/respond - Accept/decline request');
    console.log('  GET /friendship/friends - Get friends list');
    console.log('  GET /friendship/requests/pending - Get pending requests');
    console.log('  GET /friendship/requests/sent - Get sent requests');
    console.log('  DELETE /friendship/friends/:id - Remove friend');
    console.log('  POST /friendship/block/:userId - Block user');
    console.log('  DELETE /friendship/block/:userId - Unblock user');
    console.log('  GET /friendship/blocked - Get blocked users');
    console.log('  GET /friendship/status/:userId - Check friendship status');
    
    console.log('\nPrivate Chat APIs:');
    console.log('  GET /private-chat/conversations - Get user conversations');
    console.log('  POST /private-chat/conversations/with/:userId - Create conversation');
    console.log('  GET /private-chat/conversations/:id/messages - Get messages');
    console.log('  POST /private-chat/conversations/:id/messages - Send message');
    console.log('  PUT /private-chat/conversations/:id/messages/read - Mark as read');
    console.log('  PUT /private-chat/messages/:id/edit - Edit message');
    console.log('  DELETE /private-chat/messages/:id - Delete message');
    console.log('  GET /private-chat/unread-count - Get unread count');
    console.log('  PUT /private-chat/conversations/:id/archive - Toggle archive');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };
