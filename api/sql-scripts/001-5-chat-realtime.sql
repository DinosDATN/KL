USE lfysdb;
-- Bảng phòng trò chuyện (Chat Rooms)
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

-- Bảng tin nhắn trong phòng trò chuyện (Chat Messages)
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

ALTER TABLE chat_rooms
ADD CONSTRAINT fk_last_message
FOREIGN KEY (last_message_id) REFERENCES chat_messages(id) ON DELETE SET NULL ON UPDATE CASCADE;


ALTER TABLE chat_messages
ADD COLUMN file_url VARCHAR(500) NULL AFTER type,
ADD COLUMN file_name VARCHAR(255) NULL AFTER file_url,
ADD COLUMN file_size BIGINT NULL AFTER file_name;

-- Add index for file_url for faster queries
CREATE INDEX idx_chat_messages_file_url ON chat_messages(file_url(255));