-- =====================================================
-- Forum System Tables
-- File: 009-forum-system.sql
-- Description: Create forum categories, posts, replies, votes, and tags
-- =====================================================

-- Drop existing forum tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS forum_post_tags;
DROP TABLE IF EXISTS forum_votes;
DROP TABLE IF EXISTS forum_replies;
DROP TABLE IF EXISTS forum_posts;
DROP TABLE IF EXISTS forum_tags;
DROP TABLE IF EXISTS forum_categories;

-- Create forum categories table
CREATE TABLE forum_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(50),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create forum posts table
CREATE TABLE forum_posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    user_id BIGINT NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_solved BOOLEAN DEFAULT FALSE,
    is_question BOOLEAN DEFAULT FALSE,
    views_count INT DEFAULT 0,
    replies_count INT DEFAULT 0,
    votes_count INT DEFAULT 0,
    last_reply_at TIMESTAMP NULL,
    last_reply_user_id BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category_id (category_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_pinned (is_pinned),
    INDEX idx_last_reply_at (last_reply_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create forum replies table
CREATE TABLE forum_replies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    parent_reply_id INT NULL,
    votes_count INT DEFAULT 0,
    is_solution BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_parent_reply_id (parent_reply_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create forum votes table
CREATE TABLE forum_votes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    post_id INT NULL,
    reply_id INT NULL,
    vote_type ENUM('up', 'down') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_post_vote (user_id, post_id),
    UNIQUE KEY unique_reply_vote (user_id, reply_id),
    INDEX idx_user_id (user_id),
    INDEX idx_post_id (post_id),
    INDEX idx_reply_id (reply_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create forum tags table
CREATE TABLE forum_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(50) DEFAULT '#3b82f6',
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create forum post tags junction table
CREATE TABLE forum_post_tags (
    post_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (post_id, tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default forum categories
INSERT IGNORE INTO forum_categories (name, description, icon, color, sort_order) VALUES
('Thảo luận chung', 'Nơi chia sẻ ý kiến và thảo luận về các chủ đề tổng quát', '💬', 'from-blue-500 to-indigo-600', 1),
('Hỏi đáp lập trình', 'Đặt câu hỏi và nhận trợ giúp về các vấn đề lập trình', '❓', 'from-green-500 to-emerald-600', 2),
('Chia sẻ dự án', 'Khoe dự án và nhận phản hồi từ cộng đồng', '🚀', 'from-purple-500 to-pink-600', 3),
('Tìm việc làm', 'Cơ hội việc làm và thông tin tuyển dụng', '💼', 'from-orange-500 to-red-600', 4),
('Học tập & Tài liệu', 'Chia sẻ tài liệu học tập và kinh nghiệm học', '📚', 'from-cyan-500 to-blue-600', 5),
('Công nghệ mới', 'Thảo luận về xu hướng và công nghệ mới nhất', '⚡', 'from-yellow-500 to-orange-600', 6);

-- Insert some default tags
INSERT IGNORE INTO forum_tags (name, color) VALUES
('JavaScript', '#f7df1e'),
('Python', '#3776ab'),
('React', '#61dafb'),
('Node.js', '#339933'),
('Angular', '#dd0031'),
('Vue.js', '#4fc08d'),
('PHP', '#777bb4'),
('Java', '#ed8b00'),
('C++', '#00599c'),
('HTML', '#e34f26'),
('CSS', '#1572b6'),
('SQL', '#336791'),
('MongoDB', '#47a248'),
('Docker', '#2496ed'),
('Git', '#f05032'),
('AWS', '#ff9900'),
('Firebase', '#ffca28'),
('TypeScript', '#3178c6'),
('Laravel', '#ff2d20'),
('Spring Boot', '#6db33f');

-- Insert some sample forum posts (optional) - only if categories and users exist
INSERT IGNORE INTO forum_posts (category_id, user_id, title, content, is_question, is_pinned) 
SELECT c.id, u.id, 'Chào mừng đến với diễn đàn L-FYS!', 
'Xin chào tất cả mọi người! Đây là bài viết đầu tiên trong diễn đàn của chúng ta. 

Diễn đàn này được tạo ra để:
- Chia sẻ kiến thức lập trình
- Hỗ trợ nhau giải quyết vấn đề
- Thảo luận về công nghệ mới
- Kết nối cộng đồng lập trình viên

Hãy tham gia tích cực và cùng nhau xây dựng một cộng đồng học tập tuyệt vời!', 
FALSE, TRUE
FROM forum_categories c, users u 
WHERE c.name = 'Thảo luận chung' AND u.id = 1
LIMIT 1;

INSERT IGNORE INTO forum_posts (category_id, user_id, title, content, is_question, is_pinned) 
SELECT c.id, u.id, 'Làm thế nào để học lập trình hiệu quả?', 
'Mình là người mới bắt đầu học lập trình. Các bạn có thể chia sẻ kinh nghiệm học tập hiệu quả không?

Mình đang băn khoăn:
1. Nên bắt đầu từ ngôn ngữ nào?
2. Học online hay offline tốt hơn?
3. Làm sao để duy trì động lực học tập?

Cảm ơn mọi người!', 
TRUE, FALSE
FROM forum_categories c, users u 
WHERE c.name = 'Hỏi đáp lập trình' AND u.id = 1
LIMIT 1;

INSERT IGNORE INTO forum_posts (category_id, user_id, title, content, is_question, is_pinned) 
SELECT c.id, u.id, 'Chia sẻ project Todo App với React', 
'Mình vừa hoàn thành project Todo App đầu tiên với React. Đây là những tính năng chính:

✅ Thêm/xóa/sửa task
✅ Đánh dấu hoàn thành
✅ Filter theo trạng thái
✅ Local storage
✅ Responsive design

Link demo: [Demo](https://example.com)
Source code: [GitHub](https://github.com/example)

Mọi người góp ý giúp mình nhé!', 
FALSE, FALSE
FROM forum_categories c, users u 
WHERE c.name = 'Chia sẻ dự án' AND u.id = 1
LIMIT 1;

-- Insert some sample replies - only if posts exist
INSERT IGNORE INTO forum_replies (post_id, user_id, content) 
SELECT p.id, u.id, 'Chào bạn! Mình nghĩ bạn nên bắt đầu với JavaScript vì nó dễ học và có nhiều ứng dụng. Sau đó có thể học thêm React để làm frontend hoặc Node.js để làm backend.'
FROM forum_posts p, users u 
WHERE p.title = 'Làm thế nào để học lập trình hiệu quả?' AND u.id = 1
LIMIT 1;

INSERT IGNORE INTO forum_replies (post_id, user_id, content) 
SELECT p.id, u.id, 'Về việc học online vs offline, mình thấy học online linh hoạt hơn, nhưng cần có kỷ luật cao. Còn offline thì có thể tương tác trực tiếp với giảng viên.'
FROM forum_posts p, users u 
WHERE p.title = 'Làm thế nào để học lập trình hiệu quả?' AND u.id = 1
LIMIT 1;

INSERT IGNORE INTO forum_replies (post_id, user_id, content) 
SELECT p.id, u.id, 'Project nhìn rất đẹp! Bạn có thể thêm tính năng drag & drop để sắp xếp task không? Và có thể tích hợp với backend để sync data giữa các thiết bị.'
FROM forum_posts p, users u 
WHERE p.title = 'Chia sẻ project Todo App với React' AND u.id = 1
LIMIT 1;

-- Update post reply counts
UPDATE forum_posts SET replies_count = (
    SELECT COUNT(*) FROM forum_replies WHERE post_id = forum_posts.id
);

-- Update last reply info - simplified approach
UPDATE forum_posts fp SET 
    last_reply_at = (
        SELECT MAX(created_at) FROM forum_replies fr WHERE fr.post_id = fp.id
    )
WHERE EXISTS (SELECT 1 FROM forum_replies WHERE post_id = fp.id);

-- Update last reply user separately to avoid LIMIT in subquery
UPDATE forum_posts fp 
JOIN forum_replies fr ON fp.id = fr.post_id 
SET fp.last_reply_user_id = fr.user_id
WHERE fr.created_at = fp.last_reply_at;

-- Add some sample votes - only if posts exist
INSERT IGNORE INTO forum_votes (user_id, post_id, vote_type) 
SELECT u.id, p.id, 'up'
FROM users u, forum_posts p 
WHERE u.id = 1 AND p.id <= 3;

-- Update vote counts
UPDATE forum_posts SET votes_count = (
    SELECT COUNT(*) FROM forum_votes 
    WHERE post_id = forum_posts.id AND vote_type = 'up'
) - (
    SELECT COUNT(*) FROM forum_votes 
    WHERE post_id = forum_posts.id AND vote_type = 'down'
);

-- Add some tags to posts - only if posts and tags exist
INSERT IGNORE INTO forum_post_tags (post_id, tag_id) 
SELECT p.id, t.id
FROM forum_posts p, forum_tags t 
WHERE p.title = 'Làm thế nào để học lập trình hiệu quả?' AND t.name = 'JavaScript';

INSERT IGNORE INTO forum_post_tags (post_id, tag_id) 
SELECT p.id, t.id
FROM forum_posts p, forum_tags t 
WHERE p.title = 'Chia sẻ project Todo App với React' AND t.name = 'React';

INSERT IGNORE INTO forum_post_tags (post_id, tag_id) 
SELECT p.id, t.id
FROM forum_posts p, forum_tags t 
WHERE p.title = 'Chia sẻ project Todo App với React' AND t.name = 'JavaScript';

-- Update tag usage counts
UPDATE forum_tags SET usage_count = (
    SELECT COUNT(*) FROM forum_post_tags WHERE tag_id = forum_tags.id
);

-- Create indexes for better performance
CREATE INDEX idx_forum_posts_category_created ON forum_posts(category_id, created_at DESC);
CREATE INDEX idx_forum_posts_user_created ON forum_posts(user_id, created_at DESC);
CREATE INDEX idx_forum_replies_post_created ON forum_replies(post_id, created_at ASC);
CREATE INDEX idx_forum_votes_user_post ON forum_votes(user_id, post_id);
CREATE INDEX idx_forum_votes_user_reply ON forum_votes(user_id, reply_id);

-- Add foreign key constraints after all data is inserted
ALTER TABLE forum_posts 
ADD CONSTRAINT fk_forum_posts_category FOREIGN KEY (category_id) REFERENCES forum_categories(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_forum_posts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_forum_posts_last_reply_user FOREIGN KEY (last_reply_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE forum_replies 
ADD CONSTRAINT fk_forum_replies_post FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_forum_replies_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_forum_replies_parent FOREIGN KEY (parent_reply_id) REFERENCES forum_replies(id) ON DELETE CASCADE;

ALTER TABLE forum_votes 
ADD CONSTRAINT fk_forum_votes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_forum_votes_post FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_forum_votes_reply FOREIGN KEY (reply_id) REFERENCES forum_replies(id) ON DELETE CASCADE;

ALTER TABLE forum_post_tags 
ADD CONSTRAINT fk_forum_post_tags_post FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_forum_post_tags_tag FOREIGN KEY (tag_id) REFERENCES forum_tags(id) ON DELETE CASCADE;

-- Add fulltext search indexes for better search performance
-- Note: Commented out as they may cause issues in some MariaDB versions
-- ALTER TABLE forum_posts ADD FULLTEXT(title, content);
-- ALTER TABLE forum_replies ADD FULLTEXT(content);