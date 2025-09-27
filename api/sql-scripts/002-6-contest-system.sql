USE lfysdb;

-- Contests (35 rows)
INSERT INTO contests (title, description, start_time, end_time, created_by) VALUES
('Cuộc thi Lập trình Mùa Xuân 2024', 'Thi đấu giải thuật cho sinh viên toàn quốc', '2024-03-15 09:00:00', '2024-03-15 12:00:00', 1),
('Weekly Contest #1', 'Thi tuần đầu tiên tháng 9', '2024-09-01 19:00:00', '2024-09-01 21:00:00', 2),
('Algorithm Marathon', 'Cuộc thi marathon giải thuật 5 tiếng', '2024-09-08 13:00:00', '2024-09-08 18:00:00', 3),
('Newbie Programming Contest', 'Cuộc thi dành cho người mới bắt đầu', '2024-09-15 10:00:00', '2024-09-15 12:30:00', 4),
('Advanced Data Structures', 'Thử thách cấu trúc dữ liệu nâng cao', '2024-09-22 14:00:00', '2024-09-22 17:00:00', 5),
('Dynamic Programming Challenge', 'Chuyên sâu về quy hoạch động', '2024-09-29 16:00:00', '2024-09-29 19:00:00', 6),
('Graph Theory Contest', 'Cuộc thi về lý thuyết đồ thị', '2024-10-06 11:00:00', '2024-10-06 14:00:00', 7),
('String Algorithms Battle', 'Chinh phục các thuật toán chuỗi', '2024-10-13 15:00:00', '2024-10-13 18:00:00', 8),
('Math Programming Contest', 'Lập trình toán học và số học', '2024-10-20 09:30:00', '2024-10-20 12:30:00', 9),
('Implementation Challenge', 'Thử thách khả năng cài đặt', '2024-10-27 20:00:00', '2024-10-27 22:30:00', 10),
('Greedy Algorithms Sprint', 'Tập trung thuật toán tham lam', '2024-11-03 08:00:00', '2024-11-03 11:00:00', 1),
('Binary Search Mastery', 'Thành thạo tìm kiếm nhị phân', '2024-11-10 18:00:00', '2024-11-10 20:00:00', 2),
('Tree Algorithms Contest', 'Thuật toán trên cây', '2024-11-17 13:30:00', '2024-11-17 16:30:00', 3),
('Sorting and Searching', 'Sắp xếp và tìm kiếm', '2024-11-24 10:15:00', '2024-11-24 13:15:00', 4),
('Bit Manipulation Expert', 'Chuyên gia thao tác bit', '2024-12-01 19:45:00', '2024-12-01 22:15:00', 5),
('Number Theory Deep Dive', 'Khám phá lý thuyết số', '2024-12-08 14:30:00', '2024-12-08 17:30:00', 6),
('Combinatorics Challenge', 'Thử thách tổ hợp', '2024-12-15 11:45:00', '2024-12-15 14:45:00', 7),
('Geometry Programming', 'Lập trình hình học', '2024-12-22 16:20:00', '2024-12-22 19:20:00', 8),
('Shortest Path Contest', 'Cuộc thi đường đi ngắn nhất', '2024-12-29 12:10:00', '2024-12-29 15:10:00', 9),
('Network Flow Challenge', 'Thử thách luồng mạng', '2025-01-05 17:35:00', '2025-01-05 20:35:00', 10),
('Segment Tree Mastery', 'Thành thạo cây phân đoạn', '2025-01-12 09:25:00', '2025-01-12 12:25:00', 1),
('Fenwick Tree Contest', 'Cuộc thi cây Fenwick', '2025-01-19 21:15:00', '2025-01-19 23:45:00', 2),
('Trie Data Structure', 'Cấu trúc dữ liệu Trie', '2025-01-26 15:50:00', '2025-01-26 18:50:00', 3),
('Union Find Challenge', 'Thử thách Union Find', '2025-02-02 08:40:00', '2025-02-02 11:40:00', 4),
('Hash Table Expert', 'Chuyên gia bảng băm', '2025-02-09 13:05:00', '2025-02-09 16:05:00', 5),
('Stack and Queue Mastery', 'Thành thạo ngăn xếp và hàng đợi', '2025-02-16 18:30:00', '2025-02-16 21:30:00', 6),
('Heap Operations Contest', 'Cuộc thi thao tác heap', '2025-02-23 10:45:00', '2025-02-23 13:45:00', 7),
('Advanced Graph Algorithms', 'Thuật toán đồ thị nâng cao', '2025-03-02 14:55:00', '2025-03-02 17:55:00', 8),
('String Matching Expert', 'Chuyên gia so khớp chuỗi', '2025-03-09 19:20:00', '2025-03-09 22:20:00', 9),
('Backtracking Challenge', 'Thử thách quay lui', '2025-03-16 11:35:00', '2025-03-16 14:35:00', 10),
('Divide and Conquer', 'Chia để trị', '2025-03-23 16:10:00', '2025-03-23 19:10:00', 1),
('Two Pointers Technique', 'Kỹ thuật hai con trỏ', '2025-03-30 12:25:00', '2025-03-30 15:25:00', 2),
('Sliding Window Problems', 'Bài toán cửa sổ trượt', '2025-04-06 17:40:00', '2025-04-06 20:40:00', 3),
('Prefix Sum Mastery', 'Thành thạo tổng tiền tố', '2025-04-13 09:15:00', '2025-04-13 12:15:00', 4),
('Matrix Operations Contest', 'Cuộc thi thao tác ma trận', '2025-04-20 20:50:00', '2025-04-20 23:20:00', 5);

