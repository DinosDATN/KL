CREATE DATABASE IF NOT EXISTS lfysdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lfysdb;

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255), -- NULL cho người dùng OAuth, hashed nếu có
    avatar_url TEXT,
    role ENUM('user', 'creator', 'admin') DEFAULT 'user' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_online BOOLEAN DEFAULT FALSE NOT NULL,
    last_seen_at DATETIME,
    subscription_status ENUM('free', 'premium') DEFAULT 'free' NOT NULL, -- Thêm cho subscription model
    subscription_end_date DATE, -- Thêm cho subscription
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng hồ sơ người dùng (User Profiles)
-- Chứa thông tin bổ sung cho người dùng, như tiểu sử, ngày sinh, giới tính, v.v.
CREATE TABLE user_profiles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNIQUE NOT NULL,
    bio TEXT,
    birthday DATE,
    gender ENUM('male', 'female', 'other'),
    phone VARCHAR(20),
    address TEXT,
    website_url VARCHAR(255),
    github_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    preferred_language VARCHAR(10) DEFAULT 'vi' NOT NULL,
    theme_mode ENUM('light', 'dark', 'system') DEFAULT 'light' NOT NULL, -- Hỗ trợ dark/light mode
    layout ENUM('compact', 'expanded') DEFAULT 'expanded' NOT NULL, -- Kiểu bố cục giao diện
    notifications BOOLEAN DEFAULT TRUE NOT NULL, -- Nhận thông báo
    visibility_profile BOOLEAN DEFAULT TRUE NOT NULL,
    visibility_achievements BOOLEAN DEFAULT TRUE NOT NULL,
    visibility_progress BOOLEAN DEFAULT TRUE NOT NULL,
    visibility_activity BOOLEAN DEFAULT FALSE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_id (user_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng thống kê người dùng (User Stats)
-- Chứa các chỉ số thống kê của người dùng, như điểm kinh nghiệm, cấp độ, v.v.
CREATE TABLE user_stats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNIQUE NOT NULL,
    xp INT DEFAULT 0 NOT NULL CHECK (xp >= 0), -- Điểm kinh nghiệm
    level INT DEFAULT 1 NOT NULL CHECK (level >= 1), -- Cấp độ người dùng
    rank INT DEFAULT 0 NOT NULL, -- Xếp hạng người dùng
    courses_completed INT DEFAULT 0 NOT NULL CHECK (courses_completed >= 0),
    hours_learned INT DEFAULT 0 NOT NULL CHECK (hours_learned >= 0),
    problems_solved INT DEFAULT 0 NOT NULL CHECK (problems_solved >= 0),
    current_streak INT DEFAULT 0 NOT NULL CHECK (current_streak >= 0),
    longest_streak INT DEFAULT 0 NOT NULL CHECK (longest_streak >= 0),
    average_score FLOAT DEFAULT 0 NOT NULL CHECK (average_score >= 0 AND average_score <= 100),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_id (user_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng mục tiêu người dùng (User Goals)
CREATE TABLE user_goals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT, 
    target INT NOT NULL CHECK (target > 0), -- Mục tiêu cần đạt
    current INT DEFAULT 0 NOT NULL CHECK (current >= 0), -- Hiện tại đã đạt được
    unit VARCHAR(50) NOT NULL, -- Đơn vị của mục tiêu (ví dụ: "hours", "problems", "courses")
    deadline DATE,
    category ENUM('learning', 'practice', 'achievement') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_id (user_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng thành tích (Achievements)
CREATE TABLE achievements (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50), -- Tên file icon hoặc URL
    category ENUM('learning', 'teaching', 'community', 'milestone') NOT NULL, -- Loại thành tích
    rarity ENUM('common', 'rare', 'epic', 'legendary') NOT NULL, -- Độ hiếm của thành tích
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng thành tích người dùng (User Achievements)
CREATE TABLE user_achievements (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    achievement_id BIGINT NOT NULL,
    date_earned DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE(user_id, achievement_id),
    INDEX idx_user_id (user_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng nhật ký hoạt động người dùng (User Activity Log)
CREATE TABLE user_activity_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    type ENUM('course_started', 'course_completed', 'quiz_taken', 'problem_solved', 'badge_earned', 'course_published') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    duration INT CHECK (duration >= 0), -- Thời gian hoạt động (ví dụ: thời gian học)
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_activity (user_id, type)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;