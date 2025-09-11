-- ===============================
-- 📚 DATABASE: L-FYS (Learn For Yourself)
-- MySQL 8.0 Compatible Version
-- ===============================
CREATE DATABASE IF NOT EXISTS lfysdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lfysdb;

-- ===============================
-- I. USERS & AUTHENTICATION
-- ===============================
-- Bảng người dùng (Users)
-- Chứa thông tin người dùng, bao gồm cả người dùng OAuth
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) DEFAULT NULL, -- NULL cho người dùng OAuth, hashed nếu có
    avatar_url TEXT DEFAULT NULL,
    role ENUM('user', 'creator', 'admin') DEFAULT 'user' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_online BOOLEAN DEFAULT FALSE NOT NULL,
    last_seen_at DATETIME DEFAULT NULL,
    subscription_status ENUM('free', 'premium') DEFAULT 'free' NOT NULL, -- Thêm cho subscription model
    subscription_end_date DATE DEFAULT NULL, -- Thêm cho subscription
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active),
    INDEX idx_subscription_status (subscription_status)
);

-- Bảng hồ sơ người dùng (User Profiles)
-- Chứa thông tin bổ sung cho người dùng, như tiểu sử, ngày sinh, giới tính, v.v.
CREATE TABLE user_profiles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNIQUE NOT NULL,
    bio TEXT DEFAULT NULL,
    birthday DATE DEFAULT NULL,
    gender ENUM('male', 'female', 'other') DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    website_url VARCHAR(255) DEFAULT NULL,
    github_url VARCHAR(255) DEFAULT NULL,
    linkedin_url VARCHAR(255) DEFAULT NULL,
    preferred_language VARCHAR(10) DEFAULT 'vi' NOT NULL,
    theme_mode ENUM('light', 'dark', 'system') DEFAULT 'light' NOT NULL, -- Hỗ trợ dark/light mode
    layout ENUM('compact', 'expanded') DEFAULT 'expanded' NOT NULL, -- Kiểu bố cục giao diện
    notifications BOOLEAN DEFAULT TRUE NOT NULL, -- Nhận thông báo
    visibility_profile BOOLEAN DEFAULT TRUE NOT NULL,
    visibility_achievements BOOLEAN DEFAULT TRUE NOT NULL,
    visibility_progress BOOLEAN DEFAULT TRUE NOT NULL,
    visibility_activity BOOLEAN DEFAULT FALSE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_profiles_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_id (user_id)
);

-- Bảng thống kê người dùng (User Stats)
-- Chứa các chỉ số thống kê của người dùng, như điểm kinh nghiệm, cấp độ, v.v.
CREATE TABLE user_stats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNIQUE NOT NULL,
    xp INT DEFAULT 0 NOT NULL CHECK (xp >= 0), -- Điểm kinh nghiệm
    level INT DEFAULT 1 NOT NULL CHECK (level >= 1), -- Cấp độ người dùng
    rank INT DEFAULT 0 NOT NULL CHECK (rank >= 0), -- Xếp hạng người dùng
    courses_completed INT DEFAULT 0 NOT NULL CHECK (courses_completed >= 0),
    hours_learned INT DEFAULT 0 NOT NULL CHECK (hours_learned >= 0),
    problems_solved INT DEFAULT 0 NOT NULL CHECK (problems_solved >= 0),
    current_streak INT DEFAULT 0 NOT NULL CHECK (current_streak >= 0),
    longest_streak INT DEFAULT 0 NOT NULL CHECK (longest_streak >= 0),
    average_score DECIMAL(5,2) DEFAULT 0.00 NOT NULL CHECK (average_score >= 0 AND average_score <= 100),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_stats_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_xp (xp),
    INDEX idx_level (level),
    INDEX idx_rank (rank)
);

