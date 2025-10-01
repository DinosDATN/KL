USE lfysdb;

-- Bảng hội thoại riêng tư (Private Conversations)
-- Quản lý các cuộc trò chuyện 1-1 giữa hai người dùng
CREATE TABLE private_conversations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    participant1_id BIGINT NOT NULL, -- Người tham gia thứ nhất (ID nhỏ hơn)
    participant2_id BIGINT NOT NULL, -- Người tham gia thứ hai (ID lớn hơn)
    last_message_id BIGINT NULL, -- Tin nhắn cuối cùng
    last_activity_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Thời gian hoạt động cuối
    is_active BOOLEAN DEFAULT TRUE NOT NULL, -- Trạng thái hoạt động của cuộc hội thoại
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (participant1_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (participant2_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Đảm bảo participant1_id luôn nhỏ hơn participant2_id để tránh trùng lặp
    CHECK (participant1_id < participant2_id),
    
    -- Đảm bảo không có cuộc hội thoại trùng lặp
    UNIQUE KEY unique_conversation (participant1_id, participant2_id),
    
    INDEX idx_participant1 (participant1_id),
    INDEX idx_participant2 (participant2_id),
    INDEX idx_last_activity (last_activity_at),
    INDEX idx_is_active (is_active)
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng tin nhắn riêng tư (Private Messages)
-- Lưu trữ tất cả tin nhắn trong các cuộc hội thoại riêng tư
CREATE TABLE private_messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    conversation_id BIGINT NOT NULL, -- Liên kết đến cuộc hội thoại
    sender_id BIGINT NOT NULL, -- Người gửi tin nhắn
    receiver_id BIGINT NOT NULL, -- Người nhận tin nhắn
    content TEXT NOT NULL, -- Nội dung tin nhắn
    message_type ENUM('text', 'image', 'file', 'voice', 'video') DEFAULT 'text' NOT NULL,
    file_url VARCHAR(500) NULL, -- URL file đính kèm (nếu có)
    file_name VARCHAR(255) NULL, -- Tên file gốc
    file_size INT NULL, -- Kích thước file (bytes)
    reply_to_message_id BIGINT NULL, -- Tin nhắn được trả lời
    is_edited BOOLEAN DEFAULT FALSE NOT NULL, -- Tin nhắn đã được chỉnh sửa
    edited_at DATETIME NULL, -- Thời gian chỉnh sửa
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL, -- Tin nhắn đã bị xóa
    deleted_at DATETIME NULL, -- Thời gian xóa
    sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Thời gian gửi
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (conversation_id) REFERENCES private_conversations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (reply_to_message_id) REFERENCES private_messages(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    INDEX idx_conversation (conversation_id),
    INDEX idx_sender (sender_id),
    INDEX idx_receiver (receiver_id),
    INDEX idx_sent_at (sent_at),
    INDEX idx_is_deleted (is_deleted),
    INDEX idx_message_type (message_type)
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng trạng thái tin nhắn (Message Status)
-- Theo dõi trạng thái đọc/gửi của từng tin nhắn cho mỗi người dùng
CREATE TABLE private_message_status (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    message_id BIGINT NOT NULL, -- Liên kết đến tin nhắn
    user_id BIGINT NOT NULL, -- Người dùng (người nhận)
    status ENUM('sent', 'delivered', 'read') DEFAULT 'sent' NOT NULL,
    status_updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (message_id) REFERENCES private_messages(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Đảm bảo mỗi user chỉ có một trạng thái cho mỗi message
    UNIQUE KEY unique_message_user_status (message_id, user_id),
    
    INDEX idx_message (message_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_status_updated (status_updated_at)
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng reactions tin nhắn riêng tư (Private Message Reactions)
-- Quản lý các reactions cho tin nhắn riêng tư
CREATE TABLE private_message_reactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    message_id BIGINT NOT NULL, -- Liên kết đến tin nhắn
    user_id BIGINT NOT NULL, -- Người dùng thực hiện reaction
    reaction_type ENUM('like', 'love', 'laugh', 'sad', 'angry', 'wow') NOT NULL,
    reacted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (message_id) REFERENCES private_messages(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Đảm bảo mỗi user chỉ có một reaction cho mỗi message
    UNIQUE KEY unique_message_user_reaction (message_id, user_id),
    
    INDEX idx_message (message_id),
    INDEX idx_user (user_id),
    INDEX idx_reaction_type (reaction_type),
    INDEX idx_reacted_at (reacted_at)
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng cài đặt hội thoại riêng tư (Private Conversation Settings)
-- Lưu trữ các cài đặt cho từng cuộc hội thoại của mỗi user
CREATE TABLE private_conversation_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    conversation_id BIGINT NOT NULL, -- Liên kết đến cuộc hội thoại
    user_id BIGINT NOT NULL, -- Người dùng có cài đặt này
    is_muted BOOLEAN DEFAULT FALSE NOT NULL, -- Tắt thông báo
    is_archived BOOLEAN DEFAULT FALSE NOT NULL, -- Lưu trữ cuộc hội thoại
    is_pinned BOOLEAN DEFAULT FALSE NOT NULL, -- Ghim cuộc hội thoại
    custom_nickname VARCHAR(255) NULL, -- Biệt danh tùy chỉnh cho đối phương
    background_theme VARCHAR(50) NULL, -- Theme nền cuộc hội thoại
    font_size ENUM('small', 'medium', 'large') DEFAULT 'medium' NOT NULL,
    muted_until DATETIME NULL, -- Tắt thông báo đến khi nào
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (conversation_id) REFERENCES private_conversations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Đảm bảo mỗi user chỉ có một bộ cài đặt cho mỗi conversation
    UNIQUE KEY unique_conversation_user_settings (conversation_id, user_id),
    
    INDEX idx_conversation (conversation_id),
    INDEX idx_user (user_id),
    INDEX idx_is_muted (is_muted),
    INDEX idx_is_archived (is_archived),
    INDEX idx_is_pinned (is_pinned)
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Thêm foreign key cho last_message_id sau khi tạo bảng private_messages
ALTER TABLE private_conversations
ADD CONSTRAINT fk_last_private_message
FOREIGN KEY (last_message_id) REFERENCES private_messages(id) ON DELETE SET NULL ON UPDATE CASCADE;
