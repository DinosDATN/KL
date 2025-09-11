
-- ===============================
-- File: Lfys_insert_data.sql
-- Description: Insert sample data for "Learn For Yourself" database
-- Database: lfysdb (MySQL)
-- Date: August 25, 2025
-- Notes: Ensure the schema (Lfys.sql) is applied before running this script.
-- ===============================
USE lfysdb;

-- ===============================
-- I. USERS & AUTHENTICATION
-- ===============================
-- Insert users (3 users: 1 admin, 1 creator, 1 regular user)
INSERT INTO users (name, email, password, avatar_url, role, is_active, subscription_status, created_at) VALUES
('Admin User', 'admin@example.com', '$2b$10$hashedpassword123', 'https://example.com/avatars/admin.png', 'admin', TRUE, 'premium', '2025-08-01 10:00:00'),
('Creator User', 'creator@example.com', '$2b$10$hashedpassword456', 'https://example.com/avatars/creator.png', 'creator', TRUE, 'premium', '2025-08-01 10:00:00'),
('Regular User', 'user@example.com', '$2b$10$hashedpassword789', 'https://example.com/avatars/user.png', 'user', TRUE, 'free', '2025-08-01 10:00:00');

-- Insert user profiles (linked to users)
INSERT INTO user_profiles (user_id, bio, birthday, gender, phone, preferred_language, theme_mode, notifications, created_at) VALUES
(1, 'Admin of Learn For Yourself', '1990-01-01', 'male', '1234567890', 'en', 'dark', TRUE, '2025-08-01 10:00:00'),
(2, 'Passionate coding instructor', '1985-05-15', 'female', '0987654321', 'vi', 'light', TRUE, '2025-08-01 10:00:00'),
(3, 'Aspiring programmer', '2000-03-20', 'other', '5555555555', 'en', 'system', TRUE, '2025-08-01 10:00:00');

-- Insert user stats
INSERT INTO user_stats (user_id, xp, level, rank, courses_completed, problems_solved, current_streak, longest_streak, average_score, created_at) VALUES
(1, 5000, 5, 1, 2, 50, 10, 15, 85.5, '2025-08-01 10:00:00'),
(2, 3000, 3, 2, 1, 30, 5, 10, 80.0, '2025-08-01 10:00:00'),
(3, 1000, 1, 3, 0, 10, 2, 2, 75.0, '2025-08-01 10:00:00');

-- Insert user goals
INSERT INTO user_goals (user_id, title, description, target, current, unit, deadline, category, created_at) VALUES
(3, 'Solve 50 Problems', 'Complete 50 coding problems', 50, 10, 'problems', '2025-12-31', 'practice', '2025-08-01 10:00:00'),
(2, 'Publish Course', 'Create a new course', 1, 0, 'courses', '2025-11-30', 'teaching', '2025-08-01 10:00:00');

-- Insert achievements
INSERT INTO achievements (title, description, icon, category, rarity, created_at) VALUES
('First Problem Solved', 'Solve your first coding problem', 'first_problem.png', 'learning', 'common', '2025-08-01 10:00:00'),
('Course Master', 'Complete 5 courses', 'course_master.png', 'learning', 'rare', '2025-08-01 10:00:00');

-- Insert user achievements
INSERT INTO user_achievements (user_id, achievement_id, date_earned, created_at) VALUES
(3, 1, '2025-08-02', '2025-08-02 10:00:00'),
(1, 2, '2025-08-03', '2025-08-03 10:00:00');

-- Insert user activity log
INSERT INTO user_activity_log (user_id, type, title, description, date, duration, created_at) VALUES
(3, 'problem_solved', 'Solved Two Sum', 'Completed Two Sum problem', '2025-08-02', 30, '2025-08-02 10:00:00'),
(2, 'course_published', 'Published Python Course', 'Created a new Python course', '2025-08-03', 120, '2025-08-03 10:00:00');

-- ===============================
-- II. COURSES
-- ===============================
-- Insert course categories
INSERT INTO course_categories (name, description, created_at) VALUES
('Programming', 'Courses on programming languages', '2025-08-01 10:00:00'),
('Algorithms', 'Courses on algorithms and data structures', '2025-08-01 10:00:00');

