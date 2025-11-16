USE lfysdb;
-- Bảng Games
CREATE TABLE games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng Game_Levels 
CREATE TABLE game_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    level_number INT NOT NULL,
    difficulty ENUM('easy','medium','hard') DEFAULT 'easy',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE user_game_process (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    game_id INT NOT NULL,
    level_id INT NOT NULL,
    status ENUM('playing','completed') DEFAULT 'playing',
    score INT DEFAULT 0,
    time_spent INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (level_id) REFERENCES game_levels(id) ON DELETE CASCADE
)CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;