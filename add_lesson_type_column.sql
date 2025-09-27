-- Add missing 'type' column to course_lessons table
USE lfys_main;

-- Add the type column with default value
ALTER TABLE course_lessons 
ADD COLUMN type ENUM('document', 'video', 'exercise', 'quiz') DEFAULT 'document' NOT NULL;

-- Add index for the type column for better query performance
CREATE INDEX idx_type ON course_lessons(type);

-- Update existing records to have a default type of 'document'
-- You can modify this based on your actual data needs
UPDATE course_lessons SET type = 'document' WHERE type IS NULL;

-- Verify the change
DESCRIBE course_lessons;
