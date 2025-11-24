-- ===============================
-- Creator Application System
-- ===============================
-- Bảng đơn đăng ký trở thành creator
CREATE TABLE IF NOT EXISTS creator_applications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    specialization VARCHAR(100) NOT NULL COMMENT 'Chuyên ngành chính (Web, Mobile, AI, DevOps...)',
    work_experience JSON NOT NULL COMMENT 'Kinh nghiệm làm việc: [{years, position, company}]',
    skills TEXT NOT NULL COMMENT 'Kỹ năng nổi bật (tags: Node.js, React, Java...)',
    certificates JSON COMMENT 'Bằng cấp/chứng chỉ: [{type, url, file_url}]',
    portfolio JSON COMMENT 'Danh mục dự án: [{type, url}]',
    bio TEXT NOT NULL COMMENT 'Mô tả bản thân (2-5 dòng)',
    teaching_experience TEXT COMMENT 'Kinh nghiệm giảng dạy (nếu có)',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' NOT NULL,
    reviewed_by BIGINT NULL COMMENT 'Admin đã duyệt/từ chối',
    reviewed_at DATETIME NULL,
    rejection_reason TEXT NULL COMMENT 'Lý do từ chối (nếu có)',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    UNIQUE KEY unique_pending_application (user_id, status) -- Một user chỉ có 1 đơn pending tại một thời điểm
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

