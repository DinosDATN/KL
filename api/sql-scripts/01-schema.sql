-- ===============================
-- 📚 DATABASE: L-FYS (Learn For Yourself)
/* Here is the SQL schema of my system (I will paste it below).  
Your task:  
1. Read the entire schema in E:\AA\KLTN\KL\api\sql-scripts\01-schema.sql and understand all tables, primary keys, and foreign keys.  
2. Generate valid sample data for each table.  
3. For every table, write at least 50 INSERT INTO statements.  
4. Ensure the insert order respects foreign key constraints (parent tables first, child tables later).  
5. Output the result as a complete .sql file that can be executed directly.  
6. If the output is too long, split it into multiple blocks (for example: Users.sql, Orders.sql, etc.) and continue until each table has at least 50 rows.  
7. Do not stop at 10 rows — always generate at least 50 rows per table as requested.  
*/
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

-- ===============================
-- Bảng Danh mục course (Course Categories)
CREATE TABLE course_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng khóa học (Courses)
CREATE TABLE courses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    instructor_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    thumbnail TEXT,
    publish_date DATE,
    status ENUM('published', 'draft', 'archived') DEFAULT 'draft' NOT NULL,
    revenue INT DEFAULT 0 NOT NULL CHECK (revenue >= 0),
    students INT DEFAULT 0 NOT NULL CHECK (students >= 0),
    rating FLOAT DEFAULT 0 NOT NULL CHECK (rating >= 0 AND rating <= 5),
    description TEXT,
    level ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner' NOT NULL,
    duration INT CHECK (duration >= 0), -- Thời gian khóa học tính bằng phút
    category_id BIGINT NOT NULL,
    is_premium BOOLEAN DEFAULT FALSE NOT NULL, -- Thêm cho premium content
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL, -- Soft delete
    price INT CHECK (price >= 0),
    original_price INT CHECK (original_price >= 0),
    discount INT CHECK (discount >= 0 AND discount <= 100),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (category_id) REFERENCES course_categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_instructor_id (instructor_id),
    INDEX idx_category_id (category_id),
    INDEX idx_status (status),
    INDEX idx_level (level),
    INDEX idx_is_premium (is_premium),
    INDEX idx_is_deleted (is_deleted)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng đăng ký khóa học (Course Enrollments)
