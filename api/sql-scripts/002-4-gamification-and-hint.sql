USE lfysdb;

-- Badge categories (5)
INSERT INTO badge_categories (name, description) VALUES
('Học tập', 'Huy hiệu cho thành tích học tập'),
('Giảng dạy', 'Huy hiệu cho người tạo nội dung'),
('Cộng đồng', 'Huy hiệu tương tác cộng đồng'),
('Cột mốc', 'Huy hiệu cột mốc quan trọng'),
('Sự kiện', 'Huy hiệu sự kiện đặc biệt');

-- Badges (30)
INSERT INTO badges (name, description, icon, rarity, category_id) VALUES
('Bắt đầu hành trình', 'Hoàn thành khóa học đầu tiên', 'begin.png', 'common', 1),
('Chăm học', 'Học 10 giờ trong tuần', 'study-10h.png', 'common', 1),
('Chăm chỉ', 'Duy trì streak 7 ngày', 'streak-7.png', 'rare', 1),
('Thành thạo cơ bản', 'Hoàn thành 10 khóa học', 'complete-10.png', 'rare', 1),
('Chuyên gia', 'Hoàn thành 25 khóa học', 'complete-25.png', 'epic', 1),
('Huyền thoại', 'Hoàn thành 50 khóa học', 'complete-50.png', 'legendary', 1),
('Giảng viên mới', 'Xuất bản khóa học đầu tiên', 'teacher-1.png', 'common', 2),
('Người truyền cảm hứng', 'Xuất bản 10 khóa học', 'teacher-10.png', 'rare', 2),
('Thầy cô xuất sắc', 'Đạt rating khóa học > 4.8', 'teacher-48.png', 'epic', 2),
('Nhà tổ chức', 'Tạo ra 5 sự kiện học tập', 'events-5.png', 'rare', 2),
('Bạn tốt', 'Giúp 10 người trong cộng đồng', 'help-10.png', 'common', 3),
('Ngôi sao diễn đàn', 'Bài viết đạt 100 upvotes', 'forum-100.png', 'rare', 3),
('Lãnh đạo', 'Trở thành moderator', 'mod.png', 'epic', 3),
('Cột mốc 5', 'Đạt level 5', 'lv5.png', 'common', 4),
('Cột mốc 10', 'Đạt level 10', 'lv10.png', 'rare', 4),
('Cột mốc 20', 'Đạt level 20', 'lv20.png', 'epic', 4),
('Cột mốc 30', 'Đạt level 30', 'lv30.png', 'legendary', 4),
('Sự kiện Xuân', 'Tham gia sự kiện học tập mùa xuân', 'spring.png', 'common', 5),
('Sự kiện Hè', 'Tham gia sự kiện học tập mùa hè', 'summer.png', 'common', 5),
('Sự kiện Thu', 'Tham gia sự kiện học tập mùa thu', 'autumn.png', 'common', 5),
('Sự kiện Đông', 'Tham gia sự kiện học tập mùa đông', 'winter.png', 'common', 5),
('Tốc độ', 'Hoàn thành bài trong thời gian kỷ lục', 'speed.png', 'epic', 1),
('Đêm trắng', 'Học sau 23:00', 'night.png', 'common', 1),
('Chim sớm', 'Học trước 06:00', 'early.png', 'common', 1),
('Cuối tuần chăm học', 'Học 6 giờ vào cuối tuần', 'weekend.png', 'rare', 1),
('Marathon', 'Học liên tục 6 giờ', 'marathon.png', 'epic', 1),
('Code sạch', 'Bài nộp được review 90/100', 'clean-code.png', 'rare', 1),
('Giỏi giao tiếp', 'Nhận 50 cảm ơn trong chat', 'chat-50.png', 'rare', 3),
('Top tuần', 'Top 1 bảng xếp hạng tuần', 'top-week.png', 'epic', 4),
('Top tháng', 'Top 1 bảng xếp hạng tháng', 'top-month.png', 'epic', 4);

