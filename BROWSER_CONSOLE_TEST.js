// 🔧 Browser Console Test for Chat Message Sending
// Run this script in your browser console while on http://localhost:4200/forum

console.log('🧪 Starting Chat Debug Test...');

// Test 1: Check Authentication
console.log('\n📋 Test 1: Authentication Check');
const token = localStorage.getItem('auth_token');
const userStr = localStorage.getItem('auth_user');
console.log('🔑 Token exists:', !!token);
console.log('👤 User data exists:', !!userStr);

if (userStr) {
    try {
        const user = JSON.parse(userStr);
        console.log('✅ User parsed:', user.name, '(ID:', user.id + ')');
    } catch (e) {
        console.error('❌ Failed to parse user data:', e);
    }
}

if (!token || !userStr) {
    console.error('❌ Missing authentication data. Please login first.');
}

// Test 2: Check if Angular app is loaded
console.log('\n📋 Test 2: Angular App Check');
const ngElements = document.querySelectorAll('[ng-version]');
console.log('✅ Angular elements found:', ngElements.length);

// Test 3: Check if we can access Angular services
console.log('\n📋 Test 3: Service Access Check');
try {
    // Try to get the forum component
    const forumComponent = document.querySelector('app-forum');
    console.log('✅ Forum component found:', !!forumComponent);
    
    // Check if we're on the forum page
    const currentUrl = window.location.href;
    console.log('🌍 Current URL:', currentUrl);
    console.log('📍 On forum page:', currentUrl.includes('/forum'));
} catch (e) {
    console.error('❌ Error accessing components:', e);
}

// Test 4: Check Socket.IO connection status
console.log('\n📋 Test 4: Socket.IO Connection');
// We'll need to wait for the page to load completely
setTimeout(() => {
    try {
        // Check if io is available globally
        if (typeof io !== 'undefined') {
            console.log('✅ Socket.IO library loaded');
        } else {
            console.log('⚠️ Socket.IO library not found globally');
        }
        
        // Try to check connection status
        console.log('🔍 Checking for active socket connections...');
        
        // Look for socket connection indicators
        const socketScripts = document.querySelectorAll('script[src*="socket.io"]');
        console.log('📜 Socket.IO scripts found:', socketScripts.length);
        
    } catch (e) {
        console.error('❌ Error checking Socket.IO:', e);
    }
    
    console.log('\n📋 Test 5: Manual Message Send Test');
    console.log('🔧 To manually test message sending, try this:');
    console.log(`
// 1. First, make sure you're logged in and on the forum page
// 2. Open browser developer tools (F12)
// 3. Go to Network tab and look for WebSocket connections
// 4. Try sending a message through the UI
// 5. Check if you see any WebSocket traffic

// If you see WebSocket connection:
console.log('✅ WebSocket connected - Socket.IO should work');

// If you don't see WebSocket connection:
console.log('❌ No WebSocket - Socket.IO connection failed');
`);
    
    // Test 6: Check browser console for our debugging logs
    console.log('\n📋 Test 6: Look for Debug Logs');
    console.log('🔍 After logging in and navigating to /forum, you should see:');
    console.log('   🚀 Initializing chat system...');
    console.log('   📁 Connecting to Socket.IO server...');
    console.log('   Connected to server');
    console.log('   ✅ Loaded [N] chat rooms');
    
    console.log('\n📋 Test 7: Manual Socket Test');
    console.log('🧪 If authentication looks good, try this manual socket test:');
    console.log(`
// Replace YOUR_TOKEN with your actual token from localStorage
const testToken = localStorage.getItem('auth_token');
const testSocket = io('http://localhost:3000', {
    auth: { token: testToken },
    transports: ['websocket', 'polling']
});

testSocket.on('connect', () => {
    console.log('✅ Manual socket connected!');
    
    // Test joining a room (replace 1 with actual room ID)
    testSocket.emit('join_room', 1);
    
    // Test sending a message (replace 1 with actual room ID)
    testSocket.emit('send_message', {
        roomId: 1,
        content: 'Test message from console',
        type: 'text'
    });
});

testSocket.on('connect_error', (error) => {
    console.error('❌ Manual socket connection error:', error);
});

testSocket.on('new_message', (message) => {
    console.log('📨 Received message:', message);
});
`);
    
}, 2000);

console.log('\n🎯 Debug Test Instructions:');
console.log('1. Make sure you are logged in to the application');
console.log('2. Navigate to http://localhost:4200/forum');
console.log('3. Open Developer Tools (F12) and go to Console tab');
console.log('4. Look for the debug logs mentioned above');
console.log('5. Try sending a message and watch for logs');
console.log('6. Check the Network tab for WebSocket connections');
console.log('7. If needed, run the manual socket test provided above');
