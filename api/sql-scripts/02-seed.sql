-- ===============================
-- 📚 DATABASE: L-FYS (Learn For Yourself) - SEED DATA
-- ===============================
-- This file contains comprehensive sample data for all tables in the L-FYS database
-- Execute this after running 01-schema.sql

USE lfysdb;

SET FOREIGN_KEY_CHECKS = 0;

-- ===============================
-- I. USERS & AUTHENTICATION
-- ===============================
-- Insert sample users
INSERT INTO users (id, name, email, password, avatar_url, role, is_active, is_online, last_seen_at, subscription_status, subscription_end_date, created_at, updated_at) VALUES
(1, 'Nguyễn Văn Admin', 'admin@lfys.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://i.pravatar.cc/150?img=1', 'admin', TRUE, FALSE, '2024-01-15 10:30:00', 'premium', '2024-12-31', NOW(), NOW()),
(2, 'Lê Thị Mai', 'mai.le@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://i.pravatar.cc/150?img=2', 'creator', TRUE, TRUE, '2024-01-15 14:22:00', 'premium', '2024-11-30', NOW(), NOW()),
(3, 'Trần Văn Học', 'hoc.tran@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://i.pravatar.cc/150?img=3', 'user', TRUE, TRUE, '2024-01-15 16:45:00', 'free', NULL, NOW(), NOW()),
(4, 'Phạm Thị Linh', 'linh.pham@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://i.pravatar.cc/150?img=4', 'creator', TRUE, FALSE, '2024-01-14 09:15:00', 'free', NULL, NOW(), NOW()),
(5, 'Hoàng Minh Tuấn', 'tuan.hoang@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://i.pravatar.cc/150?img=5', 'user', TRUE, TRUE, '2024-01-15 13:20:00', 'premium', '2024-10-15', NOW(), NOW()),
(6, 'Đỗ Thị Hương', 'huong.do@example.com', NULL, 'https://i.pravatar.cc/150?img=6', 'user', TRUE, FALSE, '2024-01-13 20:30:00', 'free', NULL, NOW(), NOW()),
(7, 'Vũ Văn Đức', 'duc.vu@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://i.pravatar.cc/150?img=7', 'user', TRUE, TRUE, '2024-01-15 11:45:00', 'free', NULL, NOW(), NOW()),
(8, 'Ngô Thị Lan', 'lan.ngo@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://i.pravatar.cc/150?img=8', 'creator', TRUE, TRUE, '2024-01-15 15:10:00', 'premium', '2024-09-20', NOW(), NOW()),
(9, 'Bùi Văn Nam', 'nam.bui@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://i.pravatar.cc/150?img=9', 'user', TRUE, FALSE, '2024-01-12 18:20:00', 'free', NULL, NOW(), NOW()),
(10, 'Lý Thị Hoa', 'hoa.ly@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://i.pravatar.cc/150?img=10', 'user', TRUE, TRUE, '2024-01-15 12:35:00', 'free', NULL, NOW(), NOW());

-- Insert user profiles
INSERT INTO user_profiles (id, user_id, bio, birthday, gender, phone, address, website_url, github_url, linkedin_url, preferred_language, theme_mode, layout, notifications, visibility_profile, visibility_achievements, visibility_progress, visibility_activity, created_at, updated_at) VALUES
(1, 1, 'Quản trị viên hệ thống L-FYS. Đam mê công nghệ và giáo dục.', '1990-05-15', 'male', '+84901234567', 'Hà Nội, Việt Nam', 'https://lfys.com', 'https://github.com/admin', 'https://linkedin.com/in/admin', 'vi', 'dark', 'expanded', TRUE, TRUE, TRUE, TRUE, FALSE, NOW(), NOW()),
(2, 2, 'Giảng viên lập trình với 5 năm kinh nghiệm. Chuyên về Python và Machine Learning.', '1988-03-22', 'female', '+84902345678', 'TP.HCM, Việt Nam', 'https://maile.dev', 'https://github.com/maile', 'https://linkedin.com/in/maile', 'vi', 'light', 'expanded', TRUE, TRUE, TRUE, TRUE, TRUE, NOW(), NOW()),
(3, 3, 'Sinh viên năm 3 ngành Công nghệ thông tin. Yêu thích học hỏi và thử thách bản thân.', '2002-07-10', 'male', '+84903456789', 'Đà Nẵng, Việt Nam', NULL, 'https://github.com/hoctran', NULL, 'vi', 'system', 'compact', TRUE, TRUE, TRUE, FALSE, FALSE, NOW(), NOW()),
(4, 4, 'Kỹ sư phần mềm với đam mê chia sẻ kiến thức. Chuyên về JavaScript và React.', '1992-11-08', 'female', '+84904567890', 'Hà Nội, Việt Nam', 'https://linhpham.tech', 'https://github.com/linhpham', 'https://linkedin.com/in/linhpham', 'vi', 'light', 'expanded', TRUE, TRUE, TRUE, TRUE, FALSE, NOW(), NOW()),
(5, 5, 'Lập trình viên full-stack. Thích khám phá các công nghệ mới và giải quyết vấn đề phức tạp.', '1995-12-03', 'male', '+84905678901', 'Hải Phòng, Việt Nam', NULL, 'https://github.com/tuanhoang', 'https://linkedin.com/in/tuanhoang', 'vi', 'dark', 'expanded', TRUE, FALSE, TRUE, TRUE, TRUE, NOW(), NOW()),
(6, 6, 'Nhà thiết kế UX/UI với niềm đam mê tạo ra trải nghiệm người dùng tuyệt vời.', '1993-09-18', 'female', '+84906789012', 'Cần Thơ, Việt Nam', 'https://huongdo.design', NULL, 'https://linkedin.com/in/huongdo', 'vi', 'light', 'compact', FALSE, TRUE, FALSE, FALSE, FALSE, NOW(), NOW()),
(7, 7, 'Chuyên gia DevOps với kinh nghiệm triển khai hệ thống quy mô lớn.', '1991-01-25', 'male', '+84907890123', 'Hà Nội, Việt Nam', NULL, 'https://github.com/ducvu', 'https://linkedin.com/in/ducvu', 'vi', 'dark', 'expanded', TRUE, TRUE, TRUE, TRUE, FALSE, NOW(), NOW()),
(8, 8, 'Nhà phát triển mobile với chuyên môn về Flutter và React Native.', '1994-06-12', 'female', '+84908901234', 'TP.HCM, Việt Nam', 'https://lanngo.dev', 'https://github.com/lanngo', 'https://linkedin.com/in/lanngo', 'vi', 'system', 'expanded', TRUE, TRUE, TRUE, FALSE, TRUE, NOW(), NOW()),
(9, 9, 'Sinh viên cuối khóa ngành CNTT. Đang tìm hiểu về AI và Data Science.', '2001-04-30', 'male', '+84909012345', 'Huế, Việt Nam', NULL, 'https://github.com/nambu', NULL, 'vi', 'light', 'compact', TRUE, TRUE, FALSE, TRUE, FALSE, NOW(), NOW()),
(10, 10, 'Tester QA với kinh nghiệm kiểm thử tự động và manual testing.', '1996-08-14', 'female', '+84900123456', 'Vũng Tàu, Việt Nam', NULL, 'https://github.com/hoaly', 'https://linkedin.com/in/hoaly', 'vi', 'light', 'expanded', TRUE, FALSE, TRUE, TRUE, FALSE, NOW(), NOW());

-- Insert user stats
INSERT INTO user_stats (id, user_id, xp, level, rank, courses_completed, hours_learned, problems_solved, current_streak, longest_streak, average_score, created_at, updated_at) VALUES
(1, 1, 15000, 15, 1, 25, 500, 150, 30, 45, 92.5, NOW(), NOW()),
(2, 2, 12000, 12, 2, 20, 400, 120, 25, 35, 89.0, NOW(), NOW()),
(3, 3, 3500, 5, 15, 8, 120, 45, 7, 12, 78.5, NOW(), NOW()),
(4, 4, 8500, 9, 5, 15, 280, 85, 15, 22, 85.0, NOW(), NOW()),
(5, 5, 6200, 7, 8, 12, 210, 68, 12, 18, 81.2, NOW(), NOW()),
(6, 6, 2100, 3, 25, 5, 80, 25, 3, 8, 72.8, NOW(), NOW()),
(7, 7, 9800, 10, 4, 18, 350, 95, 18, 28, 87.3, NOW(), NOW()),
(8, 8, 7400, 8, 6, 14, 240, 72, 14, 20, 83.6, NOW(), NOW()),
(9, 9, 1800, 2, 30, 3, 60, 18, 2, 5, 68.4, NOW(), NOW()),
(10, 10, 4600, 6, 12, 10, 150, 55, 8, 15, 79.9, NOW(), NOW());

-- Insert user goals
INSERT INTO user_goals (id, user_id, title, description, target, current, unit, deadline, category, created_at, updated_at) VALUES
(1, 3, 'Hoàn thành 10 khóa học', 'Mục tiêu hoàn thành 10 khóa học trong 6 tháng', 10, 8, 'courses', '2024-07-15', 'learning', NOW(), NOW()),
(2, 3, 'Giải 100 bài tập', 'Giải quyết 100 bài tập lập trình', 100, 45, 'problems', '2024-06-30', 'practice', NOW(), NOW()),
(3, 5, 'Học 200 giờ', 'Dành 200 giờ để học lập trình', 200, 120, 'hours', '2024-08-01', 'learning', NOW(), NOW()),
(4, 9, 'Đạt level 5', 'Nâng cấp lên level 5', 5, 2, 'level', '2024-05-01', 'achievement', NOW(), NOW()),
(5, 10, 'Streak 30 ngày', 'Duy trì streak học tập 30 ngày', 30, 8, 'days', '2024-04-15', 'learning', NOW(), NOW());

