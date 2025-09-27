USE lfysdb;

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
