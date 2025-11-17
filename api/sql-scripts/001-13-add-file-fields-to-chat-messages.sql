-- USE lfysdb;
-- -- Add file fields to chat_messages table
-- ALTER TABLE chat_messages
-- ADD COLUMN file_url VARCHAR(500) NULL AFTER type,
-- ADD COLUMN file_name VARCHAR(255) NULL AFTER file_url,
-- ADD COLUMN file_size BIGINT NULL AFTER file_name;

-- -- Add index for file_url for faster queries
-- CREATE INDEX idx_chat_messages_file_url ON chat_messages(file_url(255));

