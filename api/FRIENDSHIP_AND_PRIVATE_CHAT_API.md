# Friendship and Private Chat API Documentation

This document describes the new Friendship and Private Chat features added to the LFYS platform API.

## Table of Contents
1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Friendship API](#friendship-api)
4. [Private Chat API](#private-chat-api)
5. [Error Handling](#error-handling)
6. [Examples](#examples)

## Overview

The Friendship and Private Chat features enable users to:
- Send and manage friend requests
- Maintain a friends list
- Block/unblock users
- Have private 1-on-1 conversations
- Track message read status
- Archive conversations

### Key Features
- **Friendship Management**: Send, accept, decline friend requests
- **User Blocking**: Block unwanted users from sending messages or friend requests
- **Private Messaging**: Secure 1-on-1 conversations between friends
- **Message Status Tracking**: Track sent, delivered, and read status
- **Message Management**: Edit and delete messages
- **Conversation Archiving**: Archive/restore conversations

## Database Schema

### New Tables Added

#### 1. `friendships`
Manages friendship relationships and friend requests.

```sql
CREATE TABLE friendships (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    requester_id BIGINT NOT NULL,
    addressee_id BIGINT NOT NULL,
    status ENUM('pending', 'accepted', 'declined', 'blocked') DEFAULT 'pending',
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    responded_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2. `user_blocks`
Manages blocked user relationships.

```sql
CREATE TABLE user_blocks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    blocker_id BIGINT NOT NULL,
    blocked_id BIGINT NOT NULL,
    reason TEXT NULL,
    blocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP
);
```

#### 3. `private_conversations`
Manages private 1-on-1 conversations.

```sql
CREATE TABLE private_conversations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    participant1_id BIGINT NOT NULL,
    participant2_id BIGINT NOT NULL,
    last_message_id BIGINT NULL,
    last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP
);
```

#### 4. `private_messages`
Stores private messages.

```sql
CREATE TABLE private_messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    conversation_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    message_type ENUM('text', 'image', 'file', 'voice', 'video') DEFAULT 'text',
    file_url VARCHAR(500) NULL,
    file_name VARCHAR(255) NULL,
    file_size INT NULL,
    reply_to_message_id BIGINT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at DATETIME NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at DATETIME NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP
);
```

#### 5. `private_message_status`
Tracks message read/delivery status.

```sql
CREATE TABLE private_message_status (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    message_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
    status_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP
);
```

## Friendship API

Base URL: `/api/v1/friendship`

All endpoints require authentication via Bearer token.

### Send Friend Request
```
POST /requests
```

**Request Body:**
```json
{
  "addressee_id": 123
}
```

**Response:**
```json
{
  "success": true,
  "message": "Friend request sent successfully",
  "data": {
    "id": 456,
    "requester_id": 789,
    "addressee_id": 123,
    "status": "pending",
    "requested_at": "2024-01-01T12:00:00Z",
    "Requester": {
      "id": 789,
      "name": "John Doe",
      "email": "john@example.com",
      "avatar_url": "https://example.com/avatar.jpg"
    },
    "Addressee": {
      "id": 123,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "avatar_url": "https://example.com/avatar2.jpg"
    }
  }
}
```

### Respond to Friend Request
```
PUT /requests/:friendshipId/respond
```

**Request Body:**
```json
{
  "action": "accept" // or "decline"
}
```

### Get Friends List
```
GET /friends?page=1&limit=20&search=john
```

**Response:**
```json
{
  "success": true,
  "data": {
    "friends": [
      {
        "friendship_id": 456,
        "friend": {
          "id": 123,
          "name": "Jane Smith",
          "email": "jane@example.com",
          "avatar_url": "https://example.com/avatar.jpg",
          "is_online": true,
          "last_seen_at": "2024-01-01T12:00:00Z"
        },
        "friendship_date": "2024-01-01T10:00:00Z",
        "is_online": true,
        "last_seen_at": "2024-01-01T12:00:00Z"
      }
    ],
    "totalCount": 1,
    "currentPage": 1,
    "totalPages": 1
  }
}
```

### Get Pending Friend Requests
```
GET /requests/pending?page=1&limit=20
```

### Get Sent Friend Requests
```
GET /requests/sent?page=1&limit=20
```

### Remove Friend
```
DELETE /friends/:friendId
```

### Check Friendship Status
```
GET /status/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "accepted",
    "isRequester": true,
    "requestedAt": "2024-01-01T10:00:00Z",
    "respondedAt": "2024-01-01T10:30:00Z"
  }
}
```

### Block User
```
POST /block/:userId
```

**Request Body:**
```json
{
  "reason": "Spam or inappropriate behavior"
}
```

### Unblock User
```
DELETE /block/:userId
```

### Get Blocked Users
```
GET /blocked?page=1&limit=20
```

## Private Chat API

Base URL: `/api/v1/private-chat`

All endpoints require authentication and users must be friends to start conversations.

### Get User Conversations
```
GET /conversations?page=1&limit=20&includeArchived=false
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": 789,
        "other_participant": {
          "id": 123,
          "name": "Jane Smith",
          "email": "jane@example.com",
          "avatar_url": "https://example.com/avatar.jpg",
          "is_online": true,
          "last_seen_at": "2024-01-01T12:00:00Z"
        },
        "last_message": {
          "id": 999,
          "content": "Hello there!",
          "sent_at": "2024-01-01T11:30:00Z",
          "Sender": {
            "id": 123,
            "name": "Jane Smith"
          }
        },
        "last_activity_at": "2024-01-01T11:30:00Z",
        "is_active": true,
        "unread_count": 2
      }
    ],
    "totalCount": 1,
    "currentPage": 1,
    "totalPages": 1
  }
}
```

### Create or Get Conversation
```
POST /conversations/with/:otherUserId
```

**Response:**
```json
{
  "success": true,
  "message": "Conversation created successfully",
  "data": {
    "id": 789,
    "other_participant": {
      "id": 123,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "avatar_url": "https://example.com/avatar.jpg",
      "is_online": true,
      "last_seen_at": "2024-01-01T12:00:00Z"
    },
    "last_activity_at": "2024-01-01T12:00:00Z",
    "is_active": true,
    "created": true
  }
}
```

### Get Conversation Messages
```
GET /conversations/:conversationId/messages?page=1&limit=50&includeDeleted=false
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": 999,
        "conversation_id": 789,
        "sender_id": 456,
        "receiver_id": 123,
        "content": "Hello! How are you?",
        "message_type": "text",
        "file_url": null,
        "file_name": null,
        "file_size": null,
        "reply_to_message_id": null,
        "is_edited": false,
        "edited_at": null,
        "is_deleted": false,
        "deleted_at": null,
        "sent_at": "2024-01-01T11:30:00Z",
        "read_status": "read",
        "Sender": {
          "id": 456,
          "name": "John Doe",
          "email": "john@example.com",
          "avatar_url": "https://example.com/avatar.jpg"
        },
        "ReplyToMessage": null
      }
    ],
    "totalCount": 1,
    "currentPage": 1,
    "totalPages": 1
  }
}
```

### Send Private Message
```
POST /conversations/:conversationId/messages
```

**Request Body:**
```json
{
  "content": "Hello! This is my message.",
  "message_type": "text",
  "file_url": null,
  "file_name": null,
  "file_size": null,
  "reply_to_message_id": null
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": 1001,
    "conversation_id": 789,
    "sender_id": 456,
    "receiver_id": 123,
    "content": "Hello! This is my message.",
    "message_type": "text",
    "sent_at": "2024-01-01T12:00:00Z",
    "Sender": {
      "id": 456,
      "name": "John Doe",
      "email": "john@example.com",
      "avatar_url": "https://example.com/avatar.jpg"
    }
  }
}
```

### Mark Messages as Read
```
PUT /conversations/:conversationId/messages/read
```

**Request Body:**
```json
{
  "messageIds": [999, 1001, 1002]
}
```

### Edit Message
```
PUT /messages/:messageId/edit
```

**Request Body:**
```json
{
  "content": "Hello! This is my edited message."
}
```

### Delete Message
```
DELETE /messages/:messageId
```

### Get Unread Count
```
GET /unread-count?conversationId=789
```

**Response:**
```json
{
  "success": true,
  "data": {
    "unread_count": 5,
    "conversation_id": 789
  }
}
```

### Archive/Restore Conversation
```
PUT /conversations/:conversationId/archive
```

## Error Handling

All APIs use consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Optional validation errors
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created successfully
- `400` - Bad request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (access denied, blocked user, etc.)
- `404` - Not found
- `500` - Internal server error

## Examples

### Complete Friend Request Flow

1. **Send friend request:**
```bash
curl -X POST http://localhost:3000/api/v1/friendship/requests \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"addressee_id": 123}'
```

2. **Accept friend request (as addressee):**
```bash
curl -X PUT http://localhost:3000/api/v1/friendship/requests/456/respond \
  -H "Authorization: Bearer ADDRESSEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "accept"}'
