USE lfysdb;
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