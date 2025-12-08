const axios = require('axios');

// Configure base URL and test user credentials
const BASE_URL = process.env.API_URL || 'http://localhost:3000/api/v1';
const TEST_USER = {
  email: 'user1@test.com',
  password: 'password123'
};

let userToken = '';

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null, token = userToken) => {
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
const testGetChatRooms = async () => {
  console.log('\n=== Testing Get Chat Rooms API ===');
  
  try {
    // Login user
    console.log('1. Logging in test user...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    userToken = loginResponse.data.data.token;
    console.log('✓ User logged in successfully');
    console.log('Token:', userToken.substring(0, 20) + '...');

    // Get user info
    const userInfo = await makeRequest('GET', '/users/me', null, userToken);
    console.log('User ID:', userInfo.data.id);
    console.log('User Name:', userInfo.data.name);

    // Test getting chat rooms
    console.log('\n2. Testing get chat rooms...');
    const roomsResponse = await makeRequest('GET', '/chat/rooms', null, userToken);
    console.log('✓ Chat rooms retrieved successfully');
    console.log('Number of rooms:', roomsResponse.data.length);
    
    if (roomsResponse.data.length > 0) {
      console.log('\nFirst room details:');
      const firstRoom = roomsResponse.data[0];
      console.log('- ID:', firstRoom.id);
      console.log('- Name:', firstRoom.name);
      console.log('- Type:', firstRoom.type);
      console.log('- Member count:', firstRoom.member_count);
      console.log('- Online members:', firstRoom.online_member_count);
      console.log('- Creator:', firstRoom.Creator?.name);
      console.log('- All members:', firstRoom.all_members?.length || 0);
    }

    // Test multiple times to simulate reload
    console.log('\n3. Testing multiple requests (simulating reload)...');
    for (let i = 1; i <= 3; i++) {
      console.log(`\nRequest ${i}:`);
      const response = await makeRequest('GET', '/chat/rooms', null, userToken);
      console.log(`✓ Received ${response.data.length} rooms`);
    }

    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  testGetChatRooms();
}

module.exports = { testGetChatRooms };
