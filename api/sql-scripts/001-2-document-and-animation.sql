USE lfysdb;

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