-- Insert courses
INSERT INTO courses (instructor_id, title, thumbnail, publish_date, status, revenue, students, rating, description, level, duration, category_id, is_premium, created_at) VALUES
(2, 'Python for Beginners', 'https://example.com/thumbnails/python.jpg', '2025-08-02', 'published', 1000, 50, 4.5, 'Learn Python from scratch', 'Beginner', 300, 1, FALSE, '2025-08-01 10:00:00'),
(2, 'Advanced Algorithms', 'https://example.com/thumbnails/algorithms.jpg', '2025-08-03', 'published', 2000, 30, 4.8, 'Master algorithms and data structures', 'Advanced', 600, 2, TRUE, '2025-08-01 10:00:00');

-- Insert course enrollments
INSERT INTO course_enrollments (user_id, course_id, progress, status, start_date, rating, created_at) VALUES
(3, 1, 50, 'in-progress', '2025-08-02', 4, '2025-08-02 10:00:00'),
(1, 2, 100, 'completed', '2025-08-02', 5, '2025-08-02 10:00:00');

-- Insert instructor qualifications
INSERT INTO instructor_qualifications (user_id, title, institution, date, credential_url, created_at) VALUES
(2, 'PhD in Computer Science', 'MIT', '2015-06-01', 'https://example.com/credentials/phd.pdf', '2025-08-01 10:00:00');

-- Insert testimonials
INSERT INTO testimonials (instructor_id, student_name, student_avatar, rating, comment, course_title, date, created_at) VALUES
(2, 'John Doe', 'https://example.com/avatars/john.png', 5, 'Amazing course!', 'Python for Beginners', '2025-08-03', '2025-08-03 10:00:00');

-- Insert course modules
INSERT INTO course_modules (course_id, title, position, created_at) VALUES
(1, 'Introduction to Python', 1, '2025-08-01 10:00:00'),
(1, 'Python Data Structures', 2, '2025-08-01 10:00:00');

-- Insert course lessons
INSERT INTO course_lessons (module_id, title, content, duration, position, created_at) VALUES
(1, 'Variables and Types', 'Learn about Python variables...', 30, 1, '2025-08-01 10:00:00'),
(2, 'Lists and Arrays', 'Understand Python lists...', 45, 1, '2025-08-01 10:00:00');

-- Insert course languages
INSERT INTO course_languages (course_id, language, created_at) VALUES
(1, 'en', '2025-08-01 10:00:00'),
(1, 'vi', '2025-08-01 10:00:00');

-- Insert course reviews
INSERT INTO course_reviews (course_id, user_id, rating, comment, helpful, created_at) VALUES
(1, 3, 4, 'Very beginner-friendly!', 5, '2025-08-02 10:00:00');

-- Insert related courses
INSERT INTO related_courses (course_id, related_course_id, created_at) VALUES
(1, 2, '2025-08-01 10:00:00');

-- Insert payments
INSERT INTO payments (user_id, course_id, amount, payment_method, status, type, created_at) VALUES
(3, 1, 29.99, 'credit_card', 'completed', 'course', '2025-08-02 10:00:00'),
(1, 2, 49.99, 'paypal', 'completed', 'course', '2025-08-02 10:00:00');

-- ===============================
-- III. DOCUMENTS & ANIMATION
-- ===============================
-- Insert topics
INSERT INTO topics (name, created_at) VALUES
('Data Structures', '2025-08-01 10:00:00'),
('Algorithms', '2025-08-01 10:00:00');

-- Insert document categories
INSERT INTO document_categories (name, description, created_at) VALUES
('Tutorials', 'Step-by-step coding tutorials', '2025-08-01 10:00:00');

-- Insert documents
INSERT INTO documents (title, description, content, topic_id, level, duration, students, rating, thumbnail_url, created_by, created_at) VALUES
('Binary Search Tutorial', 'Learn binary search', 'Detailed guide on binary search...', 2, 'Intermediate', 60, 20, 4.2, 'https://example.com/thumbnails/binary_search.jpg', 2, '2025-08-01 10:00:00');

