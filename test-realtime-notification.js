/**
 * Script test thông báo friend request realtime
 * 
 * Cách sử dụng:
 * 1. Đảm bảo backend đang chạy
 * 2. Đăng nhập 2 user khác nhau trên 2 trình duyệt
 * 3. Chạy script này trong console của User A (người gửi)
 * 4. Quan sát console của User B (người nhận) để xem thông báo realtime
 */

// ============================================
// CONFIGURATION
// ============================================
const API_URL = 'http://localhost:3000/api/v1';
const ADDRESSEE_ID = 2; // ID của user B (người nhận)

// ============================================
// TEST FUNCTIONS
// ============================================

/**
 * Test 1: Gửi friend request
 */
async function testSendFriendRequest() {
  console.log('🧪 TEST 1: Sending friend request...');
  console.log(`📤 Sending friend request to user ${ADDRESSEE_ID}`);
  
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('❌ No auth token found. Please login first.');
      return;
    }

    const response = await fetch(`${API_URL}/friendships/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        addressee_id: ADDRESSEE_ID
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Friend request sent successfully!');
      console.log('📊 Response:', data);
      console.log('\n👀 Now check User B\'s browser console for realtime notification!');
      console.log('Expected logs in User B console:');
      console.log('  📬 Friend request received notification: {...}');
      console.log('  📬 AppNotificationService: Friend request received {...}');
      console.log('  🔄 Reloading notifications and unread count...');
      console.log('  ✅ Updated unread count: X');
      console.log('  ✅ Reloaded X notifications');
    } else {
      console.error('❌ Failed to send friend request:', data.message);
    }
  } catch (error) {
    console.error('❌ Error sending friend request:', error);
  }
}

/**
 * Test 2: Kiểm tra socket connection
 */
function testSocketConnection() {
  console.log('🧪 TEST 2: Checking socket connection...');
  
  try {
    // Try to get socket service from Angular context
    const appRoot = document.querySelector('app-root');
    if (!appRoot || !appRoot.__ngContext__) {
      console.error('❌ Cannot access Angular context. Make sure you are on the app page.');
      return;
    }

    // Find socket service in context
    const context = appRoot.__ngContext__;
    let socketService = null;
    
    for (let i = 0; i < context.length; i++) {
      if (context[i] && context[i].socketService) {
        socketService = context[i].socketService;
        break;
      }
    }

    if (!socketService) {
      console.error('❌ Socket service not found in Angular context.');
      return;
    }

    console.log('✅ Socket service found!');
    console.log('🔌 Socket connected:', socketService.isConnected());
    console.log('👤 Current user:', socketService.getCurrentUser());
    
    if (socketService.isConnected()) {
      console.log('✅ Socket is connected and ready to receive notifications!');
    } else {
      console.error('❌ Socket is not connected. Please refresh the page.');
    }
  } catch (error) {
    console.error('❌ Error checking socket connection:', error);
  }
}

/**
 * Test 3: Kiểm tra notifications
 */
function testNotifications() {
  console.log('🧪 TEST 3: Checking notifications...');
  
  try {
    const appRoot = document.querySelector('app-root');
    if (!appRoot || !appRoot.__ngContext__) {
      console.error('❌ Cannot access Angular context.');
      return;
    }

    const context = appRoot.__ngContext__;
    let notificationService = null;
    
    for (let i = 0; i < context.length; i++) {
      if (context[i] && context[i].appNotificationService) {
        notificationService = context[i].appNotificationService;
        break;
      }
    }

    if (!notificationService) {
      console.error('❌ Notification service not found.');
      return;
    }

    console.log('✅ Notification service found!');
    console.log('📬 Notifications:', notificationService.getNotifications());
    console.log('📊 Unread count:', notificationService.getUnreadCount());
  } catch (error) {
    console.error('❌ Error checking notifications:', error);
  }
}

/**
 * Test 4: Load notifications manually
 */
async function testLoadNotifications() {
  console.log('🧪 TEST 4: Loading notifications manually...');
  
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('❌ No auth token found.');
      return;
    }

    const response = await fetch(`${API_URL}/notifications?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Notifications loaded successfully!');
      console.log('📊 Total notifications:', data.data.totalCount);
      console.log('📬 Notifications:', data.data.notifications);
    } else {
      console.error('❌ Failed to load notifications:', data.message);
    }
  } catch (error) {
    console.error('❌ Error loading notifications:', error);
  }
}

/**
 * Test 5: Check unread count
 */
async function testUnreadCount() {
  console.log('🧪 TEST 5: Checking unread count...');
  
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('❌ No auth token found.');
      return;
    }

    const response = await fetch(`${API_URL}/notifications/unread-count`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Unread count loaded successfully!');
      console.log('📊 Unread count:', data.data.count);
    } else {
      console.error('❌ Failed to load unread count:', data.message);
    }
  } catch (error) {
    console.error('❌ Error loading unread count:', error);
  }
}

// ============================================
// RUN ALL TESTS
// ============================================

async function runAllTests() {
  console.log('🚀 Starting all tests...\n');
  
  console.log('=' .repeat(50));
  testSocketConnection();
  
  console.log('\n' + '='.repeat(50));
  testNotifications();
  
  console.log('\n' + '='.repeat(50));
  await testUnreadCount();
  
  console.log('\n' + '='.repeat(50));
  await testLoadNotifications();
  
  console.log('\n' + '='.repeat(50));
  console.log('\n✅ All tests completed!');
  console.log('\n📝 To test friend request notification:');
  console.log('   1. Make sure User B is logged in on another browser');
  console.log('   2. Run: testSendFriendRequest()');
  console.log('   3. Check User B\'s console for realtime notification');
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

console.log('🧪 Realtime Notification Test Script Loaded!');
console.log('\nAvailable functions:');
console.log('  - runAllTests()           : Run all tests');
console.log('  - testSendFriendRequest() : Send friend request to user ' + ADDRESSEE_ID);
console.log('  - testSocketConnection()  : Check socket connection status');
console.log('  - testNotifications()     : Check current notifications');
console.log('  - testLoadNotifications() : Load notifications from API');
console.log('  - testUnreadCount()       : Check unread notification count');
console.log('\n💡 Quick start: runAllTests()');

// Make functions available globally
window.testSendFriendRequest = testSendFriendRequest;
window.testSocketConnection = testSocketConnection;
window.testNotifications = testNotifications;
window.testLoadNotifications = testLoadNotifications;
window.testUnreadCount = testUnreadCount;
window.runAllTests = runAllTests;