-- Levels (30)
INSERT INTO levels (level, name, xp_required, xp_to_next, color, icon) VALUES
(1, 'Tập sự', 0, 100, '#9CA3AF', 'lv1.png'),
(2, 'Người học', 100, 150, '#60A5FA', 'lv2.png'),
(3, 'Học viên', 250, 200, '#34D399', 'lv3.png'),
(4, 'Thành viên', 450, 250, '#F59E0B', 'lv4.png'),
(5, 'Năng động', 700, 300, '#EF4444', 'lv5.png'),
(6, 'Chuyên cần', 1000, 350, '#8B5CF6', 'lv6.png'),
(7, 'Khá giỏi', 1350, 400, '#10B981', 'lv7.png'),
(8, 'Giỏi', 1750, 450, '#06B6D4', 'lv8.png'),
(9, 'Xuất sắc', 2200, 500, '#EC4899', 'lv9.png'),
(10, 'Cao thủ', 2700, 600, '#F97316', 'lv10.png'),
(11, 'Tinh thông', 3300, 650, '#22C55E', 'lv11.png'),
(12, 'Bậc thầy', 3950, 700, '#6366F1', 'lv12.png'),
(13, 'Chuyên gia', 4650, 750, '#84CC16', 'lv13.png'),
(14, 'Huyền thoại', 5400, 800, '#EAB308', 'lv14.png'),
(15, 'Siêu việt', 6200, 900, '#D946EF', 'lv15.png'),
(16, 'Tinh anh', 7100, 950, '#0EA5E9', 'lv16.png'),
(17, 'Kỳ cựu', 8050, 1000, '#16A34A', 'lv17.png'),
(18, 'Danh tiếng', 9050, 1100, '#F43F5E', 'lv18.png'),
(19, 'Bất bại', 10150, 1200, '#EA580C', 'lv19.png'),
(20, 'Thần tượng', 11350, 1300, '#4F46E5', 'lv20.png'),
(21, 'Tinh vân', 12650, 1400, '#059669', 'lv21.png'),
(22, 'Tối thượng', 14050, 1500, '#DB2777', 'lv22.png'),
(23, 'Siêu trí tuệ', 15550, 1600, '#2563EB', 'lv23.png'),
(24, 'Tối ưu', 17150, 1700, '#14B8A6', 'lv24.png'),
(25, 'Đỉnh cao', 18850, 1800, '#A855F7', 'lv25.png'),
(26, 'Bậc thầy tối thượng', 20650, 2000, '#84CC16', 'lv26.png'),
(27, 'Huyền thoại sống', 22650, 2200, '#F59E0B', 'lv27.png'),
(28, 'Bách chiến bách thắng', 24850, 2400, '#06B6D4', 'lv28.png'),
(29, 'Siêu huyền thoại', 27250, 2600, '#EF4444', 'lv29.png'),
(30, 'Vô cực', 29850, 0, '#111827', 'lv30.png');

-- Leaderboard weekly and monthly (40)
INSERT INTO leaderboard_entries (user_id, xp, type) VALUES
(1, 350, 'weekly'), (2, 980, 'weekly'), (3, 210, 'weekly'), (4, 1250, 'weekly'), (5, 870, 'weekly'),
(6, 190, 'weekly'), (7, 640, 'weekly'), (8, 720, 'weekly'), (9, 75, 'weekly'), (10, 520, 'weekly'),
(1, 2400, 'monthly'), (2, 3800, 'monthly'), (3, 920, 'monthly'), (4, 4100, 'monthly'), (5, 2650, 'monthly'),
(6, 760, 'monthly'), (7, 1800, 'monthly'), (8, 2100, 'monthly'), (9, 320, 'monthly'), (10, 1600, 'monthly');

-- Game stats (40)
INSERT INTO game_stats (user_id, level_id, next_level_id) VALUES
(1, 5, 6), (2, 10, 11), (3, 3, 4), (4, 12, 13), (5, 7, 8),
(6, 2, 3), (7, 6, 7), (8, 8, 9), (9, 1, 2), (10, 6, 7),
(11, 9, 10), (12, 3, 4), (13, 7, 8), (14, 12, 13), (15, 5, 6),
(16, 4, 5), (17, 8, 9), (18, 4, 5), (19, 7, 8), (20, 9, 10);