-- Contest Problems (150 rows - assuming problems 1-35 exist)
INSERT INTO contest_problems (contest_id, problem_id, score) VALUES
-- Contest 1 (5 problems)
(1, 1, 100), (1, 5, 120), (1, 8, 150), (1, 12, 180), (1, 19, 200),
-- Contest 2 (4 problems)
(2, 2, 80), (2, 9, 100), (2, 15, 120), (2, 21, 140),
-- Contest 3 (6 problems)
(3, 3, 90), (3, 6, 110), (3, 13, 130), (3, 17, 160), (3, 24, 180), (3, 30, 220),
-- Contest 4 (3 problems)
(4, 4, 60), (4, 10, 80), (4, 16, 100),
-- Contest 5 (5 problems)
(5, 7, 110), (5, 14, 130), (5, 22, 150), (5, 28, 170), (5, 33, 200),
-- Contest 6 (4 problems)
(6, 11, 100), (6, 18, 120), (6, 25, 140), (6, 31, 160),
-- Contest 7 (5 problems)
(7, 20, 95), (7, 23, 115), (7, 26, 135), (7, 29, 155), (7, 32, 185),
-- Contest 8 (4 problems)
(8, 27, 105), (8, 34, 125), (8, 35, 145), (8, 1, 85),
-- Contest 9 (3 problems)
(9, 2, 70), (9, 3, 90), (9, 4, 110),
-- Contest 10 (4 problems)
(10, 5, 85), (10, 6, 105), (10, 7, 125), (10, 8, 145),
-- Contest 11 (5 problems)
(11, 9, 90), (11, 10, 110), (11, 11, 130), (11, 12, 150), (11, 13, 170),
-- Contest 12 (3 problems)
(12, 14, 75), (12, 15, 95), (12, 16, 115),
-- Contest 13 (4 problems)
(13, 17, 100), (13, 18, 120), (13, 19, 140), (13, 20, 160),
-- Contest 14 (4 problems)
(14, 21, 85), (14, 22, 105), (14, 23, 125), (14, 24, 145),
-- Contest 15 (3 problems)
(15, 25, 90), (15, 26, 110), (15, 27, 130),
-- Contest 16 (5 problems)
(16, 28, 95), (16, 29, 115), (16, 30, 135), (16, 31, 155), (16, 32, 175),
-- Contest 17 (4 problems)
(17, 33, 100), (17, 34, 120), (17, 35, 140), (17, 1, 80),
-- Contest 18 (3 problems)
(18, 2, 65), (18, 3, 85), (18, 4, 105),
-- Contest 19 (4 problems)
(19, 5, 90), (19, 6, 110), (19, 7, 130), (19, 8, 150),
-- Contest 20 (5 problems)
(20, 9, 85), (20, 10, 105), (20, 11, 125), (20, 12, 145), (20, 13, 165),
-- Contest 21 (3 problems)
(21, 14, 80), (21, 15, 100), (21, 16, 120),
-- Contest 22 (4 problems)
(22, 17, 95), (22, 18, 115), (22, 19, 135), (22, 20, 155),
-- Contest 23 (4 problems)
(23, 21, 90), (23, 22, 110), (23, 23, 130), (23, 24, 150),
-- Contest 24 (3 problems)
(24, 25, 85), (24, 26, 105), (24, 27, 125),
-- Contest 25 (5 problems)
(25, 28, 100), (25, 29, 120), (25, 30, 140), (25, 31, 160), (25, 32, 180),
-- Contest 26 (4 problems)
(26, 33, 95), (26, 34, 115), (26, 35, 135), (26, 1, 75),
-- Contest 27 (3 problems)
(27, 2, 70), (27, 3, 90), (27, 4, 110),
-- Contest 28 (4 problems)
(28, 5, 85), (28, 6, 105), (28, 7, 125), (28, 8, 145),
-- Contest 29 (4 problems)
(29, 9, 80), (29, 10, 100), (29, 11, 120), (29, 12, 140),
-- Contest 30 (3 problems)
(30, 13, 75), (30, 14, 95), (30, 15, 115),
-- Contest 31 (5 problems)
(31, 16, 90), (31, 17, 110), (31, 18, 130), (31, 19, 150), (31, 20, 170),
-- Contest 32 (4 problems)
(32, 21, 85), (32, 22, 105), (32, 23, 125), (32, 24, 145),
-- Contest 33 (3 problems)
(33, 25, 80), (33, 26, 100), (33, 27, 120),
-- Contest 34 (4 problems)
(34, 28, 95), (34, 29, 115), (34, 30, 135), (34, 31, 155),
-- Contest 35 (5 problems)
(35, 32, 100), (35, 33, 120), (35, 34, 140), (35, 35, 160), (35, 1, 85);