-- Insert document category links
INSERT INTO document_category_links (document_id, category_id, created_at) VALUES
(1, 1, '2025-08-01 10:00:00');

-- Insert document modules
INSERT INTO document_modules (document_id, title, position, created_at) VALUES
(1, 'Introduction to Binary Search', 1, '2025-08-01 10:00:00');

-- Insert document lessons
INSERT INTO document_lessons (module_id, title, content, code_example, position, created_at) VALUES
(1, 'Binary Search Basics', 'Understand the concept...', 'def binary_search(arr, target):...', 1, '2025-08-01 10:00:00');

-- Insert document lesson completions
INSERT INTO document_lesson_completions (user_id, lesson_id, completed_at) VALUES
(3, 1, '2025-08-02 10:00:00');

-- Insert document completions
INSERT INTO document_completions (user_id, document_id, completed_at) VALUES
(3, 1, '2025-08-02 10:00:00');

-- Insert animations
INSERT INTO animations (document_id, lesson_id, title, type, description, embed_code, created_at) VALUES
(1, 1, 'Binary Search Visualization', 'searching', 'Visualize binary search', '<canvas>...</canvas>', '2025-08-01 10:00:00');

-- ===============================
-- IV. PROBLEMS & CODE
-- ===============================
-- Insert problem categories
INSERT INTO problem_categories (name, description, created_at) VALUES
('Array', 'Array-related problems', '2025-08-01 10:00:00'),
('Dynamic Programming', 'DP problems', '2025-08-01 10:00:00');

-- Insert problems
INSERT INTO problems (title, description, difficulty, estimated_time, likes, acceptance, total_submissions, solved_count, is_new, category_id, created_by, created_at) VALUES
('Two Sum', 'Find two numbers that sum to target', 'Easy', '30 minutes', 100, 75.5, 200, 150, TRUE, 1, 2, '2025-08-01 10:00:00'),
('Longest Substring', 'Find longest substring without repeating characters', 'Medium', '45 minutes', 80, 60.0, 150, 90, FALSE, 1, 2, '2025-08-01 10:00:00');

-- Insert tags
INSERT INTO tags (name, created_at) VALUES
('array', '2025-08-01 10:00:00'),
('hash table', '2025-08-01 10:00:00');

-- Insert problem tags
INSERT INTO problem_tags (problem_id, tag_id) VALUES
(1, 1),
(1, 2),
(2, 1);

-- Insert problem examples
INSERT INTO problem_examples (problem_id, input, output, explanation, created_at) VALUES
(1, '[2,7,11,15], 9', '[0,1]', '2 + 7 = 9', '2025-08-01 10:00:00');

-- Insert problem constraints
INSERT INTO problem_constraints (problem_id, constraint_text, created_at) VALUES
(1, 'Array length <= 10^4', '2025-08-01 10:00:00');

-- Insert starter codes
INSERT INTO starter_codes (problem_id, language, code, created_at) VALUES
(1, 'python', 'def twoSum(nums, target):\n    pass', '2025-08-01 10:00:00');

-- Insert submission codes
INSERT INTO submission_codes (source_code, created_at) VALUES
('def twoSum(nums, target):\n    hash_map = {}\n    for i, num in enumerate(nums):\n        if target - num in hash_map:\n            return [hash_map[target - num], i]\n        hash_map[num] = i\n    return []', '2025-08-02 10:00:00');

-- Insert submissions
INSERT INTO submissions (user_id, problem_id, code_id, language, status, score, exec_time, memory_used, submitted_at) VALUES
(3, 1, 1, 'python', 'accepted', 100, 50, 128, '2025-08-02 10:00:00');

-- Insert problem comments
INSERT INTO problem_comments (user_id, problem_id, content, created_at) VALUES
(3, 1, 'Great problem to practice hash tables!', '2025-08-02 10:00:00');

-- Insert test cases
INSERT INTO test_cases (problem_id, input, expected_output, is_sample, created_at) VALUES
(1, '[2,7,11,15], 9', '[0,1]', TRUE, '2025-08-01 10:00:00');