-- User badges (60)
INSERT INTO user_badges (user_id, badge_id, earned_at) VALUES
(1, 1, NOW()), (1, 2, NOW()), (1, 3, NOW()),
(2, 1, NOW()), (2, 4, NOW()), (2, 9, NOW()),
(3, 1, NOW()), (3, 2, NOW()), (3, 24, NOW()),
(4, 1, NOW()), (4, 5, NOW()), (4, 21, NOW()),
(5, 1, NOW()), (5, 22, NOW()), (5, 26, NOW()),
(6, 1, NOW()), (6, 23, NOW()), (6, 14, NOW()),
(7, 7, NOW()), (7, 8, NOW()), (7, 29, NOW()),
(8, 7, NOW()), (8, 10, NOW()), (8, 28, NOW()),
(9, 1, NOW()), (9, 24, NOW()), (9, 11, NOW()),
(10, 1, NOW()), (10, 2, NOW()), (10, 27, NOW());

-- Hints (35)
INSERT INTO hints (problem_id, content, coin_cost) VALUES
(1, 'Dùng hash map để lưu phần bù (target - num).', 10),
(2, 'Dùng hai con trỏ từ hai đầu, hoán đổi ký tự.', 8),
(3, 'Sử dụng stack, ánh xạ dấu đóng -> dấu mở.', 10),
(5, 'Kadane: dp[i] = max(a[i], dp[i-1]+a[i]).', 12),
(6, 'F(n) = F(n-1) + F(n-2), base n<=2.', 8),
(8, 'Sort và two pointers, nhớ bỏ qua duplicates.', 12),
(9, 'Sliding window với bảng vị trí ký tự.', 12),
(10, 'Two pointers, luôn dịch con trỏ thấp hơn.', 10),
(11, 'Sort string làm key để nhóm anagram.', 8),
(12, 'Sort theo start, merge nếu overlap.', 10),
(13, 'Transpose rồi đảo ngược từng hàng.', 10),
(14, 'Duy trì 4 biên và di chuyển theo vòng.', 12),
(15, 'Greedy: theo dõi vị trí xa nhất có thể tới.', 12),
(16, 'Tổ hợp: C(m+n-2, m-1).', 15),
(17, 'DP: grid[i][j]+=min(top,left).', 12),
(18, 'DP 2D hoặc rolling array.', 20),
(19, 'Tiền tố max trái/phải để tính nước.', 15),
(20, 'Binary search theo median k-th.', 25),
(21, 'Backtracking với cột và 2 đường chéo.', 15),
(22, 'BFS với đồ thị từ điển.', 15),
(23, 'Preorder với dấu null.', 12),
(24, 'Deque để lấy max O(1).', 15),
(25, 'DP với 2k trạng thái mua/bán.', 20),
(26, 'DP: minCut dựa trên palindrome DP.', 20),
(27, 'Hierholzer trên đồ thị Euler đường đi.', 18),
(28, 'Topo sort bằng BFS (Kahn).', 12),
(29, 'DP trên cây với 2 trạng thái chọn/không.', 15),
(30, 'Prefix và suffix product.', 10),
(31, 'Two pointers cho chuỗi xoay.', 12),
(32, 'Trie cho string matching nhanh.', 20),
(33, 'Binary lifting cho LCA.', 25),
(34, 'Segment tree cho range query.', 25),
(35, 'Union-Find cho kết nối thành phần.', 15);

-- User hint usage (40)
INSERT INTO user_hint_usage (user_id, hint_id, used_at) VALUES
(1, 1, NOW()), (1, 3, NOW()), (1, 10, NOW()),
(2, 5, NOW()), (2, 8, NOW()),
(3, 12, NOW()), (3, 15, NOW()),
(4, 18, NOW()), (4, 20, NOW()),
(5, 24, NOW()), (5, 26, NOW()),
(7, 2, NOW()), (7, 7, NOW());