-- User Contests (cleaned)
INSERT INTO user_contests (contest_id, user_id) VALUES
-- Contest 1 participants (12 users)
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10), (1, 11), (1, 12),
-- Contest 2 participants (8 users)
(2, 2), (2, 5), (2, 8), (2, 11), (2, 14), (2, 17), (2, 20), (2, 23),
-- Contest 3 participants (15 users)
(3, 1), (3, 3), (3, 6), (3, 9), (3, 12), (3, 15), (3, 18), (3, 21), (3, 24), (3, 27), (3, 30), (3, 33), (3, 36), (3, 39), (3, 42),
-- Contest 4 participants (6 users)
(4, 4), (4, 7), (4, 13), (4, 16), (4, 19), (4, 22),
-- Contest 5 participants (8 users)
(5, 5), (5, 10), (5, 15), (5, 20), (5, 25), (5, 30), (5, 35), (5, 40),
-- Contest 6 participants (8 users)
(6, 6), (6, 12), (6, 18), (6, 24), (6, 29), (6, 34), (6, 38), (6, 43),
-- Contest 7 participants (11 users)
(7, 7), (7, 14), (7, 21), (7, 28), (7, 35), (7, 41), (7, 36), (7, 2), (7, 9), (7, 16), (7, 23),
-- Contest 8 participants (6 users)
(8, 8), (8, 15), (8, 22), (8, 29), (8, 36), (8, 3),
-- Contest 9 participants (5 users)
(9, 9), (9, 17), (9, 25), (9, 33), (9, 40),
-- Contest 10 participants (9 users)
(10, 10), (10, 19), (10, 28), (10, 37), (10, 35), (10, 1), (10, 11), (10, 21), (10, 31),
-- Contest 11 participants (11 users)
(11, 11), (11, 20), (11, 30), (11, 39), (11, 38), (11, 4), (11, 13), (11, 22), (11, 32), (11, 5), (11, 15),
-- Contest 12 participants (5 users)
(12, 12), (12, 24), (12, 36), (12, 8), (12, 18),
-- Contest 13 participants (9 users)
(13, 13), (13, 26), (13, 38), (13, 49), (13, 7), (13, 17), (13, 27), (13, 37), (13, 36),
-- Contest 14 participants (7 users)
(14, 14), (14, 27), (14, 40), (14, 6), (14, 16), (14, 26), (14, 35),
-- Contest 15 participants (6 users)
(15, 15), (15, 28), (15, 9), (15, 19), (15, 29), (15, 39),
-- Contest 16 participants (9 users)
(16, 16), (16, 31), (16, 2), (16, 12), (16, 22), (16, 32), (16, 10), (16, 20), (16, 30),
-- Contest 17 participants (9 users)
(17, 17), (17, 33), (17, 35), (17, 3), (17, 13), (17, 23), (17, 34), (17, 11), (17, 21),
-- Contest 18 participants (6 users)
(18, 18), (18, 35), (18, 38), (18, 4), (18, 14), (18, 24),
-- Contest 19 participants (7 users)
(19, 19), (19, 37), (19, 40), (19, 5), (19, 15), (19, 25), (19, 36),
-- Contest 20 participants (9 users)
(20, 20), (20, 38), (20, 1), (20, 6), (20, 16), (20, 26), (20, 37), (20, 8), (20, 18),
-- Contest 21 participants (6 users)
(21, 21), (21, 39), (21, 7), (21, 17), (21, 27), (21, 38),
-- Contest 22 participants (7 users)
(22, 22), (22, 9), (22, 19), (22, 29), (22, 40), (22, 2), (22, 12),
-- Contest 23 participants (6 users)
(23, 23), (23, 10), (23, 20), (23, 31), (23, 40), (23, 3),
-- Contest 24 participants (4 users)
(24, 24), (24, 11), (24, 32), (24, 4),
-- Contest 25 participants (9 users)
(25, 25), (25, 13), (25, 23), (25, 33), (25, 5), (25, 15), (25, 26), (25, 36), (25, 6),
-- Contest 26 participants (8 users)
(26, 26), (26, 35), (26, 14), (26, 24), (26, 34), (26, 7), (26, 17), (26, 27),
-- Contest 27 participants (7 users)
(27, 27), (27, 36), (27, 16), (27, 25), (27, 35), (27, 8), (27, 18),
-- Contest 28 participants (8 users)
(28, 28), (28, 47), (28, 17), (28, 37), (28, 9), (28, 19), (28, 29), (28, 39),
-- Contest 29 participants (7 users)
(29, 29), (29, 38), (29, 19), (29, 30), (29, 10), (29, 20), (29, 31),
-- Contest 30 participants (5 users)
(30, 30), (30, 21), (30, 32), (30, 40), (30, 11),
-- Contest 31 participants (9 users)
(31, 31), (31, 40), (31, 22), (31, 33), (31, 41), (31, 12), (31, 23), (31, 34), (31, 1),
-- Contest 32 participants (7 users)
(32, 32), (32, 1), (32, 24), (32, 35), (32, 13), (32, 25), (32, 36),
-- Contest 33 participants (6 users)
(33, 33), (33, 2), (33, 26), (33, 37), (33, 14), (33, 27),
-- Contest 34 participants (9 users)
(34, 34), (34, 3), (34, 28), (34, 38), (34, 35), (34, 15), (34, 29), (34, 39), (34, 36),
-- Contest 35 participants (9 users)
(35, 35), (35, 4), (35, 30), (35, 40), (35, 16), (35, 31), (35, 38), (35, 5), (35, 17);


