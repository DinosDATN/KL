
USE lfysdb;

INSERT INTO games (name, description)
VALUES 
('Sudoku', 'Trò chơi điền số theo quy tắc 9x9 cổ điển');


INSERT INTO game_levels (game_id, level_number, difficulty)
VALUES 
(1, 1, 'easy'),
(1, 2, 'medium'),
(1, 3, 'hard');