-- Bảng mục tiêu người dùng (User Goals)
CREATE TABLE user_goals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL, 
    target INT NOT NULL CHECK (target > 0), -- Mục tiêu cần đạt
    current INT DEFAULT 0 NOT NULL CHECK (current >= 0), -- Hiện tại đã đạt được
    unit VARCHAR(50) NOT NULL, -- Đơn vị của mục tiêu (ví dụ: "hours", "problems", "courses")
    deadline DATE DEFAULT NULL,
    category ENUM('learning', 'practice', 'achievement') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_goals_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_category (category)
);

-- Bảng thành tích (Achievements)
CREATE TABLE achievements (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) UNIQUE NOT NULL,
    description TEXT DEFAULT NULL,
    icon VARCHAR(50) DEFAULT NULL, -- Tên file icon hoặc URL
    category ENUM('learning', 'teaching', 'community', 'milestone') NOT NULL, -- Loại thành tích
    rarity ENUM('common', 'rare', 'epic', 'legendary') NOT NULL, -- Độ hiếm của thành tích
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_rarity (rarity)
);

-- Bảng thành tích người dùng (User Achievements)
CREATE TABLE user_achievements (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    achievement_id BIGINT NOT NULL,
    date_earned DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_achievements_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_user_achievements_achievement_id FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY uk_user_achievement (user_id, achievement_id),
    INDEX idx_user_id (user_id),
    INDEX idx_achievement_id (achievement_id)
);

-- Bảng nhật ký hoạt động người dùng (User Activity Log)
CREATE TABLE user_activity_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    type ENUM('course_started', 'course_completed', 'quiz_taken', 'problem_solved', 'badge_earned', 'course_published') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    date DATE NOT NULL,
    duration INT DEFAULT NULL CHECK (duration IS NULL OR duration >= 0), -- Thời gian hoạt động (ví dụ: thời gian học)
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_activity_log_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_activity (user_id, type),
    INDEX idx_date (date)
);

-- ===============================
-- II. COURSES & EDUCATION
-- ===============================
-- Bảng Danh mục course (Course Categories)
CREATE TABLE course_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Bảng khóa học (Courses)
CREATE TABLE courses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    instructor_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    thumbnail TEXT DEFAULT NULL,
    publish_date DATE DEFAULT NULL,
    status ENUM('published', 'draft', 'archived') DEFAULT 'draft' NOT NULL,
    revenue INT DEFAULT 0 NOT NULL CHECK (revenue >= 0),
    students INT DEFAULT 0 NOT NULL CHECK (students >= 0),
    rating DECIMAL(3,2) DEFAULT 0.00 NOT NULL CHECK (rating >= 0 AND rating <= 5),
    description TEXT DEFAULT NULL,
    level ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner' NOT NULL,
    duration INT DEFAULT NULL CHECK (duration IS NULL OR duration >= 0), -- Thời gian khóa học tính bằng phút
    category_id BIGINT NOT NULL,
    is_premium BOOLEAN DEFAULT FALSE NOT NULL, -- Thêm cho premium content
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL, -- Soft delete
    price INT DEFAULT 0 NOT NULL CHECK (price >= 0), -- Added for API compatibility
    original_price INT DEFAULT 0 NOT NULL CHECK (original_price >= 0), -- Added for API compatibility
    discount INT DEFAULT 0 NOT NULL CHECK (discount >= 0 AND discount <= 100), -- Added for API compatibility
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_courses_instructor_id FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_courses_category_id FOREIGN KEY (category_id) REFERENCES course_categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_instructor_id (instructor_id),
    INDEX idx_category_id (category_id),
    INDEX idx_status (status),
    INDEX idx_level (level),
    INDEX idx_is_premium (is_premium),
    INDEX idx_is_deleted (is_deleted),
    INDEX idx_rating (rating)
);

-- Bảng đăng ký khóa học (Course Enrollments)
CREATE TABLE course_enrollments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    progress INT DEFAULT 0 NOT NULL CHECK (progress >= 0 AND progress <= 100),
    status ENUM('completed', 'in-progress', 'not-started') DEFAULT 'not-started' NOT NULL,
    start_date DATE DEFAULT NULL,
    completion_date DATE DEFAULT NULL,
    rating DECIMAL(3,2) DEFAULT NULL CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_course_enrollments_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_course_enrollments_course_id FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uk_user_course (user_id, course_id),
    INDEX idx_user_id (user_id),
    INDEX idx_course_id (course_id),
    INDEX idx_status (status)
);