-- Contest Submissions (200 rows - assuming submission_codes 1-50 exist)
INSERT INTO contest_submissions (user_id, contest_problem_id, code_id, language, status, score) VALUES
-- Contest 1 submissions
(1, 1, 1, 'cpp', 'accepted', 100), (1, 2, 2, 'cpp', 'wrong', 0), (1, 3, 3, 'python', 'accepted', 150),
(2, 1, 4, 'java', 'accepted', 100), (2, 4, 5, 'cpp', 'error', 0),
(3, 2, 6, 'python', 'accepted', 120), (3, 3, 7, 'cpp', 'wrong', 50), (3, 5, 8, 'java', 'accepted', 200),
(4, 1, 9, 'cpp', 'wrong', 30), (4, 4, 10, 'python', 'accepted', 180),
(5, 3, 11, 'cpp', 'accepted', 150), (5, 5, 12, 'java', 'wrong', 0);
/* -- Contest 2 submissions
(2, 6, 13, 'python', 'accepted', 80), (2, 7, 14, 'cpp', 'accepted', 100),
(5, 6, 15, 'java', 'wrong', 20), (5, 8, 16, 'cpp', 'accepted', 120),
(8, 7, 17, 'python', 'accepted', 100), (8, 9, 18, 'cpp', 'error', 0),
(11, 6, 19, 'cpp', 'accepted', 80), (11, 8, 20, 'java', 'wrong', 40),
-- Contest 3 submissions
(1, 10, 21, 'cpp', 'accepted', 90), (1, 11, 22, 'python', 'wrong', 30),
(3, 10, 23, 'java', 'accepted', 90), (3, 12, 24, 'cpp', 'accepted', 130), (3, 14, 25, 'python', 'wrong', 60),
(6, 11, 26, 'cpp', 'accepted', 110), (6, 13, 27, 'java', 'error', 0),
(9, 10, 28, 'python', 'wrong', 45), (9, 15, 29, 'cpp', 'accepted', 220),
(12, 12, 30, 'java', 'accepted', 130), (12, 14, 31, 'cpp', 'wrong', 80),
-- Contest 4 submissions
(4, 16, 32, 'python', 'accepted', 60), (4, 17, 33, 'cpp', 'wrong', 25),
(7, 16, 34, 'java', 'accepted', 60), (7, 18, 35, 'cpp', 'accepted', 100),
(13, 17, 36, 'python', 'wrong', 40), (13, 18, 37, 'cpp', 'accepted', 100),
-- Contest 5 submissions
(5, 19, 38, 'cpp', 'accepted', 110), (5, 20, 39, 'java', 'wrong', 35),
(10, 19, 40, 'python', 'wrong', 55), (10, 21, 41, 'cpp', 'accepted', 150),
(15, 20, 42, 'java', 'accepted', 130), (15, 22, 43, 'cpp', 'error', 0),
(20, 19, 44, 'python', 'accepted', 110), (20, 23, 45, 'cpp', 'wrong', 70),
-- Contest 6 submissions
(6, 24, 46, 'cpp', 'accepted', 100), (6, 25, 47, 'java', 'wrong', 40),
(12, 24, 48, 'python', 'wrong', 30), (12, 26, 49, 'cpp', 'accepted', 140),
(18, 25, 50, 'java', 'accepted', 120), (18, 27, 1, 'cpp', 'error', 0),
-- Contest 7 submissions
(7, 28, 2, 'python', 'accepted', 95), (7, 29, 3, 'cpp', 'wrong', 45),
(14, 28, 4, 'java', 'wrong', 38), (14, 30, 5, 'python', 'accepted', 135),
(21, 29, 6, 'cpp', 'accepted', 115), (21, 31, 7, 'java', 'wrong', 65),
-- Contest 8 submissions
(8, 33, 8, 'cpp', 'accepted', 105), (8, 34, 9, 'python', 'error', 0),
(15, 33, 10, 'java', 'wrong', 52), (15, 35, 11, 'cpp', 'accepted', 145),
(22, 34, 12, 'python', 'accepted', 125), (22, 36, 13, 'cpp', 'wrong', 42),
-- Contest 9 submissions
(9, 37, 14, 'java', 'accepted', 70), (9, 38, 15, 'cpp', 'wrong', 35),
(17, 37, 16, 'python', 'wrong', 28), (17, 39, 17, 'java', 'accepted', 110),
(25, 38, 18, 'cpp', 'accepted', 90), (25, 39, 19, 'python', 'error', 0),
-- Contest 10 submissions
(10, 40, 20, 'cpp', 'accepted', 85), (10, 41, 21, 'java', 'wrong', 50),
(19, 40, 22, 'python', 'wrong', 34), (19, 42, 23, 'cpp', 'accepted', 125),
(28, 41, 24, 'java', 'accepted', 105), (28, 43, 25, 'python', 'error', 0),
-- More submissions for other contests
(11, 44, 26, 'cpp', 'accepted', 90), (11, 45, 27, 'java', 'wrong', 44),
(20, 44, 28, 'python', 'accepted', 90), (20, 46, 29, 'cpp', 'wrong', 58),
(12, 50, 30, 'java', 'accepted', 75), (12, 51, 31, 'cpp', 'error', 0),
(24, 50, 32, 'python', 'wrong', 38), (24, 52, 33, 'java', 'accepted', 115),
(13, 53, 34, 'cpp', 'accepted', 100), (13, 54, 35, 'python', 'wrong', 48),
(26, 53, 36, 'java', 'wrong', 40), (26, 55, 37, 'cpp', 'accepted', 140),
(14, 56, 38, 'python', 'accepted', 85), (14, 57, 39, 'java', 'error', 0),
(27, 56, 40, 'cpp', 'wrong', 34), (27, 58, 41, 'python', 'accepted', 145),
(15, 59, 42, 'java', 'accepted', 90), (15, 60, 43, 'cpp', 'wrong', 41),
(28, 59, 44, 'python', 'wrong', 36), (28, 61, 45, 'java', 'accepted', 130),
(16, 62, 46, 'cpp', 'accepted', 100), (16, 63, 47, 'python', 'error', 0),
(31, 62, 48, 'java', 'wrong', 48), (31, 64, 49, 'cpp', 'accepted', 160),
(17, 65, 50, 'python', 'accepted', 95), (17, 66, 1, 'java', 'wrong', 46),
(33, 65, 2, 'cpp', 'wrong', 38), (33, 67, 3, 'python', 'accepted', 135),
(18, 68, 4, 'java', 'accepted', 65), (18, 69, 5, 'cpp', 'error', 0),
(35, 68, 6, 'python', 'wrong', 26), (35, 70, 7, 'java', 'accepted', 105),
(19, 71, 8, 'cpp', 'accepted', 90), (19, 72, 9, 'python', 'wrong', 44),
(37, 71, 10, 'java', 'wrong', 36), (37, 73, 11, 'cpp', 'accepted', 130),
(20, 74, 12, 'python', 'accepted', 85), (20, 75, 13, 'java', 'error', 0),
(38, 74, 14, 'cpp', 'wrong', 34), (38, 76, 15, 'python', 'accepted', 145); */
