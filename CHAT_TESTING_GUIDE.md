# Chat System Testing Guide

## Testing the Fixed Issues

### Prerequisites
1. **Backend Server**: Running on `http://localhost:3000`
2. **Frontend Server**: Running on `http://localhost:4200`
3. **Database**: MySQL database with chat tables properly seeded

### Issue 1: Member Count Display - Testing Steps

#### Expected Behavior:
- Chat rooms should show the correct number of members
- Online member counts should display accurately
- Member counts should update in real-time

#### Test Steps:
1. **Navigate to Forum/Chat**:
   ```
   Open: http://localhost:4200/forum
   ```

2. **Check Room Member Counts**:
   - Look at the chat sidebar
   - Each room should show actual member count (not "0 members")
   - Online members should show with green indicators
   - Example: "5 thành viên • 3 đang online"

3. **Verify Real-time Updates**:
   - Open multiple browser sessions with different users
   - Join/leave rooms
   - Member counts should update automatically

#### API Test:
```bash
# Test the getUserChatRooms API (requires authentication token)
curl -X GET http://localhost:3000/api/v1/chat/rooms \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected response should include:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "General Chat",
      "member_count": 5,
      "online_member_count": 3,
      "all_members": [...],
      ...
    }
  ]
}
```

### Issue 2: Chat Messaging - Testing Steps

#### Expected Behavior:
- Users can send and receive messages
- Messages display with correct sender information
- Real-time message delivery works
- Message history loads properly

#### Test Steps:
1. **Select a Chat Room**:
   - Click on a room in the sidebar
   - Room should load with proper member count in header

2. **Send Messages**:
   - Type a message in the input field
   - Press Enter or click Send
   - Message should appear immediately
   - Sender name should display correctly

3. **Verify Real-time Messaging**:
   - Open multiple browser sessions
   - Send messages from different accounts
   - Messages should appear in real-time for all users in the room

4. **Check Message History**:
   - Refresh the page
   - Previous messages should load correctly
   - Sender information should be preserved

#### Socket.IO Connection Test:
1. **Open Browser Developer Tools**
2. **Check Console Logs**:
   - Should see: `Connected to server`
   - Should see: `✅ User authenticated: [Username]`
   - Should see room joining confirmations

3. **Monitor Network Tab**:
   - WebSocket connection to `ws://localhost:3000/socket.io/`
   - Should show `101 Switching Protocols` status

#### Backend Logs Verification:
Monitor the backend console for:
```
💬 Message received from user [Username]: {...}
🚀 Broadcasting message to room_[ID]: [messageId]
✅ Message [messageId] sent successfully by [Username]
```

### Troubleshooting Common Issues

#### Issue: "0 members" Still Showing
**Possible Causes**:
1. Database not properly seeded with chat room members
2. API not returning member count data
3. Frontend not using the new member count fields

**Solutions**:
1. Check database: `SELECT * FROM chat_room_members;`
2. Test API endpoint directly
3. Clear browser cache and reload

#### Issue: Messages Not Sending
**Possible Causes**:
1. Socket.IO connection not established
2. User not authenticated
3. User not a member of the room
4. Database connection issues

**Solutions**:
1. Check browser console for WebSocket errors
2. Verify JWT token is valid
3. Ensure user is added to room via `chat_room_members` table
4. Check backend database connection

#### Issue: Real-time Updates Not Working
**Possible Causes**:
1. Socket.IO room joining not working
2. Message broadcasting issues
3. Frontend not listening to events properly

**Solutions**:
1. Check backend logs for room joining confirmations
2. Verify Socket.IO event listeners in frontend
3. Test with multiple browser sessions

### Database Verification Queries

```sql
-- Check room members
SELECT 
    cr.name as room_name,
    COUNT(crm.user_id) as member_count,
    COUNT(CASE WHEN u.is_online = 1 THEN 1 END) as online_count
FROM chat_rooms cr
LEFT JOIN chat_room_members crm ON cr.id = crm.room_id
LEFT JOIN Users u ON crm.user_id = u.id
GROUP BY cr.id, cr.name;

-- Check messages
SELECT 
    cr.name as room_name,
    u.name as sender,
    cm.content,
    cm.sent_at
FROM chat_messages cm
JOIN chat_rooms cr ON cm.room_id = cr.id
JOIN Users u ON cm.sender_id = u.id
ORDER BY cm.sent_at DESC
LIMIT 10;
```

### Success Criteria

✅ **Member Count Display Fixed**:
- [ ] Rooms show accurate member counts
- [ ] Online status displays correctly  
- [ ] Real-time updates work

✅ **Chat Messaging Working**:
- [ ] Messages can be sent and received
- [ ] Sender information displays correctly
- [ ] Real-time delivery works
- [ ] Message history loads properly

✅ **Socket.IO Functioning**:
- [ ] WebSocket connection established
- [ ] Room joining/leaving works
- [ ] Event broadcasting works
- [ ] Error handling works

### Performance Tests

#### Load Testing:
1. Create multiple rooms with different member counts
2. Send multiple messages simultaneously
3. Monitor response times and memory usage

#### Stress Testing:
1. Join/leave rooms rapidly
2. Send burst of messages
3. Test with maximum expected concurrent users

### Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest) 
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Testing

Test responsive design:
- [ ] Mobile chat interface
- [ ] Touch interactions
- [ ] Performance on mobile devices
