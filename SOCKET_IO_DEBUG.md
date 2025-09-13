# Socket.IO Message Sending Debug Guide

## Current Issue
- ✅ Group creation and member display working fine
- ✅ Messages from database are displayed correctly  
- ❌ Adding new messages is not working

## Debugging Steps Added

### 1. Backend Debugging
Added comprehensive logging to `api/src/socket/chatHandler.js`:
- 🔐 Authentication process logging
- 🔗 Connection establishment logging  
- 📊 Active users tracking
- 💬 Message sending process logging
- 🚀 Message broadcasting confirmation

### 2. Frontend Debugging
Added detailed logging to Socket.IO service and components:
- 📁 Connection attempt logging
- 🔑 Token verification logging
- 💬 Message sending attempt logging
- 📨 Message receiving logging

## Testing Instructions

### 1. Open Browser Developer Console
1. Navigate to http://localhost:4200/forum
2. Open Developer Tools (F12)
3. Go to Console tab

### 2. Monitor Backend Logs
In the API terminal window, watch for:
```
🔐 Authenticating socket connection...
🔍 Verifying JWT token...  
✅ Token decoded successfully for user ID: [ID]
✅ Socket authentication successful for user: [Name]
🔗 User [Name] (ID: [ID]) connected (Socket ID: [SocketID])
```

### 3. Monitor Frontend Logs  
In browser console, look for:
```
📁 Connecting to Socket.IO server...
👤 User: [Name]
🔑 Token provided: true
🌍 Server URL: http://localhost:3000
Connected to server
```

### 4. Test Message Sending
1. Select a chat room
2. Type a message and press Enter
3. Watch console for:

**Frontend Console:**
```
📬 Forum: onSendMessage called
📩 Content: [Your message]
📍 Selected room: [Room name]  
👤 Current user: [User name]
🗣️ ChatService: Sending message...
🏠 Room ID: [Room ID]
💬 Content: [Content]
💬 Attempting to send message...
📋 Room ID: [Room ID]
💬 Content: [Content]
🔗 Socket connected: true
🚀 Emitting send_message event...
✅ Message sent via Socket.IO
```

**Backend Console:**
```
💬 Message received from user [Name]: {roomId: X, content: "...", type: "text"}
🚀 Broadcasting message to room_X: [Message ID]
✅ Message [Message ID] sent successfully by [Name]
```

**Expected Frontend Response:**
```
📨 Received new message via Socket.IO: {id: X, content: "...", ...}
```

## Common Issues to Check

### Issue 1: Socket Not Connecting
**Symptoms:** No connection logs in console
**Check:**
- Backend server running on port 3000
- No CORS issues
- JWT token available in localStorage/sessionStorage

### Issue 2: Authentication Failing  
**Symptoms:** Connection error or authentication error
**Check:**
```
❌ No token provided in socket handshake
❌ User not found in database: [ID]
```
**Solutions:**
- Verify user is logged in
- Check JWT token validity
- Ensure user exists in database

### Issue 3: User Not Room Member
**Symptoms:** 
```
❌ User [Name] not member of room [ID]
```
**Solution:**
- Check `chat_room_members` table
- Verify user was properly added to room

### Issue 4: Database Issues
**Symptoms:** Error during message creation
**Check:**
- Database connection
- Table structure
- Foreign key constraints

## Manual Testing Commands

### 1. Check Database Connection
```sql
SELECT * FROM chat_rooms LIMIT 5;
SELECT * FROM chat_room_members LIMIT 5;
SELECT * FROM chat_messages ORDER BY sent_at DESC LIMIT 5;
```

### 2. Check User Room Membership
```sql
SELECT cr.name, u.name as user_name, crm.is_admin
FROM chat_rooms cr
JOIN chat_room_members crm ON cr.id = crm.room_id  
JOIN Users u ON crm.user_id = u.id
WHERE u.id = [YOUR_USER_ID];
```

### 3. Test API Endpoints
```bash
# Get user rooms (replace TOKEN)
curl -H "Authorization: Bearer [YOUR_JWT_TOKEN]" \
  http://localhost:3000/api/v1/chat/rooms

# Get room messages  
curl -H "Authorization: Bearer [YOUR_JWT_TOKEN]" \
  http://localhost:3000/api/v1/chat/rooms/[ROOM_ID]/messages
```

## Expected Flow

1. **User Authentication** ✅
   - User logs in and gets JWT token
   - Token stored in auth service

2. **Socket.IO Connection** 🔍
   - Chat service initializes with token
   - Socket connects with auth token
   - Backend authenticates and stores connection

3. **Room Joining** 🔍  
   - User selects room from sidebar
   - Socket joins room via `join_room` event
   - Backend verifies membership and joins socket to room

4. **Message Sending** ❌
   - User types and sends message
   - Frontend emits `send_message` event
   - Backend receives, validates, saves to DB
   - Backend broadcasts to room members
   - Frontend receives and displays message

## Next Steps Based on Logs

After running the test:

### If No Socket Connection:
- Check authentication token
- Verify backend server status
- Check CORS configuration

### If Connection But No Message Sending:
- Verify room membership in database
- Check message validation
- Test Socket.IO events manually

### If Messages Not Displaying:
- Check new message listener
- Verify message structure
- Check Angular change detection

## Troubleshooting Commands

```bash
# Restart backend with logs
cd E:\A_ProjectKLTN\Project\main\api
npm start

# Restart frontend  
cd E:\A_ProjectKLTN\Project\main\cli
npm start

# Check running processes
Get-Process -Name "node"
```