```

3. **Start private conversation:**
```bash
curl -X POST http://localhost:3000/api/v1/private-chat/conversations/with/123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

4. **Send private message:**
```bash
curl -X POST http://localhost:3000/api/v1/private-chat/conversations/789/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello friend!", "message_type": "text"}'
```

### Message Types Supported

- `text` - Plain text messages
- `image` - Image files with file_url
- `file` - Document attachments with file_url, file_name, file_size
- `voice` - Voice recordings
- `video` - Video messages

### Security Features

1. **Authentication Required**: All endpoints require valid JWT token
2. **Friendship Requirement**: Private chats only between friends
3. **Blocking Protection**: Blocked users cannot send requests/messages
4. **Access Control**: Users can only access their own conversations
5. **Data Validation**: All inputs are validated and sanitized

### Performance Considerations

1. **Pagination**: All list endpoints support pagination
2. **Indexed Queries**: Database queries are optimized with proper indexes
3. **Soft Deletes**: Messages are soft-deleted for better performance
4. **Efficient Associations**: Sequelize associations minimize database queries

### Future Enhancements

Potential future features:
- Message reactions/emojis
- Typing indicators
- Voice/video calling
- File upload handling
- Message search
- Conversation themes/customization
- Group private chats
- Message encryption

## Installation and Setup

1. **Run Database Scripts:**
```bash
# Execute the SQL scripts in order:
mysql -u username -p database_name < sql-scripts/001-10-friendship-system.sql
mysql -u username -p database_name < sql-scripts/001-11-private-chat-system.sql
```

2. **Install Dependencies:**
```bash
npm install
```

3. **Start Server:**
```bash
npm run dev
```

4. **Test APIs:**
```bash
node test-friendship-chat.js
```

## Socket.IO Integration

The existing Socket.IO implementation can be extended to support real-time private messaging:

```javascript
// In socket/chatHandler.js - add private message handling
io.on('connection', (socket) => {
  // Join private conversation room
  socket.on('join_private_conversation', (conversationId) => {
    socket.join(`private_${conversationId}`);
  });
  
  // Handle private message
  socket.on('send_private_message', (data) => {
    // Emit to conversation room
    io.to(`private_${data.conversationId}`).emit('private_message', data);
  });
  
  // Handle typing indicators
  socket.on('typing_private', (data) => {
    socket.to(`private_${data.conversationId}`).emit('user_typing_private', data);
  });
});
```

This comprehensive implementation provides a solid foundation for friendship management and private messaging functionality in the LFYS platform.
