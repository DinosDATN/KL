-- Add type and data columns to notifications table
-- This allows for better categorization and additional metadata

USE lfysdb;

-- Add type column if it doesn't exist
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS type ENUM(
  'friend_request',
  'friend_accepted',
  'friend_declined',
  'room_invite',
  'room_created',
  'message',
  'system',
  'achievement',
  'contest',
  'new_enrollment',
  'payment_confirmed',
  'new_payment'
) NOT NULL DEFAULT 'system' AFTER user_id;

-- Add title column if it doesn't exist
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT 'Thông báo' AFTER type;

-- Add data column for storing additional JSON data
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS data JSON NULL COMMENT 'Additional data related to the notification' AFTER message;

-- Add index for better query performance
ALTER TABLE notifications 
ADD INDEX IF NOT EXISTS idx_user_is_read (user_id, is_read);

ALTER TABLE notifications 
ADD INDEX IF NOT EXISTS idx_created_at (created_at);

-- Update existing notifications to have a title
UPDATE notifications 
SET title = 'Thông báo hệ thống' 
WHERE title = 'Thông báo';

SELECT 'Notifications table updated successfully with new enrollment and payment notification types' AS status;