-- Bảng trình độ của giảng viên (Instructor Qualifications)
CREATE TABLE instructor_qualifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    institution VARCHAR(255) DEFAULT NULL,
    date DATE DEFAULT NULL,
    credential_url TEXT DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_instructor_qualifications_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_id (user_id)
);

-- Bảng đánh giá từ học viên (Testimonials)
CREATE TABLE testimonials (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    instructor_id BIGINT NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    student_avatar TEXT DEFAULT NULL,
    rating DECIMAL(3,2) NOT NULL CHECK (rating >= 0 AND rating <= 5),
    comment TEXT DEFAULT NULL,
    course_title VARCHAR(255) DEFAULT NULL,
    date DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_testimonials_instructor_id FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_instructor_id (instructor_id),
    INDEX idx_rating (rating),
    INDEX idx_date (date)
);

-- ===============================
-- III. DOCUMENTS & TOPICS
-- ===============================
-- Bảng chủ đề (Topics)
CREATE TABLE topics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Bảng danh mục tài liệu (Document Categories)
CREATE TABLE document_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Bảng tài liệu (Documents)
CREATE TABLE documents (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    content LONGTEXT DEFAULT NULL,
    topic_id BIGINT NOT NULL,
    level ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner' NOT NULL,
    duration INT DEFAULT NULL CHECK (duration IS NULL OR duration >= 0), -- thời gian tính bằng phút
    students INT DEFAULT 0 NOT NULL CHECK (students >= 0),
    rating DECIMAL(3,2) DEFAULT 0.00 NOT NULL CHECK (rating >= 0 AND rating <= 5),
    thumbnail_url TEXT DEFAULT NULL,
    created_by BIGINT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL, -- Soft delete
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_documents_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_documents_topic_id FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_created_by (created_by),
    INDEX idx_topic_id (topic_id),
    INDEX idx_level (level),
    INDEX idx_is_deleted (is_deleted),
    INDEX idx_rating (rating)
);

-- ===============================
-- IV. PROBLEMS & CODING
-- ===============================
-- Bảng danh mục bài tập (Problem Categories)
CREATE TABLE problem_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Bảng bài tập (Problems)
CREATE TABLE problems (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL,
    estimated_time VARCHAR(50) DEFAULT NULL,
    likes INT DEFAULT 0 NOT NULL CHECK (likes >= 0),
    dislikes INT DEFAULT 0 NOT NULL CHECK (dislikes >= 0),
    acceptance DECIMAL(5,2) DEFAULT 0.00 NOT NULL CHECK (acceptance >= 0 AND acceptance <= 100),
    total_submissions INT DEFAULT 0 NOT NULL CHECK (total_submissions >= 0),
    solved_count INT DEFAULT 0 NOT NULL CHECK (solved_count >= 0),
    is_new BOOLEAN DEFAULT FALSE NOT NULL,
    is_popular BOOLEAN DEFAULT FALSE NOT NULL,
    is_premium BOOLEAN DEFAULT FALSE NOT NULL,
    category_id BIGINT NOT NULL,
    created_by BIGINT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL, -- Soft delete
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_problems_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_problems_category_id FOREIGN KEY (category_id) REFERENCES problem_categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_category_id (category_id),
    INDEX idx_difficulty (difficulty),
    INDEX idx_is_new (is_new),
    INDEX idx_is_popular (is_popular),
    INDEX idx_is_premium (is_premium),
    INDEX idx_is_deleted (is_deleted),
    INDEX idx_created_by (created_by)
);

