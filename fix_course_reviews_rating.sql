-- Fix course_reviews rating column type to match the model
USE lfys_main;

-- Change rating column from INT to FLOAT to allow decimal ratings
ALTER TABLE course_reviews 
MODIFY COLUMN rating FLOAT NOT NULL CHECK (rating BETWEEN 1 AND 5);

-- Verify the change
DESCRIBE course_reviews;
