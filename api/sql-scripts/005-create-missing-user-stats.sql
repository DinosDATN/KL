-- Migration: Create missing user_stats for existing users
-- Description: Đảm bảo tất cả users đều có user_stats record

USE lfysdb;

-- Tạo user_stats cho các user chưa có
INSERT INTO user_stats (user_id, xp, level, rank, reward_points, courses_completed, hours_learned, problems_solved, current_streak, longest_streak, average_score, created_at, updated_at)
SELECT 
    u.id,
    0 as xp,
    1 as level,
    0 as rank,
    0 as reward_points,
    0 as courses_completed,
    0 as hours_learned,
    0 as problems_solved,
    0 as current_streak,
    0 as longest_streak,
    0 as average_score,
    NOW() as created_at,
    NOW() as updated_at
FROM users u
LEFT JOIN user_stats us ON u.id = us.user_id
WHERE us.id IS NULL;

-- Hiển thị kết quả
SELECT COUNT(*) as total_users_with_stats FROM user_stats;