-- ===============================
-- V. GAMIFICATION & HINT
-- ===============================
-- Insert badge categories
INSERT INTO badge_categories (name, description, created_at) VALUES
('Learning', 'Badges for learning achievements', '2025-08-01 10:00:00');

-- Insert badges
INSERT INTO badges (name, description, icon, rarity, category_id, created_at) VALUES
('First Solve', 'Solve your first problem', 'first_solve.png', 'common', 1, '2025-08-01 10:00:00');

-- Insert user badges
INSERT INTO user_badges (user_id, badge_id, earned_at) VALUES
(3, 1, '2025-08-02 10:00:00');

-- Insert levels
INSERT INTO levels (level, name, xp_required, xp_to_next, color, icon, created_at) VALUES
(1, 'Beginner', 0, 1000, '#00FF00', 'beginner.png', '2025-08-01 10:00:00'),
(2, 'Intermediate', 1000, 2000, '#FFFF00', 'intermediate.png', '2025-08-01 10:00:00');

-- Insert leaderboard entries
INSERT INTO leaderboard_entries (user_id, xp, type, created_at) VALUES
(1, 5000, 'weekly', '2025-08-01 10:00:00'),
(2, 3000, 'weekly', '2025-08-01 10:00:00'),
(3, 1000, 'weekly', '2025-08-01 10:00:00');

-- Insert game stats
INSERT INTO game_stats (user_id, level_id, next_level_id, created_at) VALUES
(3, 1, 2, '2025-08-01 10:00:00');

-- Insert hints
INSERT INTO hints (problem_id, content, coin_cost, created_at) VALUES
(1, 'Use a hash table to store numbers', 10, '2025-08-01 10:00:00');

-- Insert user hint usage
INSERT INTO user_hint_usage (user_id, hint_id, used_at) VALUES
(3, 1, '2025-08-02 10:00:00');

-- ===============================
-- VI. CHAT REALTIME
-- ===============================
-- Insert chat rooms
INSERT INTO chat_rooms (name, type, description, avatar_url, course_id, is_public, created_by, created_at) VALUES
('Global Chat', 'global', 'General discussion for all users', 'https://example.com/avatars/global.png', NULL, TRUE, 1, '2025-08-01 10:00:00'),
('Python Course Chat', 'course', 'Chat for Python course', 'https://example.com/avatars/python_chat.png', 1, TRUE, 2, '2025-08-01 10:00:00');

-- Insert chat messages
INSERT INTO chat_messages (room_id, sender_id, content, type, sent_at) VALUES
(1, 3, 'Hello everyone!', 'text', '2025-08-02 10:00:00'),
(2, 3, 'Any questions about Python?', 'text', '2025-08-02 10:00:00');

-- Update last_message_id for chat_rooms
UPDATE chat_rooms SET last_message_id = 1 WHERE id = 1;
UPDATE chat_rooms SET last_message_id = 2 WHERE id = 2;

-- Insert chat room members
INSERT INTO chat_room_members (room_id, user_id, joined_at, is_admin) VALUES
(1, 1, '2025-08-01 10:00:00', TRUE),
(1, 3, '2025-08-01 10:00:00', FALSE),
(2, 2, '2025-08-01 10:00:00', TRUE),
(2, 3, '2025-08-01 10:00:00', FALSE);

-- Insert chat reactions
INSERT INTO chat_reactions (message_id, user_id, reaction_type, reacted_at) VALUES
(1, 1, 'like', '2025-08-02 10:00:00');

-- Insert message mentions
INSERT INTO message_mentions (message_id, user_id, created_at) VALUES
(1, 1, '2025-08-02 10:00:00');

-- ===============================
-- VII. CONTEST SYSTEM
-- ===============================
-- Insert contests
INSERT INTO contests (title, description, start_time, end_time, created_by, created_at) VALUES
('Weekly Coding Challenge', 'Test your coding skills', '2025-08-10 09:00:00', '2025-08-10 12:00:00', 1, '2025-08-01 10:00:00');

-- Insert contest problems
INSERT INTO contest_problems (contest_id, problem_id, score, created_at) VALUES
(1, 1, 100, '2025-08-01 10:00:00');

