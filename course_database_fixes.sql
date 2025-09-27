-- Complete database migration script for course-related fixes
-- Execute this script to fix the course modules and lessons loading issues

USE lfys_main;

-- 1. Add missing 'type' column to course_lessons table
-- This column is required by the CourseLesson model and frontend UI
ALTER TABLE course_lessons 
ADD COLUMN type ENUM('document', 'video', 'exercise', 'quiz') DEFAULT 'document' NOT NULL;

-- Add index for the type column for better query performance
CREATE INDEX idx_type ON course_lessons(type);

-- Update existing records to have a default type of 'document'
UPDATE course_lessons SET type = 'document' WHERE type IS NULL OR type = '';

-- 2. Fix course_reviews rating column type to match the model
-- Change from INT to FLOAT to allow decimal ratings
ALTER TABLE course_reviews 
MODIFY COLUMN rating FLOAT NOT NULL CHECK (rating >= 1 AND rating <= 5);

-- 3. Verify all tables exist and have correct structure
SELECT 'Checking course tables...' as status;

-- Check if all course-related tables exist
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'lfys_main' 
AND TABLE_NAME IN (
    'courses', 
    'course_categories', 
    'course_modules', 
    'course_lessons', 
    'course_enrollments', 
    'course_reviews',
    'instructor_qualifications'
)
ORDER BY TABLE_NAME;

-- 4. Show the updated structure of course_lessons table
SELECT 'Updated course_lessons structure:' as status;
DESCRIBE course_lessons;

-- 5. Show the updated structure of course_reviews table  
SELECT 'Updated course_reviews structure:' as status;
DESCRIBE course_reviews;

SELECT 'Migration completed successfully!' as status;