-- Insert achievements
INSERT INTO achievements (id, title, description, icon, category, rarity, created_at, updated_at) VALUES
(1, 'First Step', 'Hoàn thành bài học đầu tiên', 'first-step.png', 'learning', 'common', NOW(), NOW()),
(2, 'Problem Solver', 'Giải 10 bài tập', 'problem-solver.png', 'learning', 'common', NOW(), NOW()),
(3, 'Course Completer', 'Hoàn thành khóa học đầu tiên', 'course-complete.png', 'learning', 'rare', NOW(), NOW()),
(4, 'Streak Master', 'Duy trì streak 30 ngày', 'streak-master.png', 'milestone', 'epic', NOW(), NOW()),
(5, 'Knowledge Sharer', 'Tạo khóa học đầu tiên', 'knowledge-sharer.png', 'teaching', 'rare', NOW(), NOW()),
(6, 'Community Helper', 'Giúp đỡ 50 học viên khác', 'community-helper.png', 'community', 'epic', NOW(), NOW()),
(7, 'Expert Coder', 'Giải 100 bài tập', 'expert-coder.png', 'learning', 'legendary', NOW(), NOW()),
(8, 'Mentor', 'Có 100 học viên theo dõi', 'mentor.png', 'teaching', 'legendary', NOW(), NOW());

-- Insert user achievements
INSERT INTO user_achievements (id, user_id, achievement_id, date_earned, created_at, updated_at) VALUES
(1, 1, 1, '2023-01-15', NOW(), NOW()),
(2, 1, 2, '2023-01-20', NOW(), NOW()),
(3, 1, 3, '2023-02-01', NOW(), NOW()),
(4, 1, 4, '2023-03-15', NOW(), NOW()),
(5, 1, 5, '2023-04-01', NOW(), NOW()),
(6, 1, 6, '2023-06-01', NOW(), NOW()),
(7, 2, 1, '2023-02-01', NOW(), NOW()),
(8, 2, 2, '2023-02-10', NOW(), NOW()),
(9, 2, 3, '2023-02-25', NOW(), NOW()),
(10, 2, 5, '2023-03-10', NOW(), NOW()),
(11, 3, 1, '2023-12-01', NOW(), NOW()),
(12, 3, 2, '2023-12-15', NOW(), NOW()),
(13, 4, 1, '2023-06-01', NOW(), NOW()),
(14, 4, 2, '2023-06-10', NOW(), NOW()),
(15, 4, 3, '2023-06-30', NOW(), NOW()),
(16, 5, 1, '2023-08-01', NOW(), NOW()),
(17, 5, 2, '2023-08-15', NOW(), NOW());

-- Insert user activity log
INSERT INTO user_activity_log (id, user_id, type, title, description, date, duration, created_at, updated_at) VALUES
(1, 3, 'course_started', 'Bắt đầu khóa Python cơ bản', 'Đã bắt đầu học khóa học Python cho người mới bắt đầu', '2024-01-15', NULL, NOW(), NOW()),
(2, 3, 'quiz_taken', 'Hoàn thành quiz Python Variables', 'Đạt điểm 85/100 trong quiz về biến trong Python', '2024-01-15', 15, NOW(), NOW()),
(3, 3, 'problem_solved', 'Giải bài Two Sum', 'Hoàn thành bài tập Two Sum với độ khó Easy', '2024-01-14', 25, NOW(), NOW()),
(4, 5, 'course_completed', 'Hoàn thành JavaScript Fundamentals', 'Đã hoàn thành toàn bộ khóa học JavaScript cơ bản', '2024-01-13', 180, NOW(), NOW()),
(5, 5, 'badge_earned', 'Nhận huy hiệu Course Completer', 'Được tặng huy hiệu sau khi hoàn thành khóa học đầu tiên', '2024-01-13', NULL, NOW(), NOW()),
(6, 2, 'course_published', 'Xuất bản khóa React Hooks', 'Đã xuất bản khóa học React Hooks Advanced', '2024-01-12', NULL, NOW(), NOW()),
(7, 7, 'problem_solved', 'Giải bài Binary Search', 'Hoàn thành bài tập Binary Search với độ khó Medium', '2024-01-11', 45, NOW(), NOW()),
(8, 10, 'course_started', 'Bắt đầu khóa Testing Fundamentals', 'Đã bắt đầu học khóa học Testing cơ bản', '2024-01-10', NULL, NOW(), NOW());

-- ===============================
-- COURSE CATEGORIES & COURSES
-- ===============================
-- Insert course categories
INSERT INTO course_categories (id, name, description, created_at, updated_at) VALUES
(1, 'Programming', 'Khóa học lập trình các ngôn ngữ khác nhau', NOW(), NOW()),
(2, 'Web Development', 'Phát triển web frontend và backend', NOW(), NOW()),
(3, 'Mobile Development', 'Phát triển ứng dụng di động', NOW(), NOW()),
(4, 'Data Science', 'Khoa học dữ liệu và phân tích', NOW(), NOW()),
(5, 'Machine Learning', 'Học máy và trí tuệ nhân tạo', NOW(), NOW()),
(6, 'DevOps', 'Vận hành và triển khai hệ thống', NOW(), NOW()),
(7, 'Database', 'Cơ sở dữ liệu và quản trị', NOW(), NOW()),
(8, 'Cybersecurity', 'An ninh mạng và bảo mật', NOW(), NOW());

