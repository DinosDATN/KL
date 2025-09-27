USE lfysdb;

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
