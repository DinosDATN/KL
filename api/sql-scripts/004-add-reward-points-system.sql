-- Migration: Add Reward Points System
-- Description: Thêm hệ thống điểm thưởng cho người dùng

USE lfysdb;

-- Thêm cột reward_points vào bảng user_stats
ALTER TABLE user_stats 
ADD COLUMN reward_points INT DEFAULT 0 NOT NULL CHECK (reward_points >= 0) ;

-- Tạo bảng reward_transactions để lưu lịch sử giao dịch điểm
CREATE TABLE reward_transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    points INT NOT NULL ,
    transaction_type ENUM(
        'problem_solved',      -- Giải bài tập
        'sudoku_completed',    -- Hoàn thành Sudoku
        'achievement_earned',  -- Đạt thành tích
        'daily_login',         -- Đăng nhập hàng ngày
        'course_completed',    -- Hoàn thành khóa học
        'manual_adjustment',   -- Điều chỉnh thủ công (admin)
        'purchase',            -- Mua vật phẩm/tính năng
        'bonus'                -- Thưởng đặc biệt
    ) NOT NULL,
    reference_type VARCHAR(50) ,
    reference_id BIGINT ,
    metadata JSON ,
    description TEXT ,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_created_at (created_at),
    INDEX idx_reference (reference_type, reference_id)
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Tạo bảng reward_config để cấu hình điểm thưởng
CREATE TABLE reward_config (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL ,
    config_value INT NOT NULL ,
    description TEXT ,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_config_key (config_key),
    INDEX idx_is_active (is_active)
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Thêm dữ liệu mặc định cho reward_config
INSERT INTO reward_config (config_key, config_value, description) VALUES
-- Điểm thưởng cho bài tập theo độ khó
('problem_easy', 10, 'Điểm thưởng khi giải bài tập Easy'),
('problem_medium', 25, 'Điểm thưởng khi giải bài tập Medium'),
('problem_hard', 50, 'Điểm thưởng khi giải bài tập Hard'),

-- Điểm thưởng cho Sudoku theo độ khó (base points)
('sudoku_easy_base', 15, 'Điểm cơ bản khi hoàn thành Sudoku Easy'),
('sudoku_medium_base', 30, 'Điểm cơ bản khi hoàn thành Sudoku Medium'),
('sudoku_hard_base', 60, 'Điểm cơ bản khi hoàn thành Sudoku Hard'),

-- Bonus điểm theo thời gian hoàn thành Sudoku (phần trăm)
('sudoku_time_bonus_fast', 50, 'Bonus % nếu hoàn thành nhanh (< 5 phút)'),
('sudoku_time_bonus_normal', 25, 'Bonus % nếu hoàn thành bình thường (5-10 phút)'),
('sudoku_time_bonus_slow', 0, 'Bonus % nếu hoàn thành chậm (> 10 phút)'),

-- Điểm thưởng khác
('daily_login', 5, 'Điểm thưởng đăng nhập hàng ngày'),
('course_completed', 100, 'Điểm thưởng hoàn thành khóa học'),
('achievement_common', 20, 'Điểm thưởng đạt thành tích Common'),
('achievement_rare', 50, 'Điểm thưởng đạt thành tích Rare'),
('achievement_epic', 100, 'Điểm thưởng đạt thành tích Epic'),
('achievement_legendary', 200, 'Điểm thưởng đạt thành tích Legendary');