-- Insert user contests
INSERT INTO user_contests (contest_id, user_id, joined_at) VALUES
(1, 3, '2025-08-10 09:00:00');

-- Insert contest submissions
INSERT INTO contest_submissions (user_id, contest_problem_id, code_id, language, status, score, submitted_at) VALUES
(3, 1, 1, 'python', 'accepted', 100, '2025-08-10 09:30:00');

-- ===============================
-- VIII. ADMIN & SUPPORT
-- ===============================
-- Insert admins
INSERT INTO admins (user_id, level, assigned_at) VALUES
(1, 'super', '2025-08-01 10:00:00');

-- Insert reports
INSERT INTO reports (user_id, content, type, created_at) VALUES
(3, 'Found a bug in problem submission', 'bug', '2025-08-02 10:00:00');

-- Insert notifications
INSERT INTO notifications (user_id, message, is_read, created_at) VALUES
(3, 'New message in Global Chat', FALSE, '2025-08-02 10:00:00');

-- ===============================
-- IX. AI & MACHINE LEARNING
-- ===============================
-- Insert AI messages
INSERT INTO ai_messages (user_id, type, prompt, response, related_problem_id, created_at) VALUES
(3, 'hint', 'How to solve Two Sum?', 'Use a hash table for O(n) solution', 1, '2025-08-02 10:00:00');

-- Insert AI code reviews
INSERT INTO ai_code_reviews (submission_id, review, score, created_at) VALUES
(1, 'Good use of hash table, but consider edge cases', 90, '2025-08-02 10:00:00');

-- ===============================
-- X. QUIZZES
-- ===============================
-- Insert quizzes
INSERT INTO quizzes (title, description, lesson_id, type, time_limit, created_by, created_at) VALUES
('Python Basics Quiz', 'Test your Python knowledge', 1, 'multiple_choice', 15, 2, '2025-08-01 10:00:00');

-- Insert quiz questions
INSERT INTO quiz_questions (quiz_id, question, options, correct_answer, explanation, points, position, created_at) VALUES
(1, 'What is the output of print(2 + 2)?', '{"a": "2", "b": "4", "c": "22"}', 'b', 'Python adds numbers', 1, 1, '2025-08-01 10:00:00');

-- Insert user quiz results
INSERT INTO user_quiz_results (user_id, quiz_id, score, completed_at) VALUES
(3, 1, 80, '2025-08-02 10:00:00');

-- ===============================
-- XI. FORUMS
-- ===============================
-- Insert forums
INSERT INTO forums (title, type, related_id, created_at) VALUES
('Python Course Discussion', 'course', 1, '2025-08-01 10:00:00'),
('General Coding Questions', 'general', NULL, '2025-08-01 10:00:00');

-- Insert forum posts
INSERT INTO forum_posts (forum_id, user_id, content, votes, created_at) VALUES
(1, 3, 'How to optimize loops in Python?', 5, '2025-08-02 10:00:00');

-- Insert forum votes
INSERT INTO forum_votes (post_id, user_id, vote_type, created_at) VALUES
(1, 1, 'up', '2025-08-02 10:00:00');

-- ===============================
-- XII. RECOMMENDATIONS
-- ===============================
-- Insert user recommendations
INSERT INTO user_recommendations (user_id, recommended_type, recommended_id, reason, score, created_at) VALUES
(3, 'course', 2, 'Based on your Python progress', 0.9, '2025-08-02 10:00:00'),
(3, 'problem', 2, 'Matches your skill level', 0.8, '2025-08-02 10:00:00');

-- ===============================
-- XIII. TRANSLATIONS
-- ===============================
-- Insert translations
INSERT INTO translations (entity_type, entity_id, language, field, translated_text, created_at) VALUES
('course', 1, 'vi', 'title', 'Python cho Người Mới Bắt Đầu', '2025-08-01 10:00:00'),
('course', 1, 'vi', 'description', 'Học Python từ con số 0', '2025-08-01 10:00:00');

-- ===============================
-- XIV. REFERRALS
-- ===============================
-- Insert referrals
INSERT INTO referrals (referrer_id, referred_id, bonus_xp, created_at) VALUES
(1, 3, 100, '2025-08-01 10:00:00');
