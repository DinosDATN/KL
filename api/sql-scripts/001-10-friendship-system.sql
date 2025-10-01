USE lfysdb;

-- Bảng kết bạn (Friendships)
-- Quản lý trạng thái kết bạn giữa các người dùng
CREATE TABLE friendships (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    requester_id BIGINT NOT NULL, -- Người gửi lời mời kết bạn
    addressee_id BIGINT NOT NULL, -- Người nhận lời mời kết bạn
    status ENUM('pending', 'accepted', 'declined', 'blocked') NOT NULL DEFAULT 'pending',
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at DATETIME NULL, -- Thời gian phản hồi lời mời
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (addressee_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Đảm bảo không có hai mối quan hệ giống nhau giữa hai người dùng
    UNIQUE KEY unique_friendship (requester_id, addressee_id),
    
    -- Đảm bảo người dùng không thể kết bạn với chính mình
    CHECK (requester_id != addressee_id),
    
    INDEX idx_requester (requester_id),
    INDEX idx_addressee (addressee_id),
    INDEX idx_status (status),
    INDEX idx_requested_at (requested_at)
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng chặn người dùng (User Blocks)
-- Quản lý danh sách người dùng bị chặn
CREATE TABLE user_blocks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    blocker_id BIGINT NOT NULL, -- Người chặn
    blocked_id BIGINT NOT NULL, -- Người bị chặn
    reason TEXT NULL, -- Lý do chặn (tùy chọn)
    blocked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Đảm bảo không có hai bản ghi chặn giống nhau
    UNIQUE KEY unique_block (blocker_id, blocked_id),
    
    -- Đảm bảo người dùng không thể chặn chính mình
    CHECK (blocker_id != blocked_id),
    
    INDEX idx_blocker (blocker_id),
    INDEX idx_blocked (blocked_id),
    INDEX idx_blocked_at (blocked_at)
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng thông báo kết bạn (Friendship Notifications)
-- Quản lý thông báo liên quan đến kết bạn
CREATE TABLE friendship_notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL, -- Người nhận thông báo
    friendship_id BIGINT NOT NULL, -- Liên kết đến bảng friendships
    type ENUM('friend_request', 'friend_accepted', 'friend_declined') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    message TEXT NULL, -- Nội dung thông báo tùy chỉnh
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (friendship_id) REFERENCES friendships(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_friendship_id (friendship_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