-- Insert courses
INSERT INTO courses (id, instructor_id, title, thumbnail, publish_date, status, revenue, students, rating, description, level, duration, category_id, is_premium, is_deleted, price, original_price, discount, created_at, updated_at) VALUES
(1, 2, 'Python cho người mới bắt đầu', 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400', '2024-01-01', 'published', 2500000, 150, 4.8, 'Khóa học Python từ cơ bản đến nâng cao, phù hợp cho người mới bắt đầu lập trình.', 'Beginner', 1200, 1, FALSE, FALSE, 0, 299000, 100, NOW(), NOW()),
(2, 2, 'Machine Learning với Python', 'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=400', '2024-01-05', 'published', 4500000, 85, 4.9, 'Học máy từ cơ bản đến nâng cao với Python, scikit-learn và TensorFlow.', 'Intermediate', 2400, 5, TRUE, FALSE, 499000, 599000, 17, NOW(), NOW()),
(3, 4, 'React.js Fundamentals', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400', '2024-01-08', 'published', 3200000, 120, 4.7, 'Xây dựng ứng dụng web hiện đại với React.js, từ cơ bản đến nâng cao.', 'Intermediate', 1800, 2, FALSE, FALSE, 399000, 399000, 0, NOW(), NOW()),
(4, 4, 'Advanced JavaScript Patterns', 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400', '2024-01-10', 'published', 1800000, 75, 4.6, 'Các pattern và kỹ thuật nâng cao trong JavaScript cho developer kinh nghiệm.', 'Advanced', 1500, 2, TRUE, FALSE, 799000, 999000, 20, NOW(), NOW()),
(5, 8, 'Flutter Mobile Development', 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400', '2024-01-12', 'published', 2800000, 95, 4.8, 'Phát triển ứng dụng di động đa nền tảng với Flutter và Dart.', 'Beginner', 2000, 3, FALSE, FALSE, 299000, 399000, 25, NOW(), NOW()),
(6, 7, 'Docker và Container', 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=400', '2024-01-15', 'published', 2100000, 68, 4.5, 'Triển khai và quản lý ứng dụng với Docker và Kubernetes.', 'Intermediate', 1400, 6, TRUE, FALSE, 599000, 799000, 25, NOW(), NOW()),
(7, 2, 'Data Analysis với Pandas', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400', '2024-01-18', 'draft', 0, 0, 0, 'Phân tích dữ liệu hiệu quả với thư viện Pandas trong Python.', 'Intermediate', 1600, 4, FALSE, FALSE, 399000, 499000, 20, NOW(), NOW()),
(8, 4, 'Node.js Backend Development', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400', '2024-01-20', 'published', 3500000, 110, 4.7, 'Xây dựng API và backend services với Node.js và Express.', 'Intermediate', 2200, 2, FALSE, FALSE, 699000, 899000, 22, NOW(), NOW());

-- Insert course enrollments
INSERT INTO course_enrollments (id, user_id, course_id, progress, status, start_date, completion_date, rating, created_at, updated_at) VALUES
(1, 3, 1, 75, 'in-progress', '2024-01-15', NULL, NULL, NOW(), NOW()),
(2, 3, 3, 100, 'completed', '2023-12-01', '2023-12-25', 4.5, NOW(), NOW()),
(3, 5, 1, 100, 'completed', '2023-11-01', '2023-12-15', 4.8, NOW(), NOW()),
(4, 5, 2, 60, 'in-progress', '2024-01-01', NULL, NULL, NOW(), NOW()),
(5, 5, 8, 100, 'completed', '2023-10-15', '2023-11-30', 4.7, NOW(), NOW()),
(6, 7, 6, 85, 'in-progress', '2024-01-10', NULL, NULL, NOW(), NOW()),
(7, 9, 1, 25, 'in-progress', '2024-01-12', NULL, NULL, NOW(), NOW()),
(8, 10, 5, 40, 'in-progress', '2024-01-05', NULL, NULL, NOW(), NOW()),
(9, 6, 3, 100, 'completed', '2023-08-01', '2023-09-15', 4.6, NOW(), NOW()),
(10, 1, 2, 100, 'completed', '2023-06-01', '2023-07-20', 4.9, NOW(), NOW());

-- Insert instructor qualifications
INSERT INTO instructor_qualifications (id, user_id, title, institution, date, credential_url, created_at, updated_at) VALUES
(1, 2, 'Master of Computer Science', 'Đại học Bách khoa Hà Nội', '2018-06-15', 'https://credentials.hust.edu.vn/123456', NOW(), NOW()),
(2, 2, 'Python Developer Certification', 'Python Institute', '2020-03-20', 'https://python.org/cert/789012', NOW(), NOW()),
(3, 2, 'Machine Learning Specialization', 'Coursera - Stanford', '2021-08-10', 'https://coursera.org/verify/ML123', NOW(), NOW()),
(4, 4, 'Bachelor of Software Engineering', 'Đại học Công nghệ - ĐHQGHN', '2016-07-01', NULL, NOW(), NOW()),
(5, 4, 'React Developer Certification', 'Meta', '2022-01-15', 'https://developers.facebook.com/cert/456789', NOW(), NOW()),
(6, 8, 'Mobile App Development Certificate', 'Google', '2021-11-20', 'https://developers.google.com/cert/flutter/654321', NOW(), NOW()),
(7, 7, 'AWS Certified DevOps Engineer', 'Amazon Web Services', '2022-09-30', 'https://aws.amazon.com/verification/987654', NOW(), NOW());

-- Insert testimonials
INSERT INTO testimonials (id, instructor_id, student_name, student_avatar, rating, comment, course_title, date, created_at, updated_at) VALUES
(1, 2, 'Nguyễn Văn A', 'https://i.pravatar.cc/50?img=11', 4.8, 'Khóa học rất hay, cô Mai giảng dễ hiểu và có nhiều ví dụ thực tế.', 'Python cho người mới bắt đầu', '2024-01-10', NOW(), NOW()),
(2, 2, 'Trần Thị B', 'https://i.pravatar.cc/50?img=12', 5.0, 'Tuyệt vời! Đây là khóa học Machine Learning tốt nhất tôi từng tham gia.', 'Machine Learning với Python', '2024-01-08', NOW(), NOW()),
(3, 4, 'Lê Văn C', 'https://i.pravatar.cc/50?img=13', 4.7, 'Khóa React của chị Linh rất chi tiết, giúp tôi hiểu sâu về framework này.', 'React.js Fundamentals', '2024-01-05', NOW(), NOW()),
(4, 4, 'Phạm Thị D', 'https://i.pravatar.cc/50?img=14', 4.6, 'Nội dung nâng cao, phù hợp cho developer có kinh nghiệm.', 'Advanced JavaScript Patterns', '2024-01-12', NOW(), NOW()),
(5, 8, 'Hoàng Văn E', 'https://i.pravatar.cc/50?img=15', 4.9, 'Flutter course tuyệt vời, từ cơ bản đến nâng cao rất đầy đủ.', 'Flutter Mobile Development', '2024-01-14', NOW(), NOW());

-- ===============================
-- TOPICS & DOCUMENTS
-- ===============================
-- Insert topics
INSERT INTO topics (id, name, created_at, updated_at) VALUES
(1, 'Algorithms', NOW(), NOW()),
(2, 'Data Structures', NOW(), NOW()),
(3, 'Object-Oriented Programming', NOW(), NOW()),
(4, 'Database Design', NOW(), NOW()),
(5, 'Web Technologies', NOW(), NOW()),
(6, 'Software Engineering', NOW(), NOW()),
(7, 'Computer Networks', NOW(), NOW()),
(8, 'Operating Systems', NOW(), NOW());

-- Insert document categories  
INSERT INTO document_categories (id, name, description, created_at, updated_at) VALUES
(1, 'Tutorial', 'Hướng dẫn từng bước', NOW(), NOW()),
(2, 'Reference', 'Tài liệu tham khảo', NOW(), NOW()),
(3, 'Theory', 'Lý thuyết và khái niệm', NOW(), NOW()),
(4, 'Practice', 'Bài tập thực hành', NOW(), NOW()),
(5, 'Case Study', 'Nghiên cứu tình huống', NOW(), NOW());

-- Insert documents
INSERT INTO documents (id, title, description, content, topic_id, level, duration, students, rating, thumbnail_url, created_by, is_deleted, created_at, updated_at) VALUES
(1, 'Sorting Algorithms Overview', 'Tổng quan về các thuật toán sắp xếp', 'Nội dung chi tiết về bubble sort, selection sort, insertion sort...', 1, 'Beginner', 45, 125, 4.6, 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400', 2, FALSE, NOW(), NOW()),
(2, 'Binary Search Tree Implementation', 'Cài đặt cây tìm kiếm nhị phân', 'Hướng dẫn cài đặt BST với các thao tác cơ bản...', 2, 'Intermediate', 60, 89, 4.8, 'https://images.unsplash.com/photo-1545670723-196ed0954986?w=400', 4, FALSE, NOW(), NOW()),
(3, 'OOP Principles in Java', 'Các nguyên lý OOP trong Java', 'Encapsulation, Inheritance, Polymorphism, Abstraction...', 3, 'Beginner', 75, 156, 4.5, 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400', 2, FALSE, NOW(), NOW()),
(4, 'Database Normalization', 'Chuẩn hóa cơ sở dữ liệu', 'Các dạng chuẩn 1NF, 2NF, 3NF, BCNF...', 4, 'Intermediate', 90, 78, 4.7, 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400', 7, FALSE, NOW(), NOW()),
(5, 'HTML5 Semantic Elements', 'Các thẻ ngữ nghĩa trong HTML5', 'Header, nav, main, article, section, aside...', 5, 'Beginner', 30, 203, 4.4, 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400', 4, FALSE, NOW(), NOW());

-- Insert document category links
INSERT INTO document_category_links (id, document_id, category_id, created_at, updated_at) VALUES
(1, 1, 1, NOW(), NOW()),
(2, 1, 3, NOW(), NOW()),
(3, 2, 1, NOW(), NOW()),
(4, 2, 4, NOW(), NOW()),
(5, 3, 3, NOW(), NOW()),
(6, 4, 2, NOW(), NOW()),
(7, 4, 3, NOW(), NOW()),
(8, 5, 1, NOW(), NOW());

-- Insert document modules
INSERT INTO document_modules (id, document_id, title, position, created_at, updated_at) VALUES
(1, 1, 'Introduction to Sorting', 1, NOW(), NOW()),
(2, 1, 'Simple Sorting Algorithms', 2, NOW(), NOW()),
(3, 1, 'Advanced Sorting Algorithms', 3, NOW(), NOW()),
(4, 2, 'Tree Fundamentals', 1, NOW(), NOW()),
(5, 2, 'BST Operations', 2, NOW(), NOW()),
(6, 2, 'BST Applications', 3, NOW(), NOW()),
(7, 3, 'OOP Concepts', 1, NOW(), NOW()),
(8, 3, 'Java Implementation', 2, NOW(), NOW());

-- Insert document lessons
INSERT INTO document_lessons (id, module_id, title, content, code_example, position, created_at, updated_at) VALUES
(1, 1, 'What is Sorting?', 'Sorting là quá trình sắp xếp các phần tử...', NULL, 1, NOW(), NOW()),
(2, 1, 'Why Sorting is Important', 'Tầm quan trọng của sorting trong khoa học máy tính...', NULL, 2, NOW(), NOW()),
(3, 2, 'Bubble Sort', 'Thuật toán Bubble Sort hoạt động bằng cách...', 'def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]', 1, NOW(), NOW()),
(4, 2, 'Selection Sort', 'Selection Sort tìm phần tử nhỏ nhất...', 'def selection_sort(arr):\n    for i in range(len(arr)):\n        min_idx = i\n        for j in range(i+1, len(arr)):\n            if arr[min_idx] > arr[j]:\n                min_idx = j\n        arr[i], arr[min_idx] = arr[min_idx], arr[i]', 2, NOW(), NOW()),
(5, 4, 'Tree Data Structure', 'Cây là cấu trúc dữ liệu phi tuyến tính...', NULL, 1, NOW(), NOW()),
(6, 5, 'Insert Operation', 'Thao tác chèn node vào BST...', 'class TreeNode:\n    def __init__(self, val=0):\n        self.val = val\n        self.left = None\n        self.right = None\n\ndef insert(root, val):\n    if not root:\n        return TreeNode(val)\n    if val < root.val:\n        root.left = insert(root.left, val)\n    else:\n        root.right = insert(root.right, val)\n    return root', 1, NOW(), NOW());

-- Insert document lesson completions
INSERT INTO document_lesson_completions (id, user_id, lesson_id, completed_at) VALUES
(1, 3, 1, '2024-01-14 10:30:00'),
(2, 3, 2, '2024-01-14 11:15:00'),
(3, 3, 3, '2024-01-15 09:20:00'),
(4, 5, 1, '2023-12-20 14:30:00'),
(5, 5, 2, '2023-12-20 15:00:00'),
(6, 5, 3, '2023-12-21 10:00:00'),
(7, 5, 4, '2023-12-21 11:30:00'),
(8, 7, 5, '2024-01-10 16:45:00'),
(9, 7, 6, '2024-01-11 09:15:00');

-- Insert document completions
INSERT INTO document_completions (id, user_id, document_id, completed_at) VALUES
(1, 5, 1, '2023-12-21 12:00:00'),
(2, 7, 2, '2024-01-11 17:00:00');

-- Insert animations
INSERT INTO animations (id, document_id, lesson_id, title, type, description, embed_code, created_at, updated_at) VALUES
(1, 1, 3, 'Bubble Sort Visualization', 'sorting', 'Minh họa thuật toán Bubble Sort', '<iframe src="https://visualgo.net/sorting" width="800" height="600"></iframe>', NOW(), NOW()),
(2, 1, 4, 'Selection Sort Animation', 'sorting', 'Hiệu ứng động cho Selection Sort', '<iframe src="https://visualgo.net/sorting?mode=selection" width="800" height="600"></iframe>', NOW(), NOW()),
(3, 2, 6, 'BST Insert Operation', 'tree', 'Minh họa thao tác chèn vào BST', '<iframe src="https://visualgo.net/bst" width="800" height="600"></iframe>', NOW(), NOW());

-- ===============================
-- PROBLEMS & CODING
-- ===============================
-- Insert problem categories
INSERT INTO problem_categories (id, name, description, created_at, updated_at) VALUES
(1, 'Array', 'Bài tập về mảng', NOW(), NOW()),
(2, 'String', 'Bài tập về chuỗi', NOW(), NOW()),
(3, 'Linked List', 'Bài tập về danh sách liên kết', NOW(), NOW()),
(4, 'Tree', 'Bài tập về cây', NOW(), NOW()),
(5, 'Graph', 'Bài tập về đồ thị', NOW(), NOW()),
(6, 'Dynamic Programming', 'Quy hoạch động', NOW(), NOW()),
(7, 'Sorting', 'Bài tập về sắp xếp', NOW(), NOW()),
(8, 'Searching', 'Bài tập về tìm kiếm', NOW(), NOW());

-- Insert problems
INSERT INTO problems (id, title, description, difficulty, estimated_time, likes, dislikes, acceptance, total_submissions, solved_count, is_new, is_popular, is_premium, category_id, created_by, is_deleted, created_at, updated_at) VALUES
(1, 'Two Sum', 'Cho một mảng số nguyên nums và một số nguyên target, trả về indices của hai số sao cho tổng của chúng bằng target.', 'Easy', '15 mins', 1250, 85, 87.5, 25000, 21875, FALSE, TRUE, FALSE, 1, 2, FALSE, NOW(), NOW()),
(2, 'Add Two Numbers', 'Cho hai danh sách liên kết không rỗng đại diện cho hai số nguyên không âm.', 'Medium', '30 mins', 980, 120, 68.3, 18000, 12294, FALSE, TRUE, FALSE, 3, 2, FALSE, NOW(), NOW()),
(3, 'Longest Substring Without Repeating Characters', 'Tìm độ dài của chuỗi con dài nhất không có ký tự lặp lại.', 'Medium', '25 mins', 750, 95, 72.8, 15000, 10920, FALSE, FALSE, FALSE, 2, 4, FALSE, NOW(), NOW()),
(4, 'Median of Two Sorted Arrays', 'Tìm median của hai mảng đã sắp xếp.', 'Hard', '45 mins', 450, 180, 35.2, 8000, 2816, FALSE, FALSE, TRUE, 1, 2, FALSE, NOW(), NOW()),
(5, 'Reverse Integer', 'Đảo ngược một số nguyên 32-bit có dấu.', 'Easy', '20 mins', 890, 45, 91.2, 12000, 10944, TRUE, FALSE, FALSE, 1, 4, FALSE, NOW(), NOW()),
(6, 'Binary Tree Inorder Traversal', 'Duyệt cây nhị phân theo thứ tự giữa (inorder).', 'Easy', '20 mins', 654, 32, 88.5, 9500, 8407, FALSE, TRUE, FALSE, 4, 2, FALSE, NOW(), NOW()),
(7, 'Maximum Subarray', 'Tìm mảng con liên tiếp có tổng lớn nhất.', 'Easy', '25 mins', 1100, 78, 85.6, 16000, 13696, FALSE, TRUE, FALSE, 6, 4, FALSE, NOW(), NOW()),
(8, 'Climbing Stairs', 'Có bao nhiêu cách khác biệt để leo lên đỉnh?', 'Easy', '15 mins', 987, 56, 92.1, 14000, 12894, TRUE, FALSE, FALSE, 6, 2, FALSE, NOW(), NOW()),
-- Additional problems from 03-problem-seed
(9, 'Tổng các phần tử mảng', 'Tính tổng các phần tử trong mảng số nguyên.', 'Easy', '10 phút', 120, 5, 95.50, 500, 480, true, true, false, 1, 1, false, NOW(), NOW()),
(10, 'Đảo ngược chuỗi', 'Viết hàm đảo ngược một chuỗi ký tự.', 'Easy', '8 phút', 85, 2, 98.20, 300, 295, false, true, false, 2, 2, false, NOW(), NOW()),
(11, 'Two Sum Extended', 'Tìm hai số trong mảng có tổng bằng target.', 'Easy', '15 phút', 200, 8, 87.30, 1200, 1050, false, true, false, 1, 1, false, NOW(), NOW());

-- Insert tags
INSERT INTO tags (id, name, created_at, updated_at) VALUES
(1, 'Array', NOW(), NOW()),
(2, 'Hash Table', NOW(), NOW()),
(3, 'Two Pointers', NOW(), NOW()),
(4, 'String', NOW(), NOW()),
(5, 'Sliding Window', NOW(), NOW()),
(6, 'Linked List', NOW(), NOW()),
(7, 'Math', NOW(), NOW()),
(8, 'Tree', NOW(), NOW()),
(9, 'Binary Tree', NOW(), NOW()),
(10, 'Dynamic Programming', NOW(), NOW()),
(11, 'Recursion', NOW(), NOW()),
(12, 'Stack', NOW(), NOW());

-- Insert problem tags
INSERT INTO problem_tags (problem_id, tag_id) VALUES
(1, 1), (1, 2),
(2, 6), (2, 7), (2, 11),
(3, 2), (3, 4), (3, 5),
(4, 1), (4, 7),
(5, 7),
(6, 8), (6, 9), (6, 12),
(7, 1), (7, 10),
(8, 7), (8, 10),
-- Additional problem tags
(9, 1),
(10, 3),
(11, 2), (11, 1);

-- Insert problem examples
INSERT INTO problem_examples (id, problem_id, input, output, explanation, created_at, updated_at) VALUES
(1, 1, 'nums = [2,7,11,15], target = 9', '[0,1]', 'Vì nums[0] + nums[1] = 2 + 7 = 9, nên trả về [0, 1].', NOW(), NOW()),
(2, 1, 'nums = [3,2,4], target = 6', '[1,2]', 'Vì nums[1] + nums[2] = 2 + 4 = 6, nên trả về [1, 2].', NOW(), NOW()),
(3, 5, 'x = 123', '321', 'Đảo ngược 123 thành 321.', NOW(), NOW()),
(4, 5, 'x = -123', '-321', 'Đảo ngược -123 thành -321.', NOW(), NOW()),
(5, 7, 'nums = [-2,1,-3,4,-1,2,1,-5,4]', '6', 'Mảng con [4,-1,2,1] có tổng lớn nhất = 6.', NOW(), NOW()),
(6, 8, 'n = 2', '2', 'Có 2 cách: 1. 1 step + 1 step, 2. 2 steps', NOW(), NOW()),
-- Additional problem examples
(7, 9, 'arr = [1,2,3]', '6', '1+2+3=6', NOW(), NOW()),
(8, 10, 's = "abc"', 'cba', 'Đảo ngược chuỗi', NOW(), NOW()),
(9, 11, 'nums = [2,7,11,15], target = 9', '[0,1]', 'nums[0] + nums[1] = 2 + 7 = 9', NOW(), NOW());

-- Insert problem constraints
INSERT INTO problem_constraints (id, problem_id, constraint_text, created_at, updated_at) VALUES
(1, 1, '2 ≤ nums.length ≤ 10⁴', NOW(), NOW()),
(2, 1, '-10⁹ ≤ nums[i] ≤ 10⁹', NOW(), NOW()),
(3, 1, '-10⁹ ≤ target ≤ 10⁹', NOW(), NOW()),
(4, 5, '-2³¹ ≤ x ≤ 2³¹ - 1', NOW(), NOW()),
(5, 7, '1 ≤ nums.length ≤ 10⁵', NOW(), NOW()),
(6, 7, '-10⁴ ≤ nums[i] ≤ 10⁴', NOW(), NOW()),
(7, 8, '1 ≤ n ≤ 45', NOW(), NOW());

-- Insert starter codes
INSERT INTO starter_codes (id, problem_id, language, code, created_at, updated_at) VALUES
(1, 1, 'python', 'class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass', NOW(), NOW()),
(2, 1, 'java', 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}', NOW(), NOW()),
(3, 1, 'javascript', 'var twoSum = function(nums, target) {\n    \n};', NOW(), NOW()),
(4, 5, 'python', 'class Solution:\n    def reverse(self, x: int) -> int:\n        pass', NOW(), NOW()),
(5, 7, 'python', 'class Solution:\n    def maxSubArray(self, nums: List[int]) -> int:\n        pass', NOW(), NOW()),
(6, 8, 'python', 'class Solution:\n    def climbStairs(self, n: int) -> int:\n        pass', NOW(), NOW()),
-- Additional starter codes
(7, 9, 'python', 'def sum_array(arr):\n    return sum(arr)', NOW(), NOW()),
(8, 10, 'python', 'def reverse_string(s):\n    return s[::-1]', NOW(), NOW());

-- Insert submission codes
INSERT INTO submission_codes (id, source_code, created_at, updated_at) VALUES
(1, 'class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        hash_map = {}\n        for i, num in enumerate(nums):\n            complement = target - num\n            if complement in hash_map:\n                return [hash_map[complement], i]\n            hash_map[num] = i', NOW(), NOW()),
(2, 'class Solution:\n    def reverse(self, x: int) -> int:\n        sign = -1 if x < 0 else 1\n        x *= sign\n        result = 0\n        while x:\n            result = result * 10 + x % 10\n            x //= 10\n        return 0 if result > 2**31 else result * sign', NOW(), NOW()),
(3, 'class Solution:\n    def maxSubArray(self, nums: List[int]) -> int:\n        max_sum = current_sum = nums[0]\n        for num in nums[1:]:\n            current_sum = max(num, current_sum + num)\n            max_sum = max(max_sum, current_sum)\n        return max_sum', NOW(), NOW());

-- Insert submissions
INSERT INTO submissions (id, user_id, problem_id, code_id, language, status, score, exec_time, memory_used, submitted_at) VALUES
(1, 3, 1, 1, 'python', 'accepted', 100, 85, 14, '2024-01-14 15:30:00'),
(2, 5, 1, 1, 'python', 'accepted', 100, 92, 14, '2023-11-15 10:20:00'),
(3, 5, 5, 2, 'python', 'accepted', 100, 45, 12, '2023-11-16 14:15:00'),
(4, 5, 7, 3, 'python', 'accepted', 100, 120, 18, '2023-11-20 16:45:00'),
(5, 7, 1, 1, 'python', 'wrong', 0, 0, 0, '2024-01-10 11:30:00'),
(6, 7, 1, 1, 'python', 'accepted', 100, 88, 14, '2024-01-10 12:15:00'),
(7, 9, 1, 1, 'python', 'wrong', 0, 0, 0, '2024-01-13 09:45:00');

-- Insert problem comments
INSERT INTO problem_comments (id, user_id, problem_id, content, created_at, updated_at) VALUES
(1, 5, 1, 'Bài này có thể giải bằng hash map để đạt O(n) time complexity.', NOW(), NOW()),
(2, 7, 1, 'Mình đã thử brute force trước, sau đó optimize bằng hash table.', NOW(), NOW()),
(3, 3, 7, 'Kadane\'s algorithm rất hiệu quả cho bài này!', NOW(), NOW()),
(4, 5, 8, 'Đây là bài DP cơ bản, có thể tối ưu space complexity.', NOW(), NOW());

-- Insert test cases
INSERT INTO test_cases (id, problem_id, input, expected_output, is_sample, created_at, updated_at) VALUES
(1, 1, '[2,7,11,15]\n9', '[0,1]', TRUE, NOW(), NOW()),
(2, 1, '[3,2,4]\n6', '[1,2]', TRUE, NOW(), NOW()),
(3, 1, '[3,3]\n6', '[0,1]', FALSE, NOW(), NOW()),
(4, 5, '123', '321', TRUE, NOW(), NOW()),
(5, 5, '-123', '-321', TRUE, NOW(), NOW()),
(6, 5, '120', '21', FALSE, NOW(), NOW()),
(7, 7, '[-2,1,-3,4,-1,2,1,-5,4]', '6', TRUE, NOW(), NOW()),
(8, 7, '[1]', '1', FALSE, NOW(), NOW()),
(9, 8, '2', '2', TRUE, NOW(), NOW()),
(10, 8, '3', '3', FALSE, NOW(), NOW());

-- ===============================
-- GAMIFICATION & HINTS
-- ===============================
-- Insert badge categories
INSERT INTO badge_categories (id, name, description, created_at, updated_at) VALUES
(1, 'Learning', 'Huy hiệu về việc học tập', NOW(), NOW()),
(2, 'Problem Solving', 'Huy hiệu về giải bài tập', NOW(), NOW()),
(3, 'Streak', 'Huy hiệu về chuỗi ngày học', NOW(), NOW()),
(4, 'Community', 'Huy hiệu về hoạt động cộng đồng', NOW(), NOW()),
(5, 'Teaching', 'Huy hiệu về giảng dạy', NOW(), NOW());

-- Insert badges
INSERT INTO badges (id, name, description, icon, rarity, category_id, created_at, updated_at) VALUES
(1, 'First Problem', 'Giải bài tập đầu tiên', 'first-problem.png', 'common', 2, NOW(), NOW()),
(2, '10 Problems', 'Giải 10 bài tập', '10-problems.png', 'common', 2, NOW(), NOW()),
(3, '50 Problems', 'Giải 50 bài tập', '50-problems.png', 'rare', 2, NOW(), NOW()),
(4, '100 Problems', 'Giải 100 bài tập', '100-problems.png', 'epic', 2, NOW(), NOW()),
(5, '7-Day Streak', 'Học 7 ngày liên tiếp', '7-day-streak.png', 'common', 3, NOW(), NOW()),
(6, '30-Day Streak', 'Học 30 ngày liên tiếp', '30-day-streak.png', 'epic', 3, NOW(), NOW()),
(7, 'Course Creator', 'Tạo khóa học đầu tiên', 'course-creator.png', 'rare', 5, NOW(), NOW()),
(8, 'Helper', 'Giúp đỡ 10 người dùng khác', 'helper.png', 'rare', 4, NOW(), NOW());

-- Insert levels
INSERT INTO levels (id, level, name, xp_required, xp_to_next, color, icon, created_at, updated_at) VALUES
(1, 1, 'Newbie', 0, 100, '#gray', 'level-1.png', NOW(), NOW()),
(2, 2, 'Beginner', 100, 200, '#green', 'level-2.png', NOW(), NOW()),
(3, 3, 'Learner', 300, 300, '#blue', 'level-3.png', NOW(), NOW()),
(4, 4, 'Student', 600, 400, '#purple', 'level-4.png', NOW(), NOW()),
(5, 5, 'Developer', 1000, 500, '#orange', 'level-5.png', NOW(), NOW()),
(6, 6, 'Skilled', 1500, 600, '#red', 'level-6.png', NOW(), NOW()),
(7, 7, 'Advanced', 2100, 700, '#gold', 'level-7.png', NOW(), NOW()),
(8, 8, 'Expert', 2800, 800, '#platinum', 'level-8.png', NOW(), NOW()),
(9, 9, 'Master', 3600, 900, '#diamond', 'level-9.png', NOW(), NOW()),
(10, 10, 'Pro', 4500, 1000, '#black', 'level-10.png', NOW(), NOW());

-- Insert leaderboard entries
INSERT INTO leaderboard_entries (id, user_id, xp, type, created_at, updated_at) VALUES
(1, 1, 15000, 'weekly', NOW(), NOW()),
(2, 2, 12000, 'weekly', NOW(), NOW()),
(3, 7, 9800, 'weekly', NOW(), NOW()),
(4, 4, 8500, 'weekly', NOW(), NOW()),
(5, 8, 7400, 'weekly', NOW(), NOW()),
(6, 5, 6200, 'weekly', NOW(), NOW()),
(7, 10, 4600, 'weekly', NOW(), NOW()),
(8, 3, 3500, 'weekly', NOW(), NOW()),
(9, 6, 2100, 'weekly', NOW(), NOW()),
(10, 9, 1800, 'weekly', NOW(), NOW()),
(11, 1, 15000, 'monthly', NOW(), NOW()),
(12, 2, 12000, 'monthly', NOW(), NOW()),
(13, 7, 9800, 'monthly', NOW(), NOW()),
(14, 4, 8500, 'monthly', NOW(), NOW()),
(15, 8, 7400, 'monthly', NOW(), NOW());

-- Insert game stats
INSERT INTO game_stats (id, user_id, level_id, next_level_id, created_at, updated_at) VALUES
(1, 1, 10, NULL, NOW(), NOW()),
(2, 2, 10, NULL, NOW(), NOW()),
(3, 3, 5, 6, NOW(), NOW()),
(4, 4, 9, 10, NOW(), NOW()),
(5, 5, 7, 8, NOW(), NOW()),
(6, 6, 3, 4, NOW(), NOW()),
(7, 7, 10, NULL, NOW(), NOW()),
(8, 8, 8, 9, NOW(), NOW()),
(9, 9, 2, 3, NOW(), NOW()),
(10, 10, 6, 7, NOW(), NOW());

-- Insert user badges
INSERT INTO user_badges (id, user_id, badge_id, earned_at) VALUES
(1, 1, 1, '2023-01-15 10:00:00'),
(2, 1, 2, '2023-01-20 14:30:00'),
(3, 1, 3, '2023-02-15 16:45:00'),
(4, 1, 4, '2023-04-01 09:20:00'),
(5, 1, 7, '2023-04-01 10:00:00'),
(6, 2, 1, '2023-02-01 11:15:00'),
(7, 2, 2, '2023-02-10 13:20:00'),
(8, 2, 3, '2023-03-15 15:30:00'),
(9, 2, 7, '2023-03-10 12:00:00'),
(10, 3, 1, '2023-12-01 14:45:00'),
(11, 3, 2, '2023-12-15 16:20:00'),
(12, 5, 1, '2023-08-01 10:30:00'),
(13, 5, 2, '2023-08-15 12:15:00'),
(14, 5, 3, '2023-09-20 14:40:00');

-- Insert hints
INSERT INTO hints (id, problem_id, content, coin_cost, created_at, updated_at) VALUES
(1, 1, 'Bạn có thể sử dụng hash table để lưu trữ các phần tử đã duyệt qua.', 10, NOW(), NOW()),
(2, 1, 'Với mỗi phần tử, kiểm tra xem target - current_element có tồn tại trong hash table không.', 15, NOW(), NOW()),
(3, 4, 'Bài này yêu cầu time complexity O(log(m+n)). Hãy nghĩ về binary search.', 25, NOW(), NOW()),
(4, 7, 'Thuật toán Kadane có thể giải bài này trong O(n) time và O(1) space.', 20, NOW(), NOW()),
(5, 8, 'Đây là bài Fibonacci cơ bản. Số cách leo n bước = f(n-1) + f(n-2).', 15, NOW(), NOW());

-- Insert user hint usage
INSERT INTO user_hint_usage (id, user_id, hint_id, used_at) VALUES
(1, 3, 1, '2024-01-14 15:00:00'),
(2, 7, 1, '2024-01-10 11:00:00'),
(3, 7, 2, '2024-01-10 11:30:00'),
(4, 9, 1, '2024-01-13 09:30:00'),
(5, 3, 5, '2024-01-12 14:20:00');

-- ===============================
-- CHAT SYSTEM
-- ===============================
-- Insert chat rooms
INSERT INTO chat_rooms (id, name, type, description, avatar_url, unread_count, last_message_id, course_id, is_public, created_by, created_at, updated_at) VALUES
(1, 'General Discussion', 'global', 'Phòng chat chung cho tất cả thành viên', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100', 0, NULL, NULL, TRUE, 1, NOW(), NOW()),
(2, 'Python Beginners', 'course', 'Thảo luận về khóa học Python cho người mới bắt đầu', NULL, 0, NULL, 1, TRUE, 2, NOW(), NOW()),
(3, 'React Study Group', 'group', 'Nhóm học React.js', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=100', 0, NULL, NULL, FALSE, 4, NOW(), NOW()),
(4, 'Algorithm Masters', 'group', 'Thảo luận về thuật toán', 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=100', 0, NULL, NULL, TRUE, 2, NOW(), NOW());

-- Insert chat messages
INSERT INTO chat_messages (id, room_id, sender_id, content, time_stamp, type, is_edited, reply_to, sent_at) VALUES
(1, 1, 3, 'Chào mọi người! Mình mới tham gia L-FYS. Rất vui được gặp các bạn!', '2024-01-15 09:00:00', 'text', FALSE, NULL, '2024-01-15 09:00:00'),
(2, 1, 5, 'Chào bạn! Chúc bạn học tập hiệu quả trên nền tảng nhé', '2024-01-15 09:05:00', 'text', FALSE, 1, '2024-01-15 09:05:00'),
(3, 1, 7, 'Có ai đang học về Docker không? Mình đang gặp khó khăn ở phần networking.', '2024-01-15 10:30:00', 'text', FALSE, NULL, '2024-01-15 10:30:00'),
(4, 1, 1, 'Bạn có thể tham khảo tài liệu về Docker networking trong phần Documents nhé!', '2024-01-15 10:35:00', 'text', FALSE, 3, '2024-01-15 10:35:00'),
(5, 2, 3, 'Mình vừa hoàn thành bài học về variables trong Python. Cảm thấy khá rõ ràng!', '2024-01-15 14:20:00', 'text', FALSE, NULL, '2024-01-15 14:20:00'),
(6, 2, 9, 'Mình cũng vừa bắt đầu khóa này. Có ai muốn cùng study group không?', '2024-01-15 14:25:00', 'text', FALSE, NULL, '2024-01-15 14:25:00'),
(7, 2, 2, 'Chúc mừng các bạn! Nếu có thắc mắc gì thì cứ hỏi nhé. Mình sẽ hỗ trợ.', '2024-01-15 15:00:00', 'text', FALSE, NULL, '2024-01-15 15:00:00'),
(8, 3, 4, 'Hôm nay chúng ta sẽ thảo luận về React Hooks. Ai đã đọc tài liệu chưa?', '2024-01-15 16:00:00', 'text', FALSE, NULL, '2024-01-15 16:00:00'),
(9, 3, 6, 'Mình đã đọc rồi. useState và useEffect khá thú vị!', '2024-01-15 16:05:00', 'text', FALSE, 8, '2024-01-15 16:05:00');

-- Update chat rooms with last message IDs
UPDATE chat_rooms SET last_message_id = 4 WHERE id = 1;
UPDATE chat_rooms SET last_message_id = 7 WHERE id = 2;
UPDATE chat_rooms SET last_message_id = 9 WHERE id = 3;

-- Insert chat room members
INSERT INTO chat_room_members (id, room_id, user_id, joined_at, is_admin) VALUES
(1, 1, 1, NOW(), TRUE),
(2, 1, 2, NOW(), FALSE),
(3, 1, 3, NOW(), FALSE),
(4, 1, 4, NOW(), FALSE),
(5, 1, 5, NOW(), FALSE),
(6, 1, 6, NOW(), FALSE),
(7, 1, 7, NOW(), FALSE),
(8, 1, 8, NOW(), FALSE),
(9, 1, 9, NOW(), FALSE),
(10, 1, 10, NOW(), FALSE),
(11, 2, 2, NOW(), TRUE),
(12, 2, 3, NOW(), FALSE),
(13, 2, 9, NOW(), FALSE),
(14, 3, 4, NOW(), TRUE),
(15, 3, 6, NOW(), FALSE),
(16, 3, 5, NOW(), FALSE),
(17, 4, 2, NOW(), TRUE),
(18, 4, 1, NOW(), FALSE),
(19, 4, 7, NOW(), FALSE);

-- Insert chat reactions
INSERT INTO chat_reactions (id, message_id, user_id, reaction_type, reacted_at) VALUES
(1, 1, 5, 'like', '2024-01-15 09:01:00'),
(2, 1, 7, 'like', '2024-01-15 09:02:00'),
(3, 2, 3, 'love', '2024-01-15 09:06:00'),
(4, 4, 7, 'like', '2024-01-15 10:36:00'),
(5, 5, 9, 'like', '2024-01-15 14:21:00'),
(6, 7, 3, 'love', '2024-01-15 15:01:00'),
(7, 9, 4, 'like', '2024-01-15 16:06:00');

-- Insert message mentions
INSERT INTO message_mentions (id, message_id, user_id, created_at) VALUES
(1, 4, 7, NOW()),
(2, 7, 3, NOW()),
(3, 7, 9, NOW());

-- ===============================
-- CONTESTS
-- ===============================
-- Insert contests
INSERT INTO contests (id, title, description, start_time, end_time, created_by, created_at, updated_at) VALUES
(1, 'Weekly Coding Challenge #1', 'Cuộc thi lập trình hàng tuần với các bài tập đa dạng', '2024-01-15 09:00:00', '2024-01-15 18:00:00', 1, NOW(), NOW()),
(2, 'Algorithm Mastery Contest', 'Thử thách với các thuật toán nâng cao', '2024-01-20 10:00:00', '2024-01-20 16:00:00', 2, NOW(), NOW()),
(3, 'Beginner Friendly Challenge', 'Cuộc thi dành cho người mới bắt đầu', '2024-01-25 14:00:00', '2024-01-25 17:00:00', 4, NOW(), NOW());

-- Insert contest problems
INSERT INTO contest_problems (id, contest_id, problem_id, score, created_at, updated_at) VALUES
(1, 1, 1, 100, NOW(), NOW()),
(2, 1, 5, 150, NOW(), NOW()),
(3, 1, 7, 200, NOW(), NOW()),
(4, 2, 2, 300, NOW(), NOW()),
(5, 2, 4, 500, NOW(), NOW()),
(6, 3, 1, 100, NOW(), NOW()),
(7, 3, 8, 150, NOW(), NOW());

-- Insert user contests
INSERT INTO user_contests (id, contest_id, user_id, joined_at) VALUES
(1, 1, 3, '2024-01-15 08:30:00'),
(2, 1, 5, '2024-01-15 08:45:00'),
(3, 1, 7, '2024-01-15 09:00:00'),
(4, 1, 9, '2024-01-15 09:15:00'),
(5, 2, 1, '2024-01-20 09:30:00'),
(6, 2, 2, '2024-01-20 09:45:00'),
(7, 2, 4, '2024-01-20 10:00:00'),
(8, 3, 3, '2024-01-25 13:30:00'),
(9, 3, 9, '2024-01-25 13:45:00'),
(10, 3, 10, '2024-01-25 14:00:00');

-- Insert contest submissions
INSERT INTO contest_submissions (id, user_id, contest_problem_id, code_id, language, status, score, submitted_at) VALUES
(1, 3, 1, 1, 'python', 'accepted', 100, '2024-01-15 09:30:00'),
(2, 5, 1, 1, 'python', 'accepted', 100, '2024-01-15 09:45:00'),
(3, 5, 2, 2, 'python', 'accepted', 150, '2024-01-15 10:30:00'),
(4, 7, 1, 1, 'python', 'wrong', 0, '2024-01-15 10:15:00'),
(5, 9, 1, 1, 'python', 'wrong', 0, '2024-01-15 11:00:00');

-- ===============================
-- ADMIN & SUPPORT
-- ===============================
-- Insert admins
INSERT INTO admins (id, user_id, level, assigned_at) VALUES
(1, 1, 'super', NOW());

-- Insert reports
INSERT INTO reports (id, user_id, content, type, created_at, updated_at) VALUES
(1, 3, 'Tôi gặp lỗi khi submit bài tập. Trang web báo lỗi 500.', 'bug', NOW(), NOW()),
(2, 5, 'Khóa học Python rất hay, nhưng có thể thêm nhiều ví dụ thực tế hơn.', 'feedback', NOW(), NOW()),
(3, 9, 'Có user spam trong chat room General Discussion.', 'violation', NOW(), NOW());

-- Insert notifications
INSERT INTO notifications (id, user_id, message, is_read, created_at, updated_at) VALUES
(1, 3, 'Chúc mừng! Bạn đã hoàn thành bài tập đầu tiên.', TRUE, NOW(), NOW()),
(2, 3, 'Khóa học Python có bài học mới. Hãy kiểm tra ngay!', FALSE, NOW(), NOW()),
(3, 5, 'Bạn đã nhận được 100 XP từ việc hoàn thành khóa học.', TRUE, NOW(), NOW()),
(4, 7, 'Cuộc thi mới sắp bắt đầu. Đăng ký ngay!', FALSE, NOW(), NOW()),
(5, 9, 'Chào mừng bạn đến với L-FYS! Hãy bắt đầu hành trình học tập.', TRUE, NOW(), NOW());

-- ===============================
-- AI & MACHINE LEARNING
-- ===============================
-- Insert AI messages
INSERT INTO ai_messages (id, user_id, type, prompt, response, related_problem_id, created_at, updated_at) VALUES
(1, 3, 'hint', 'Tôi không biết cách giải bài Two Sum', 'Bạn có thể sử dụng hash table để lưu trữ các phần tử đã duyệt. Với mỗi phần tử hiện tại, kiểm tra xem (target - current) có tồn tại trong hash table không.', 1, NOW(), NOW()),
(2, 5, 'review', 'Review code Python của tôi', 'Code của bạn đã đúng logic và hiệu quả. Tuy nhiên, có thể cải thiện bằng cách thêm comments và handle edge cases tốt hơn.', 7, NOW(), NOW()),
(3, 9, 'chat', 'Làm sao để học lập trình hiệu quả?', 'Để học lập trình hiệu quả, bạn nên: 1) Thực hành đều đặn mỗi ngày, 2) Làm nhiều bài tập, 3) Tham gia cộng đồng, 4) Xây dựng projects thực tế.', NULL, NOW(), NOW()),
(4, 7, 'progress_report', 'Báo cáo tiến độ học tập của tôi', 'Tuần này bạn đã hoàn thành 3 bài tập, học 5 giờ, và duy trì streak 7 ngày. Hãy tiếp tục phát huy!', NULL, NOW(), NOW());

-- Insert AI code reviews
INSERT INTO ai_code_reviews (id, submission_id, review, score, created_at, updated_at) VALUES
(1, 1, 'Code sử dụng hash table hiệu quả với time complexity O(n). Tuy nhiên có thể thêm comment để code dễ hiểu hơn.', 85, NOW(), NOW()),
(2, 3, 'Giải pháp tối ưu với Kadane algorithm. Code clean và dễ hiểu.', 92, NOW(), NOW()),
(3, 6, 'Code đúng logic nhưng có thể optimize space complexity. Thử nghĩ cách giải chỉ dùng O(1) space.', 78, NOW(), NOW());

-- ===============================
-- COURSE MODULES & LESSONS
-- ===============================
-- Insert course modules
INSERT INTO course_modules (id, course_id, title, position, created_at, updated_at) VALUES
(1, 1, 'Python Basics', 1, NOW(), NOW()),
(2, 1, 'Data Types and Variables', 2, NOW(), NOW()),
(3, 1, 'Control Structures', 3, NOW(), NOW()),
(4, 1, 'Functions and Modules', 4, NOW(), NOW()),
(5, 2, 'Introduction to ML', 1, NOW(), NOW()),
(6, 2, 'Supervised Learning', 2, NOW(), NOW()),
(7, 2, 'Unsupervised Learning', 3, NOW(), NOW()),
(8, 3, 'React Fundamentals', 1, NOW(), NOW()),
(9, 3, 'Components and Props', 2, NOW(), NOW()),
(10, 3, 'State and Lifecycle', 3, NOW(), NOW()),
-- Additional course modules from 03-courses-seed
(11, 1, 'Getting Started', 1, NOW(), NOW()),
(12, 1, 'Components & Templates', 2, NOW(), NOW()),
(13, 1, 'Services & Dependency Injection', 3, NOW(), NOW()),
(14, 2, 'ML Basics', 1, NOW(), NOW()),
(15, 2, 'Supervised Learning', 2, NOW(), NOW()),
(16, 3, 'React Fundamentals', 1, NOW(), NOW()),
(17, 3, 'Advanced React', 2, NOW(), NOW());

-- Insert course lessons
INSERT INTO course_lessons (id, module_id, title, content, duration, position, created_at, updated_at) VALUES
(1, 1, 'What is Python?', 'Python là ngôn ngữ lập trình bậc cao, dễ học và mạnh mẽ...', 15, 1, NOW(), NOW()),
(2, 1, 'Installing Python', 'Hướng dẫn cài đặt Python trên các hệ điều hành...', 20, 2, NOW(), NOW()),
(3, 1, 'Your First Python Program', 'Viết chương trình Python đầu tiên - Hello World...', 25, 3, NOW(), NOW()),
(4, 2, 'Numbers and Strings', 'Làm việc với số và chuỗi trong Python...', 30, 1, NOW(), NOW()),
(5, 2, 'Lists and Dictionaries', 'Cấu trúc dữ liệu list và dictionary...', 35, 2, NOW(), NOW()),
(6, 8, 'Introduction to React', 'React là thư viện JavaScript để xây dựng UI...', 25, 1, NOW(), NOW()),
(7, 8, 'JSX Syntax', 'Tìm hiểu về cú pháp JSX trong React...', 30, 2, NOW(), NOW()),
(8, 9, 'Creating Components', 'Cách tạo và sử dụng components trong React...', 40, 1, NOW(), NOW()),
-- Additional course lessons from 03-courses-seed
(9, 11, 'Introduction to Angular', 'https://www.youtube.com/watch?v=k5E2AVpwsko', 20, 1, NOW(), NOW()),
(10, 11, 'Setting up Development Environment', '## Setting up Angular Development Environment\n\n### Prerequisites\n- Node.js (v16 or higher)\n- npm or yarn package manager\n- Code editor (VS Code recommended)\n\n### Installation Steps\n1. Install Node.js from nodejs.org\n2. Install Angular CLI globally:\n   ```bash\n   npm install -g @angular/cli\n   ```\n3. Verify installation:\n   ```bash\n   ng version\n   ```\n\n### Creating Your First Project\n```bash\nng new my-angular-app\ncd my-angular-app\nng serve\n```\n\nYour Angular app will be available at http://localhost:4200', 15, 2, NOW(), NOW()),
(11, 12, 'Component Basics', '## Angular Components\n\n### What is a Component?\nA component is a TypeScript class decorated with @Component that controls a patch of the screen called a view.\n\n### Component Structure\n- **Template**: HTML that defines the view\n- **Class**: TypeScript code that handles data and logic\n- **Styles**: CSS that defines appearance\n\n### Example Component\n```typescript\nimport { Component } from \'@angular/core\';\n\n@Component({\n  selector: \'app-hello\',\n  template: \'<h1>Hello {{name}}!</h1>\',\n  styles: [\'h1 { color: blue; }\']\n})\nexport class HelloComponent {\n  name = \'Angular\';\n}\n```\n\n### Key Concepts\n- Data binding\n- Event handling\n- Component lifecycle\n- Input/Output properties', 30, 1, NOW(), NOW()),
(12, 12, 'Component Practice Quiz', 'Test your understanding of Angular components with this interactive quiz.\n\nQuestions will cover:\n- Component decoration\n- Data binding syntax\n- Component lifecycle hooks\n- Best practices\n\nScore 80% or higher to pass!', 10, 2, NOW(), NOW()),
(13, 14, 'What is Machine Learning?', 'https://www.youtube.com/watch?v=ukzFI9rgwfU', 25, 1, NOW(), NOW()),
(14, 14, 'Types of Machine Learning', '## Types of Machine Learning\n\n### 1. Supervised Learning\n- **Definition**: Learning with labeled training data\n- **Examples**: Classification, Regression\n- **Use cases**: Email spam detection, house price prediction\n- **Algorithms**: Linear Regression, Decision Trees, Random Forest\n\n### 2. Unsupervised Learning\n- **Definition**: Finding patterns in data without labels\n- **Examples**: Clustering, Dimensionality Reduction\n- **Use cases**: Customer segmentation, anomaly detection\n- **Algorithms**: K-Means, PCA, DBSCAN\n\n### 3. Reinforcement Learning\n- **Definition**: Learning through interaction and feedback\n- **Examples**: Game playing, robotics\n- **Use cases**: Autonomous vehicles, recommendation systems\n- **Algorithms**: Q-Learning, Policy Gradient\n\n### Key Differences\n| Type | Data | Goal | Examples |\n|------|------|------|---------|\n| Supervised | Labeled | Predict | Classification, Regression |\n| Unsupervised | Unlabeled | Discover | Clustering, Association |\n| Reinforcement | Rewards/Penalties | Optimize | Game AI, Robotics |', 20, 2, NOW(), NOW()),
(15, 14, 'ML Fundamentals Assessment', 'Evaluate your understanding of machine learning fundamentals.\n\nThis assessment covers:\n- Definition and importance of ML\n- Supervised vs Unsupervised vs Reinforcement Learning\n- Common algorithms and their applications\n- Real-world ML examples\n\nComplete all questions to proceed to the next module.', 15, 3, NOW(), NOW());

-- Insert course languages
INSERT INTO course_languages (id, course_id, language, created_at, updated_at) VALUES
(1, 1, 'vietnamese', NOW(), NOW()),
(2, 1, 'english', NOW(), NOW()),
(3, 2, 'vietnamese', NOW(), NOW()),
(4, 3, 'vietnamese', NOW(), NOW()),
(5, 3, 'english', NOW(), NOW()),
(6, 4, 'english', NOW(), NOW()),
(7, 5, 'vietnamese', NOW(), NOW()),
(8, 6, 'vietnamese', NOW(), NOW());

-- Insert course reviews
INSERT INTO course_reviews (id, course_id, user_id, rating, comment, helpful, not_helpful, verified, created_at, updated_at) VALUES
(1, 1, 5, 5, 'Khóa học tuyệt vời! Giảng viên giải thích rất rõ ràng và dễ hiểu. Rất phù hợp cho người mới bắt đầu.', 15, 2, TRUE, NOW(), NOW()),
(2, 1, 3, 4, 'Nội dung hay nhưng có thể thêm nhiều bài tập thực hành hơn.', 8, 1, TRUE, NOW(), NOW()),
(3, 2, 1, 5, 'Khóa học ML chất lượng cao. Từ lý thuyết đến thực hành đều rất chi tiết.', 22, 0, TRUE, NOW(), NOW()),
(4, 3, 6, 5, 'React course rất thực tế. Học xong có thể làm project ngay.', 12, 1, TRUE, NOW(), NOW()),
(5, 3, 9, 4, 'Khóa học tốt nhưng hơi nhanh với người mới. Nên có thêm phần ôn tập.', 5, 3, FALSE, NOW(), NOW());

-- Insert related courses
INSERT INTO related_courses (id, course_id, related_course_id, created_at) VALUES
(1, 1, 2, NOW()),
(2, 1, 7, NOW()),
(3, 2, 1, NOW()),
(4, 3, 4, NOW()),
(5, 3, 8, NOW()),
(6, 4, 3, NOW()),
(7, 5, 8, NOW()),
(8, 8, 3, NOW());

-- Insert payments
INSERT INTO payments (id, user_id, course_id, hint_id, amount, payment_method, status, type, created_at, updated_at) VALUES
(1, 5, 2, NULL, 1500000, 'credit_card', 'completed', 'course', '2024-01-01 10:00:00', '2024-01-01 10:00:00'),
(2, 1, 2, NULL, 1500000, 'paypal', 'completed', 'course', '2023-06-01 14:30:00', '2023-06-01 14:30:00'),
(3, 7, 6, NULL, 1200000, 'bank_transfer', 'completed', 'course', '2024-01-10 09:15:00', '2024-01-10 09:15:00'),
(4, 3, NULL, 1, 10000, 'credit_card', 'completed', 'hint', '2024-01-14 15:00:00', '2024-01-14 15:00:00'),
(5, 1, NULL, NULL, 500000, 'credit_card', 'completed', 'subscription', '2024-01-01 00:00:00', '2024-01-01 00:00:00');

-- ===============================
-- ADDITIONAL FEATURES
-- ===============================
-- Insert quizzes
INSERT INTO quizzes (id, title, description, lesson_id, type, time_limit, created_by, created_at, updated_at) VALUES
(1, 'Python Basics Quiz', 'Kiểm tra kiến thức cơ bản về Python', 3, 'multiple_choice', 15, 2, NOW(), NOW()),
(2, 'Variables and Data Types', 'Quiz về biến và kiểu dữ liệu trong Python', 4, 'multiple_choice', 10, 2, NOW(), NOW()),
(3, 'React Components Quiz', 'Kiểm tra hiểu biết về React components', 8, 'multiple_choice', 20, 4, NOW(), NOW()),
(4, 'True/False: Python Concepts', 'Câu hỏi đúng/sai về Python', 1, 'true_false', 5, 2, NOW(), NOW());

-- Insert quiz questions
INSERT INTO quiz_questions (id, quiz_id, question, options, correct_answer, explanation, points, position, created_at, updated_at) VALUES
(1, 1, 'Python là ngôn ngữ lập trình gì?', '["Compiled", "Interpreted", "Assembly", "Machine"]', 'Interpreted', 'Python là ngôn ngữ thông dịch (interpreted), không cần compile trước khi chạy.', 1, 1, NOW(), NOW()),
(2, 1, 'Cú pháp nào đúng để in "Hello World" trong Python?', '["print(Hello World)", "print(\"Hello World\")", "echo \"Hello World\"", "console.log(\"Hello World\")"]', 'print("Hello World")', 'Trong Python, sử dụng hàm print() với chuỗi trong dấu nháy.', 1, 2, NOW(), NOW()),
(3, 2, 'Kiểu dữ liệu nào không có trong Python?', '["int", "float", "char", "str"]', 'char', 'Python không có kiểu char, thay vào đó sử dụng string với độ dài 1.', 1, 1, NOW(), NOW()),
(4, 4, 'Python là ngôn ngữ hướng đối tượng.', NULL, 'True', 'Python hỗ trợ lập trình hướng đối tượng với classes và objects.', 1, 1, NOW(), NOW());

-- Insert user quiz results
INSERT INTO user_quiz_results (id, user_id, quiz_id, score, completed_at) VALUES
(1, 3, 1, 2, '2024-01-15 10:30:00'),
(2, 3, 2, 1, '2024-01-15 11:15:00'),
(3, 5, 1, 2, '2023-11-15 14:20:00'),
(4, 5, 2, 1, '2023-11-16 09:30:00'),
(5, 9, 1, 1, '2024-01-12 16:45:00');

-- Insert forums
INSERT INTO forums (id, title, description, type, related_id, created_at, updated_at) VALUES
(1, 'Python Learning Discussion', 'Thảo luận về khóa học Python', 'course', 1, NOW(), NOW()),
(2, 'Two Sum Problem Help', 'Hỗ trợ giải bài Two Sum', 'problem', 1, NOW(), NOW()),
(3, 'General Programming Discussion', 'Thảo luận chung về lập trình', 'general', NULL, NOW(), NOW()),
(4, 'React Development Forum', 'Diễn đàn về React.js', 'course', 3, NOW(), NOW());

-- Insert forum posts
INSERT INTO forum_posts (id, forum_id, user_id, content, votes, created_at, updated_at) VALUES
(1, 1, 3, 'Mình mới học Python và thấy khó khăn ở phần functions. Có ai có tips không?', 5, NOW(), NOW()),
(2, 1, 5, 'Bạn nên thực hành nhiều và đọc documentation. Functions trong Python khá đơn giản.', 8, NOW(), NOW()),
(3, 2, 7, 'Mình đã thử brute force nhưng time limit exceeded. Có cách nào tối ưu không?', 3, NOW(), NOW()),
(4, 2, 5, 'Hãy thử sử dụng hash table. Time complexity sẽ giảm từ O(n²) xuống O(n).', 12, NOW(), NOW()),
(5, 3, 9, 'Các bạn nghĩ ngôn ngữ nào tốt nhất để bắt đầu học lập trình?', 2, NOW(), NOW()),
(6, 4, 6, 'React hooks thay đổi cách chúng ta viết components như thế nào?', 4, NOW(), NOW());

-- Insert forum votes
INSERT INTO forum_votes (id, post_id, user_id, vote_type, created_at) VALUES
(1, 1, 5, 'up', NOW()),
(2, 1, 7, 'up', NOW()),
(3, 2, 3, 'up', NOW()),
(4, 2, 7, 'up', NOW()),
(5, 4, 7, 'up', NOW()),
(6, 4, 3, 'up', NOW()),
(7, 4, 9, 'up', NOW()),
(8, 5, 3, 'up', NOW()),
(9, 6, 4, 'up', NOW());

-- Insert user recommendations
INSERT INTO user_recommendations (id, user_id, recommended_type, recommended_id, reason, score, created_at, updated_at) VALUES
(1, 3, 'course', 2, 'Dựa trên việc bạn đã hoàn thành khóa Python cơ bản', 0.85, NOW(), NOW()),
(2, 3, 'problem', 5, 'Bài tập phù hợp với level hiện tại của bạn', 0.78, NOW(), NOW()),
(3, 5, 'course', 6, 'Bạn có thể quan tâm đến DevOps sau khi học backend', 0.72, NOW(), NOW()),
(4, 9, 'document', 1, 'Tài liệu về algorithms sẽ giúp bạn giải bài tập tốt hơn', 0.80, NOW(), NOW()),
(5, 7, 'course', 8, 'Khóa Node.js phù hợp với kinh nghiệm backend của bạn', 0.88, NOW(), NOW());

-- Insert translations
INSERT INTO translations (id, entity_type, entity_id, language, field, translated_text, created_at, updated_at) VALUES
(1, 'course', 1, 'english', 'title', 'Python for Beginners', NOW(), NOW()),
(2, 'course', 1, 'english', 'description', 'Learn Python from basics to advanced, suitable for programming beginners.', NOW(), NOW()),
(3, 'problem', 1, 'english', 'title', 'Two Sum', NOW(), NOW()),
(4, 'problem', 1, 'english', 'description', 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.', NOW(), NOW()),
(5, 'document', 1, 'english', 'title', 'Sorting Algorithms Overview', NOW(), NOW());

-- Insert referrals
INSERT INTO referrals (id, referrer_id, referred_id, bonus_xp, created_at, updated_at) VALUES
(1, 5, 9, 100, '2024-01-12 00:00:00', '2024-01-12 00:00:00'),
(2, 2, 3, 100, '2023-12-01 00:00:00', '2023-12-01 00:00:00'),
(3, 4, 6, 100, '2023-08-01 00:00:00', '2023-08-01 00:00:00'),
(4, 1, 7, 100, '2023-10-15 00:00:00', '2023-10-15 00:00:00');

SET FOREIGN_KEY_CHECKS = 1;

-- ===============================
-- END OF SEED DATA
-- ===============================
