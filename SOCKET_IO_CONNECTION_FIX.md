# Socket.IO Connection Error Fix Guide

## Issues Identified

### 1. **Missing Environment Variable**
- `CLIENT_URL` was missing from `.env` file
- **Fixed**: Added `CLIENT_URL=http://localhost:4200` to API `.env` file

### 2. **Inconsistent Message Structure in Debug Script**
- Debug script used `chatRoomId` but server expects `roomId`
- **Fixed**: Updated debug script to use correct property names

### 3. **Socket.IO Configuration Issues**
- Server and client configurations are mostly correct
- CORS is properly configured for localhost:4200

## Implementation Status

✅ **Server Configuration** (api/src/app.js)
- Socket.IO server properly initialized
- CORS configuration correct
- Authentication middleware in place

✅ **Client Configuration** (cli/src/app/core/services/socket.service.ts)  
- Socket.IO client properly configured
- Token-based authentication implemented
- Event listeners properly set up

✅ **Environment Configuration**
- Development environment properly set
- API URL configuration correct

## Fixes Applied

### 1. Fixed Environment Configuration
```bash
# Added to api/.env
CLIENT_URL=http://localhost:4200
```

### 2. Fixed Debug Script
```javascript
// Updated test message structure
const testMessage = {
  roomId: 1,        // Changed from chatRoomId
  content: 'Test message from debug script - ' + new Date().toISOString(),
  type: 'text'      // Added type field
};
```

## Testing Steps

### Step 1: Start Both Servers

**Terminal 1 - Start API Server:**
```powershell
cd "E:\A_ProjectKLTN\Project\main\api"
npm start
```

**Terminal 2 - Start Angular Client:**  
```powershell
cd "E:\A_ProjectKLTN\Project\main\cli"
npm start
```

### Step 2: Verify Server Status

**Check API Health:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/health"
```

**Check Angular Client:**
```powershell
Invoke-WebRequest -Uri "http://localhost:4200"
```

### Step 3: Test Socket.IO Connection

1. Open browser to `http://localhost:4200`
2. Open Developer Console (F12)
3. Run the debug script:

```javascript
// Copy and paste into browser console
eval((await fetch('/test-socket-debug.js')).text());
```

Or manually paste the debug script content.

### Step 4: Monitor Connection Logs

**Expected API Server Logs:**
```
🔐 Authenticating socket connection...
🔍 Verifying JWT token...
✅ Token decoded successfully for user ID: [ID]
✅ Socket authentication successful for user: [Name]
🔗 User [Name] (ID: [ID]) connected (Socket ID: [SocketID])
```

**Expected Browser Console Logs:**
```  
📁 Connecting to Socket.IO server...
👤 User: [Name]
🔑 Token provided: true
🌍 Server URL: http://localhost:3000
Connected to server
```

## Common Issues and Solutions

### Issue 1: "Authentication error"
**Cause:** Invalid or missing JWT token
**Solution:**
1. Ensure user is logged in
2. Check `localStorage.getItem('token')` in browser console
3. Verify token is not expired

### Issue 2: "User not found in database"
**Cause:** JWT token has user ID that doesn't exist in database
**Solution:**
1. Server creates temporary user (already implemented)
2. Check database user table
3. Re-login to get fresh token

### Issue 3: "Not a member of this room"  
**Cause:** User trying to join room they're not a member of
**Solution:**
1. Check `chat_room_members` table
2. Ensure test room exists with user as member
3. Create test room first

### Issue 4: Socket not connecting
**Cause:** Server not running or CORS issues
**Solution:**
1. Verify API server running on port 3000
2. Check CORS configuration
3. Check firewall/antivirus blocking connections

## Database Setup for Testing

Create test data:

```sql
-- Create test room if it doesn't exist
INSERT IGNORE INTO chat_rooms (id, name, description, type, is_public, created_by) 
VALUES (1, 'Test Room', 'Testing Socket.IO', 'group', 1, 1);

-- Add current user to test room
INSERT IGNORE INTO chat_room_members (room_id, user_id, is_admin) 
VALUES (1, 1, 1); -- Replace 1 with actual user ID
```

## Manual Testing Commands

```javascript
// In browser console after connection established:

// Test joining room
debugSocket.emit('join_room', 1);

// Test sending message
debugSocket.emit('send_message', {
  roomId: 1,
  content: 'Manual test message',
  type: 'text'
});

// Check connection status
console.log('Connected:', debugSocket.connected);
console.log('Socket ID:', debugSocket.id);
```

## Next Steps

1. **Start both servers** using separate terminals
2. **Test Socket.IO connection** using the debug script
3. **Monitor logs** for authentication and connection issues  
4. **Test message sending** functionality
5. **Verify real-time updates** in the chat interface

## Emergency Fallback

If Socket.IO continues to have issues:

1. **Check Node.js version compatibility**
2. **Verify Socket.IO versions match** (both using 4.8.1)
3. **Test with different browser** 
4. **Check Windows Firewall** settings
5. **Try different ports** if conflicts exist

The implementation is solid - most issues are likely environmental or configuration-related.