-- Bảng tags chứa các thẻ cho bài tập
CREATE TABLE tags (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Bảng liên kết bài tập với thẻ (Problem Tags)
CREATE TABLE problem_tags (
    problem_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    PRIMARY KEY (problem_id, tag_id),
    CONSTRAINT fk_problem_tags_problem_id FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_problem_tags_tag_id FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ===============================
-- V. ADDITIONAL CORE TABLES
-- ===============================
-- Bảng module cho course
CREATE TABLE course_modules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    course_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    position INT NOT NULL CHECK (position >= 0),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_course_modules_course_id FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_course_id (course_id),
    INDEX idx_position (position)
);

-- Bảng lesson cho course
CREATE TABLE course_lessons (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    module_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT DEFAULT NULL,
    duration INT DEFAULT NULL CHECK (duration IS NULL OR duration >= 0),
    position INT NOT NULL CHECK (position >= 0),
    type ENUM('video', 'document', 'quiz', 'exercise') DEFAULT 'document' NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_course_lessons_module_id FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_module_id (module_id),
    INDEX idx_position (position),
    INDEX idx_type (type)
);

-- ===============================
-- VI. SUBMISSION SYSTEM
-- ===============================
-- Bảng mã nộp bài (Submission Codes)
CREATE TABLE submission_codes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    source_code LONGTEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng nộp bài (Submissions)
CREATE TABLE submissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    problem_id BIGINT NOT NULL,
    code_id BIGINT NOT NULL,
    language VARCHAR(50) NOT NULL,
    status ENUM('pending', 'accepted', 'wrong', 'error', 'timeout') NOT NULL,
    score INT DEFAULT 0 NOT NULL CHECK (score >= 0),
    exec_time INT DEFAULT NULL CHECK (exec_time IS NULL OR exec_time >= 0),
    memory_used INT DEFAULT NULL CHECK (memory_used IS NULL OR memory_used >= 0),
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_submissions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_submissions_problem_id FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_submissions_code_id FOREIGN KEY (code_id) REFERENCES submission_codes(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_problem (user_id, problem_id),
    INDEX idx_status (status),
    INDEX idx_submitted_at (submitted_at)
);

-- ===============================
-- VII. CONTESTS
-- ===============================
-- Bảng cuộc thi (Contests)
CREATE TABLE contests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    created_by BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_contests_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_start_time (start_time),
    INDEX idx_end_time (end_time),
    INDEX idx_created_by (created_by)
);

-- Bảng vấn đề cuộc thi (Contest Problems)
CREATE TABLE contest_problems (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    contest_id BIGINT NOT NULL,
    problem_id BIGINT NOT NULL,
    score INT DEFAULT 100 NOT NULL CHECK (score >= 0),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_contest_problems_contest_id FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_contest_problems_problem_id FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uk_contest_problem (contest_id, problem_id),
    INDEX idx_contest_id (contest_id)
);

-- Bảng người dùng tham gia cuộc thi (User Contests)
CREATE TABLE user_contests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    contest_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_contests_contest_id FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_user_contests_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uk_user_contest (contest_id, user_id),
    INDEX idx_contest_id (contest_id),
    INDEX idx_user_id (user_id)
);

-- Bảng nộp bài cuộc thi (Contest Submissions)
CREATE TABLE contest_submissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    contest_problem_id BIGINT NOT NULL,
    code_id BIGINT NOT NULL,
    language VARCHAR(50) NOT NULL,
    status ENUM('accepted', 'wrong', 'error') NOT NULL,
    score INT DEFAULT 0 NOT NULL CHECK (score >= 0), 
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contest_submissions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_contest_submissions_contest_problem_id FOREIGN KEY (contest_problem_id) REFERENCES contest_problems(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_contest_submissions_code_id FOREIGN KEY (code_id) REFERENCES submission_codes(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_contest_user (contest_problem_id, user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
);

-- ===============================
-- VIII. ENSURE MYSQL 8.0 COMPATIBILITY
-- ===============================
-- Set proper SQL mode for MySQL 8.0
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';

-- Ensure proper character set
ALTER DATABASE lfysdb CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
