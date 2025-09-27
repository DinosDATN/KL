USE lfysdb;

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
