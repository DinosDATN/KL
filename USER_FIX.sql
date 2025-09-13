-- 🔧 USER AUTHENTICATION FIX
-- Run these queries in your MySQL database to fix the "User not found" issue

-- Step 1: Check existing users
SELECT id, name, email, is_active, created_at FROM Users ORDER BY id;

-- Step 2: Check what user ID is in your JWT token
-- (Run the browser console code first to get the user ID from token)

-- Step 3: If user doesn't exist, create a test user
-- Replace the values below with your actual data
INSERT INTO Users (
    name, 
    email, 
    password, 
    role, 
    is_active, 
    is_online,
    subscription_status,
    created_at, 
    updated_at
) VALUES (
    'Test User',                           -- Replace with your name
    'test@example.com',                    -- Replace with your email  
    '$2b$10$example.hash.here',            -- Temporary password hash
    'user',
    1,                                     -- is_active = true
    0,                                     -- is_online = false initially
    'free',
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE
    is_active = 1,
    updated_at = NOW();

-- Step 4: Get the new user ID
SELECT id, name, email FROM Users WHERE email = 'test@example.com';

-- Step 5: Add user to a chat room for testing
-- Replace USER_ID with the actual user ID from Step 4
INSERT INTO chat_room_members (room_id, user_id, is_admin, joined_at)
SELECT 
    cr.id,
    1,                    -- Replace 1 with actual user ID
    0,                    -- is_admin = false
    NOW()
FROM chat_rooms cr
WHERE cr.id = 1           -- Assuming room 1 exists
ON DUPLICATE KEY UPDATE joined_at = joined_at;

-- Step 6: Verify the fix
SELECT 
    u.id,
    u.name,
    u.email,
    cr.name as room_name,
    crm.is_admin
FROM Users u
JOIN chat_room_members crm ON u.id = crm.user_id  
JOIN chat_rooms cr ON crm.room_id = cr.id
WHERE u.id = 1;           -- Replace 1 with actual user ID
