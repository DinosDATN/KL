USE lfysdb;

-- Xóa unique constraint để cho phép nhiều bản ghi cho cùng một level
-- Tìm và xóa unique constraint/index trên (user_id, game_id, level_id)

-- Kiểm tra và xóa unique constraint nếu tồn tại
-- Tìm tên của unique index
SET @index_name = NULL;

SELECT INDEX_NAME INTO @index_name
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'lfysdb'
AND TABLE_NAME = 'user_game_process'
AND NON_UNIQUE = 0
AND INDEX_NAME != 'PRIMARY'
LIMIT 1;

-- Nếu tìm thấy unique index, xóa nó
SET @sql = IF(@index_name IS NOT NULL, 
    CONCAT('ALTER TABLE user_game_process DROP INDEX `', @index_name, '`'),
    'SELECT "No unique index found to remove" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Nếu vẫn còn lỗi, có thể thử các lệnh sau (uncomment nếu cần):
-- ALTER TABLE user_game_process DROP INDEX user_id;
-- ALTER TABLE user_game_process DROP INDEX user_id_2;
-- ALTER TABLE user_game_process DROP INDEX user_id_game_id_level_id;