CREATE TABLE course_enrollments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    progress INT DEFAULT 0 NOT NULL CHECK (progress >= 0 AND progress <= 100),
    status ENUM('completed', 'in-progress', 'not-started') DEFAULT 'not-started' NOT NULL,
    start_date DATE,
    completion_date DATE,
    rating FLOAT CHECK (rating >= 0 AND rating <= 5),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(user_id, course_id),
    INDEX idx_user_id (user_id),
    INDEX idx_course_id (course_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng trình độ của giảng viên (Instructor Qualifications)
CREATE TABLE instructor_qualifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    institution VARCHAR(255),
    date DATE,
    credential_url TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_id (user_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng đánh giá từ học viên (Testimonials)
CREATE TABLE testimonials (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    instructor_id BIGINT NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    student_avatar TEXT,
    rating FLOAT NOT NULL CHECK (rating >= 0 AND rating <= 5),
    comment TEXT,
    course_title VARCHAR(255),
    date DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_instructor_id (instructor_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ===============================
-- II. DOCUMENTS & ANIMATION
-- ===============================
-- Bảng chủ đề (Topics)
CREATE TABLE topics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng danh mục tài liệu (Document Categories)
CREATE TABLE document_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng tài liệu (Documents)
CREATE TABLE documents (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content LONGTEXT,
    topic_id BIGINT NOT NULL,
    level ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner' NOT NULL,
    duration INT CHECK (duration >= 0), -- thời gian tính bằng phút
    students INT DEFAULT 0 NOT NULL CHECK (students >= 0),
    rating FLOAT DEFAULT 0 NOT NULL CHECK (rating >= 0 AND rating <= 5),
    thumbnail_url TEXT,
    created_by BIGINT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL, -- Soft delete
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_created_by (created_by),
    INDEX idx_topic_id (topic_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng liên kết tài liệu với danh mục (Document Category Links)
CREATE TABLE document_category_links (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    document_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (category_id) REFERENCES document_categories(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(document_id, category_id),
    INDEX idx_document_category (document_id, category_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng mô-đun tài liệu (Document Modules)
CREATE TABLE document_modules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    document_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    position INT NOT NULL CHECK (position >= 0),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_document_id (document_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng bài học trong mô-đun tài liệu (Document Lessons)
CREATE TABLE document_lessons (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    module_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    code_example TEXT,
    position INT NOT NULL CHECK (position >= 0),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES document_modules(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_module_id (module_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng liên kết người dùng với bài học tài liệu (Document Lesson Completions)
CREATE TABLE document_lesson_completions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    lesson_id BIGINT NOT NULL,
    completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES document_lessons(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(user_id, lesson_id),
    INDEX idx_user_id (user_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng liên kết người dùng với tài liệu (Document Completions)
CREATE TABLE document_completions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    document_id BIGINT NOT NULL,
    completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(user_id, document_id),
    INDEX idx_user_id (user_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng hiệu ứng hoạt hình (Animations)
CREATE TABLE animations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    document_id BIGINT,
    lesson_id BIGINT,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- e.g., 'sorting', 'searching'
    description TEXT,
    embed_code TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES document_lessons(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CHECK (document_id IS NOT NULL OR lesson_id IS NOT NULL),
    INDEX idx_document_id (document_id),
    INDEX idx_lesson_id (lesson_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ===============================
-- III. PROBLEMS & CODE
-- ===============================
-- Bảng danh mục bài tập (Problem Categories)
CREATE TABLE problem_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng bài tập (Problems)
CREATE TABLE problems (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL,
    estimated_time VARCHAR(50),
    likes INT DEFAULT 0 NOT NULL CHECK (likes >= 0),
    dislikes INT DEFAULT 0 NOT NULL CHECK (dislikes >= 0),
    acceptance DECIMAL(5,2) DEFAULT 0.0 NOT NULL CHECK (acceptance >= 0 AND acceptance <= 100),
    total_submissions INT DEFAULT 0 NOT NULL CHECK (total_submissions >= 0),
    solved_count INT DEFAULT 0 NOT NULL CHECK (solved_count >= 0),
    is_new BOOLEAN DEFAULT FALSE NOT NULL,
    is_popular BOOLEAN DEFAULT FALSE NOT NULL,
    is_premium BOOLEAN DEFAULT FALSE NOT NULL,
    category_id BIGINT NOT NULL,
    created_by BIGINT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL, -- Soft delete
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (category_id) REFERENCES problem_categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_category_id (category_id),
    INDEX idx_difficulty (difficulty)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng tags chứa các thẻ cho bài tập
CREATE TABLE tags (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng liên kết bài tập với thẻ (Problem Tags)
CREATE TABLE problem_tags (
    problem_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    PRIMARY KEY (problem_id, tag_id),
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE ON UPDATE CASCADE
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng ví dụ bài tập (Problem Examples)
CREATE TABLE problem_examples (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    problem_id BIGINT NOT NULL,
    input TEXT NOT NULL,
    output TEXT NOT NULL,
    explanation TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_problem_id (problem_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng ràng buộc bài tập (Problem Constraints)
CREATE TABLE problem_constraints (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    problem_id BIGINT NOT NULL,
    constraint_text TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_problem_id (problem_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng starter codes chứa mã khởi đầu cho bài tập
CREATE TABLE starter_codes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    problem_id BIGINT NOT NULL,
    language VARCHAR(50) NOT NULL,
    code TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(problem_id, language),
    INDEX idx_problem_id (problem_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng mã nộp bài (Submission Codes)
CREATE TABLE submission_codes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    source_code TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng nộp bài (Submissions)
CREATE TABLE submissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    problem_id BIGINT NOT NULL,
    code_id BIGINT NOT NULL,
    language VARCHAR(50) NOT NULL,
    status ENUM('pending', 'accepted', 'wrong', 'error', 'timeout') NOT NULL,
    score INT DEFAULT 0 NOT NULL CHECK (score >= 0),
    exec_time INT CHECK (exec_time >= 0),
    memory_used INT CHECK (memory_used >= 0),
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (code_id) REFERENCES submission_codes(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_problem (user_id, problem_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng bình luận bài tập (Problem Comments)
CREATE TABLE problem_comments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    problem_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_problem_id (problem_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng test cases chứa các trường hợp kiểm tra cho bài tập
CREATE TABLE test_cases (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    problem_id BIGINT NOT NULL,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_sample BOOLEAN DEFAULT FALSE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_problem_id (problem_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ===============================
-- IV. GAMIFICATION & HINT
-- ===============================
-- Bảng danh mục huy hiệu (Badge Categories)
CREATE TABLE badge_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng huy hiệu (Badges)
CREATE TABLE badges (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    rarity ENUM('common', 'rare', 'epic', 'legendary') NOT NULL,
    category_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES badge_categories(id) ON DELETE RESTRICT ON UPDATE CASCADE
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng cấp độ (Levels)
CREATE TABLE levels (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    level INT UNIQUE NOT NULL CHECK (level >= 1),
    name VARCHAR(100) NOT NULL,
    xp_required INT NOT NULL CHECK (xp_required >= 0),
    xp_to_next INT NOT NULL CHECK (xp_to_next >= 0),
    color VARCHAR(50),
    icon TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng bảng xếp hạng (Leaderboard Entries)
CREATE TABLE leaderboard_entries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    xp INT DEFAULT 0 NOT NULL CHECK (xp >= 0),
    type ENUM('weekly', 'monthly') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(user_id, type),
    INDEX idx_user_id (user_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng thống kê trò chơi (Game Stats)
CREATE TABLE game_stats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNIQUE NOT NULL,
    level_id BIGINT NOT NULL,
    next_level_id BIGINT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (next_level_id) REFERENCES levels(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_user_id (user_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng người dùng huy hiệu (User Badges)
CREATE TABLE user_badges (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    badge_id BIGINT NOT NULL,
    earned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(user_id, badge_id),
    INDEX idx_user_id (user_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng gợi ý (Hints)
CREATE TABLE hints (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    problem_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    coin_cost INT DEFAULT 10 NOT NULL CHECK (coin_cost >= 0),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_problem_id (problem_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng sử dụng gợi ý (User Hint Usage)
CREATE TABLE user_hint_usage (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    hint_id BIGINT NOT NULL,
    used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (hint_id) REFERENCES hints(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(user_id, hint_id),
    INDEX idx_user_id (user_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ===============================
-- V. CHAT REALTIME
-- ===============================
CREATE TABLE chat_rooms (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    type ENUM('course', 'global', 'group') NOT NULL,
    description TEXT,
    avatar_url TEXT,
    unread_count INT DEFAULT 0 NOT NULL CHECK (unread_count >= 0),
    last_message_id BIGINT, -- Giữ cột, foreign key add sau
    course_id BIGINT,
    is_public BOOLEAN DEFAULT TRUE NOT NULL,
    created_by BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_type (type)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE chat_messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    room_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    time_stamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    type ENUM('text', 'image', 'file') NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE NOT NULL,
    reply_to BIGINT,
    sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (reply_to) REFERENCES chat_messages(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_room_id (room_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


-- Bảng thành viên phòng trò chuyện (Chat Room Members)
CREATE TABLE chat_room_members (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    room_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(room_id, user_id),
    INDEX idx_room_id (room_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng reactions cho tin nhắn trò chuyện (Chat Reactions)
CREATE TABLE chat_reactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    message_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    reaction_type ENUM('like', 'love', 'laugh', 'sad', 'angry') NOT NULL,
    reacted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(message_id, user_id, reaction_type),
    INDEX idx_message_id (message_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng mentions trong tin nhắn trò chuyện (Message Mentions)
CREATE TABLE message_mentions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    message_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(message_id, user_id),
    INDEX idx_message_id (message_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ===============================
-- VI. CONTEST SYSTEM
-- ===============================
-- Bảng cuộc thi (Contests)
CREATE TABLE contests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    created_by BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_start_time (start_time)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng vấn đề cuộc thi (Contest Problems)
CREATE TABLE contest_problems (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    contest_id BIGINT NOT NULL,
    problem_id BIGINT NOT NULL,
    score INT DEFAULT 100 NOT NULL CHECK (score >= 0),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(contest_id, problem_id),
    INDEX idx_contest_id (contest_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng người dùng tham gia cuộc thi (User Contests)
CREATE TABLE user_contests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    contest_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(contest_id, user_id),
    INDEX idx_contest_id (contest_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

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
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (contest_problem_id) REFERENCES contest_problems(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (code_id) REFERENCES submission_codes(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_contest_user (contest_problem_id, user_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ===============================
-- VII. ADMIN & SUPPORT
-- ===============================
CREATE TABLE admins (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNIQUE NOT NULL,
    level ENUM('mod', 'super') NOT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_id (user_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE reports (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    type ENUM('bug', 'feedback', 'violation') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_id (user_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_id (user_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ===============================
-- VIII. AI & MACHINE LEARNING
-- ===============================
CREATE TABLE ai_messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    type ENUM('chat', 'hint', 'review', 'progress_report') NOT NULL,
    prompt TEXT,
    response TEXT,
    related_problem_id BIGINT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (related_problem_id) REFERENCES problems(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_user_id (user_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE ai_code_reviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    submission_id BIGINT NOT NULL,
    review TEXT NOT NULL,
    score INT CHECK (score >= 0 AND score <= 100),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_submission_id (submission_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ===============================
-- IX. COURSE MODULES & LESSONS
-- ===============================
-- Bảng module cho course
CREATE TABLE course_modules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    course_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    position INT NOT NULL CHECK (position >= 0),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_course_id (course_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng lesson cho course
CREATE TABLE course_lessons (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    module_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    duration INT CHECK (duration >= 0),
    position INT NOT NULL CHECK (position >= 0),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_module_id (module_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng ngôn ngữ cho course (nhiều ngôn ngữ/course)
CREATE TABLE course_languages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    course_id BIGINT NOT NULL,
    language VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(course_id, language),
    INDEX idx_course_id (course_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng đánh giá khóa học (Course Reviews)
CREATE TABLE course_reviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    course_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    helpful INT DEFAULT 0 CHECK (helpful >= 0),
    not_helpful INT DEFAULT 0 CHECK (not_helpful >= 0),
    verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_course_id (course_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng khóa học liên quan (Related Courses)
CREATE TABLE related_courses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    course_id BIGINT NOT NULL,
    related_course_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (related_course_id) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(course_id, related_course_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng thanh toán (Payments)
CREATE TABLE payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    course_id BIGINT,
    hint_id BIGINT,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    payment_method ENUM('credit_card', 'paypal', 'bank_transfer') NOT NULL,
    status ENUM('pending', 'completed', 'failed') NOT NULL,
    type ENUM('course', 'hint', 'subscription') DEFAULT 'course' NOT NULL, -- Thêm cho subscription
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (hint_id) REFERENCES hints(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_user_id (user_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ===============================
-- X. ADDITIONAL FEATURES (Ưu Tiên Cao & Trung Bình)
-- ===============================
-- Bảng Quizzes (Hệ thống quizzes/tests)
CREATE TABLE quizzes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    lesson_id BIGINT,  -- Liên kết với lesson của course hoặc document
    type ENUM('multiple_choice', 'true_false', 'code') NOT NULL,
    time_limit INT CHECK (time_limit >= 0),  -- Giới hạn thời gian (phút)
    created_by BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE ON UPDATE CASCADE,  -- Hoặc document_lessons nếu cần
    INDEX idx_lesson_id (lesson_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng Câu Hỏi Quiz
CREATE TABLE quiz_questions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    quiz_id BIGINT NOT NULL,
    question TEXT NOT NULL,
    options TEXT,  -- JSON cho multiple-choice
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    points INT DEFAULT 1 NOT NULL CHECK (points > 0),
    position INT NOT NULL CHECK (position >= 0),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_quiz_id (quiz_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng Kết Quả Quiz Của Người Dùng
CREATE TABLE user_quiz_results (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    quiz_id BIGINT NOT NULL,
    score INT NOT NULL CHECK (score >= 0),
    completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(user_id, quiz_id),
    INDEX idx_user_id (user_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng Forums (Diễn Đàn/Discussions)
CREATE TABLE forums (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('course', 'problem', 'general') NOT NULL,
    related_id BIGINT,  -- ID của course/problem
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type)
    -- FOREIGN KEY (related_id) REFERENCES courses(id) OR problems(id) - Sử dụng dynamic nếu cần
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng Posts Trong Forum
CREATE TABLE forum_posts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    forum_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    votes INT DEFAULT 0 NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (forum_id) REFERENCES forums(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_forum_id (forum_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng Votes Cho Posts
CREATE TABLE forum_votes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    vote_type ENUM('up', 'down') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(post_id, user_id),
    INDEX idx_post_id (post_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng Recommendations (Personalized Recommendations)
CREATE TABLE user_recommendations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    recommended_type ENUM('course', 'problem', 'document') NOT NULL,
    recommended_id BIGINT NOT NULL,
    reason TEXT,
    score FLOAT NOT NULL CHECK (score >= 0 AND score <= 1),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_id (user_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng Translations (Multi-Language Support)
CREATE TABLE translations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    entity_type ENUM('course', 'problem', 'document') NOT NULL,
    entity_id BIGINT NOT NULL,
    language VARCHAR(50) NOT NULL,
    field VARCHAR(50) NOT NULL,  -- e.g., 'title', 'description'
    translated_text TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE(entity_type, entity_id, language, field)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng Referrals (Social Sharing & Invites)
CREATE TABLE referrals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    referrer_id BIGINT NOT NULL,
    referred_id BIGINT NOT NULL,
    bonus_xp INT DEFAULT 100 NOT NULL CHECK (bonus_xp >= 0),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(referrer_id, referred_id),
    INDEX idx_referrer_id (referrer_id)
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

ALTER TABLE chat_rooms
ADD CONSTRAINT fk_last_message
FOREIGN KEY (last_message_id) REFERENCES chat_messages(id) ON DELETE SET NULL ON UPDATE CASCADE;
