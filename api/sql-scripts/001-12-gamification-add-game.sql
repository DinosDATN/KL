-- Bảng Games
CREATE TABLE Games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL ON UPDATE CURRENT_TIMESTAMP,
);

-- Bảng Game_Levels 
CREATE TABLE Game_Levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    level_number INT NOT NULL,
    difficulty ENUM('easy','medium','hard') DEFAULT 'easy',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES Games(id) ON DELETE CASCADE
);

CREATE TABLE User_Game_Progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    game_id INT NOT NULL,
    level_id INT NOT NULL,
    status ENUM('playing','completed') DEFAULT 'playing',
    score INT DEFAULT 0,
    time_spent INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES Games(id) ON DELETE CASCADE,
    FOREIGN KEY (level_id) REFERENCES Game_Levels(id) ON DELETE CASCADE
);