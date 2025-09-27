USE lfysdb;

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
