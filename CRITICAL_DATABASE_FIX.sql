-- CRITICAL DATABASE FIX for Course Loading Issues
-- Execute this SQL script in your MySQL database to fix all course-related problems

USE lfys_main;

-- Check current table structure
SELECT 'Before migration - checking course_lessons structure:' as status;
DESCRIBE course_lessons;

-- 1. Add missing 'type' column to course_lessons table
-- This is the PRIMARY cause of the course loading failures
SELECT 'Adding type column to course_lessons...' as status;

ALTER TABLE course_lessons 
ADD COLUMN type ENUM('document', 'video', 'exercise', 'quiz') DEFAULT 'document' NOT NULL;

-- Add index for performance
CREATE INDEX idx_lesson_type ON course_lessons(type);

-- Set default type for existing lessons
UPDATE course_lessons SET type = 'document' WHERE type IS NULL OR type = '';

-- 2. Fix course_reviews rating column to match model expectations
SELECT 'Fixing course_reviews rating column...' as status;

ALTER TABLE course_reviews 
MODIFY COLUMN rating FLOAT NOT NULL CHECK (rating >= 1 AND rating <= 5);

-- 3. Verify all required tables exist
SELECT 'Verifying course tables exist...' as status;

SELECT 
    TABLE_NAME,
    TABLE_ROWS as 'Row Count',
    CREATE_TIME as 'Created'
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

-- 4. Check final table structures
SELECT 'Final course_lessons structure:' as status;
DESCRIBE course_lessons;

SELECT 'Final course_reviews structure:' as status;
DESCRIBE course_reviews;

-- 5. Test query to ensure everything works
SELECT 'Testing course data retrieval...' as status;

SELECT 
    c.id as course_id,
    c.title,
    cm.id as module_id,
    cm.title as module_title,
    cl.id as lesson_id,
    cl.title as lesson_title,
    cl.type as lesson_type
FROM courses c
LEFT JOIN course_modules cm ON c.id = cm.course_id
LEFT JOIN course_lessons cl ON cm.id = cl.module_id
WHERE c.id IN (16, 25)
ORDER BY c.id, cm.position, cl.position
LIMIT 10;

SELECT 'MIGRATION COMPLETED SUCCESSFULLY!' as status;
SELECT 'You can now access course details without errors.' as message;
