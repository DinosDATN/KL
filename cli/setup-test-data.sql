-- Setup test data for chat functionality
-- Run this in your MySQL database

-- Check existing users
SELECT 'Existing Users:' as info;
SELECT id, name, email, createdAt FROM Users ORDER BY id;

-- Check existing chat rooms
SELECT 'Existing Chat Rooms:' as info;  
SELECT id, name, description, createdAt FROM ChatRooms ORDER BY id;

-- Check existing user-room relationships
SELECT 'Existing UserChatRooms:' as info;
SELECT ucr.userId, u.name as userName, ucr.chatRoomId, cr.name as roomName 
FROM UserChatRooms ucr 
LEFT JOIN Users u ON ucr.userId = u.id 
LEFT JOIN ChatRooms cr ON ucr.chatRoomId = cr.id;

-- Create a test user if none exist (modify the ID to match your JWT token)
-- First, let's create a generic test user
INSERT IGNORE INTO Users (id, name, email, password, createdAt, updatedAt) 
VALUES 
(1, 'Test User', 'test@example.com', '$2b$10$placeholder.hash.for.testing', NOW(), NOW()),
(2, 'John Doe', 'john@example.com', '$2b$10$placeholder.hash.for.testing', NOW(), NOW());

-- Create a test chat room if none exist
INSERT IGNORE INTO ChatRooms (id, name, description, createdAt, updatedAt) 
VALUES 
(1, 'General Chat', 'Main chat room for testing', NOW(), NOW()),
(2, 'Test Room', 'Another test room', NOW(), NOW());

-- Add users to chat rooms
INSERT IGNORE INTO UserChatRooms (userId, chatRoomId, createdAt, updatedAt) 
VALUES 
(1, 1, NOW(), NOW()),
(1, 2, NOW(), NOW()),
(2, 1, NOW(), NOW());

-- Show final state
SELECT 'Final Setup - Users:' as info;
SELECT id, name, email FROM Users ORDER BY id;

SELECT 'Final Setup - Chat Rooms:' as info;
SELECT id, name, description FROM ChatRooms ORDER BY id;

SELECT 'Final Setup - User Room Assignments:' as info;
SELECT ucr.userId, u.name as userName, ucr.chatRoomId, cr.name as roomName 
FROM UserChatRooms ucr 
LEFT JOIN Users u ON ucr.userId = u.id 
LEFT JOIN ChatRooms cr ON ucr.chatRoomId = cr.id
ORDER BY ucr.userId, ucr.chatRoomId;
