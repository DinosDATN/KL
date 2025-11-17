-- Quick Fix: Tạo user_stats cho tất cả users
-- Chạy script này nếu gặp lỗi "User not found" hoặc stats không hiển thị

USE lfysdb;

-- 1. Kiểm tra users không có stats
SELECT 
    u.id,
    u.name,
    u.email,
    CASE WHEN us.id IS NULL THEN 'MISSING STATS' ELSE 'HAS STATS' END as status
FROM users u
LEFT JOIN user_stats us ON u.id = us.user_id;

-- 2. Tạo stats cho users chưa có
INSERT INTO user_stats (
    user_id, 
    xp, 
    level, 
    rank, 
    reward_points, 
    courses_completed, 
    hours_learned, 
    problems_solved, 
    current_streak, 
    longest_streak, 
    average_score,
    created_at,
    updated_at
)
SELECT 
    u.id,
    0,  -- xp
    1,  -- level
    0,  -- rank
    0,  -- reward_points
    0,  -- courses_completed
    0,  -- hours_learned
    0,  -- problems_solved
    0,  -- current_streak
    0,  -- longest_streak
    0,  -- average_score
    NOW(),
    NOW()
FROM users u
LEFT JOIN user_stats us ON u.id = us.user_id
WHERE us.id IS NULL;

-- 3. Verify - Hiển thị tất cả users với stats
SELECT 
    u.id,
    u.name,
    us.reward_points,
    us.level,
    us.xp,
    us.rank
FROM users u
INNER JOIN user_stats us ON u.id = us.user_id
ORDER BY u.id;

-- 4. Đếm tổng số
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM user_stats) as total_stats,
    CASE 
        WHEN (SELECT COUNT(*) FROM users) = (SELECT COUNT(*) FROM user_stats) 
        THEN '✅ ALL USERS HAVE STATS' 
        ELSE '❌ SOME USERS MISSING STATS' 
    END as status;
