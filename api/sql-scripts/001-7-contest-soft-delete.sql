USE lfysdb;

-- Add is_deleted and deleted_at columns to contests table
ALTER TABLE contests 
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE NOT NULL AFTER updated_at,
ADD COLUMN deleted_at DATETIME NULL AFTER is_deleted;

-- Add index for is_deleted for better query performance
CREATE INDEX idx_contests_is_deleted ON contests(is_deleted);








