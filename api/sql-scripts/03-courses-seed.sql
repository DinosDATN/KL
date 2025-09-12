-- Insert course categories
INSERT INTO course_categories (id, name, description, created_at, updated_at) VALUES
(1, 'Web Development', 'Learn to build modern web applications', NOW(), NOW()),
(2, 'Data Science', 'Data analysis, machine learning, and AI', NOW(), NOW()),
(3, 'Mobile Development', 'Build mobile apps for iOS and Android', NOW(), NOW()),
(4, 'Programming Languages', 'Master programming languages', NOW(), NOW());

-- Insert sample courses
INSERT INTO courses (id, instructor_id, title, thumbnail, publish_date, status, revenue, students, rating, description, level, duration, category_id, is_premium, is_deleted, price, original_price, discount, created_at, updated_at) VALUES
(1, 101, 'Angular for Beginners', 'https://placehold.co/600x400?text=Angular', '2024-02-01', 'published', 1200, 150, 4.7, 'A complete guide to Angular basics and best practices.', 'Beginner', 12, 1, false, false, 0, 299000, 100, NOW(), NOW()),
(2, 102, 'Machine Learning 101', 'https://placehold.co/600x400?text=ML', '2024-03-01', 'published', 2500, 200, 4.9, 'Introduction to machine learning concepts and algorithms.', 'Beginner', 15, 2, true, false, 499000, 599000, 17, NOW(), NOW()),
(3, 101, 'React Development Mastery', 'https://placehold.co/600x400?text=React', '2024-01-15', 'published', 1800, 89, 4.5, 'Master React development with hooks, context, and best practices.', 'Intermediate', 18, 1, true, false, 399000, 399000, 0, NOW(), NOW()),
(4, 102, 'Python Data Science', 'https://placehold.co/600x400?text=Python+DS', '2024-03-15', 'published', 3200, 245, 4.8, 'Complete Python data science course with pandas, numpy, and visualization.', 'Intermediate', 20, 2, true, false, 599000, 799000, 25, NOW(), NOW()),
(5, 101, 'JavaScript ES6+ Modern Features', 'https://placehold.co/600x400?text=JavaScript', '2024-02-20', 'published', 800, 67, 4.3, 'Learn modern JavaScript features including async/await, destructuring, and modules.', 'Beginner', 8, 1, false, false, 0, 199000, 100, NOW(), NOW()),
(6, 102, 'Advanced Deep Learning', 'https://placehold.co/600x400?text=Deep+Learning', '2024-04-01', 'published', 4200, 156, 4.9, 'Deep dive into neural networks, CNNs, RNNs, and advanced deep learning techniques.', 'Advanced', 25, 2, true, false, 899000, 1199000, 25, NOW(), NOW());

-- Insert course modules
INSERT INTO course_modules (id, course_id, title, position, created_at, updated_at) VALUES
(1, 1, 'Getting Started', 1, NOW(), NOW()),
(2, 1, 'Components & Templates', 2, NOW(), NOW()),
(3, 1, 'Services & Dependency Injection', 3, NOW(), NOW()),
(4, 2, 'ML Basics', 1, NOW(), NOW()),
(5, 2, 'Supervised Learning', 2, NOW(), NOW()),
(6, 3, 'React Fundamentals', 1, NOW(), NOW()),
(7, 3, 'Advanced React', 2, NOW(), NOW());

-- Insert course lessons
INSERT INTO course_lessons (id, module_id, title, content, duration, position, type, created_at, updated_at) VALUES
-- Angular Course Lessons
(1, 1, 'Introduction to Angular', 'https://www.youtube.com/watch?v=k5E2AVpwsko', 20, 1, 'video', NOW(), NOW()),
(2, 1, 'Setting up Development Environment', '## Setting up Angular Development Environment\n\n### Prerequisites\n- Node.js (v16 or higher)\n- npm or yarn package manager\n- Code editor (VS Code recommended)\n\n### Installation Steps\n1. Install Node.js from nodejs.org\n2. Install Angular CLI globally:\n   ```bash\n   npm install -g @angular/cli\n   ```\n3. Verify installation:\n   ```bash\n   ng version\n   ```\n\n### Creating Your First Project\n```bash\nng new my-angular-app\ncd my-angular-app\nng serve\n```\n\nYour Angular app will be available at http://localhost:4200', 15, 2, 'document', NOW(), NOW()),
(3, 2, 'Component Basics', '## Angular Components\n\n### What is a Component?\nA component is a TypeScript class decorated with @Component that controls a patch of the screen called a view.\n\n### Component Structure\n- **Template**: HTML that defines the view\n- **Class**: TypeScript code that handles data and logic\n- **Styles**: CSS that defines appearance\n\n### Example Component\n```typescript\nimport { Component } from ''@angular/core'';\n\n@Component({\n  selector: ''app-hello'',\n  template: ''<h1>Hello {{name}}!</h1>'',\n  styles: [''h1 { color: blue; }'']\n})\nexport class HelloComponent {\n  name = ''Angular'';\n}\n```\n\n### Key Concepts\n- Data binding\n- Event handling\n- Component lifecycle\n- Input/Output properties', 30, 1, 'document', NOW(), NOW()),
(4, 2, 'Component Practice Quiz', 'Test your understanding of Angular components with this interactive quiz.\n\nQuestions will cover:\n- Component decoration\n- Data binding syntax\n- Component lifecycle hooks\n- Best practices\n\nScore 80% or higher to pass!', 10, 2, 'quiz', NOW(), NOW()),
-- Machine Learning Course Lessons  
(5, 4, 'What is Machine Learning?', 'https://www.youtube.com/watch?v=ukzFI9rgwfU', 25, 1, 'video', NOW(), NOW()),
(6, 4, 'Types of Machine Learning', '## Types of Machine Learning\n\n### 1. Supervised Learning\n- **Definition**: Learning with labeled training data\n- **Examples**: Classification, Regression\n- **Use cases**: Email spam detection, house price prediction\n- **Algorithms**: Linear Regression, Decision Trees, Random Forest\n\n### 2. Unsupervised Learning\n- **Definition**: Finding patterns in data without labels\n- **Examples**: Clustering, Dimensionality Reduction\n- **Use cases**: Customer segmentation, anomaly detection\n- **Algorithms**: K-Means, PCA, DBSCAN\n\n### 3. Reinforcement Learning\n- **Definition**: Learning through interaction and feedback\n- **Examples**: Game playing, robotics\n- **Use cases**: Autonomous vehicles, recommendation systems\n- **Algorithms**: Q-Learning, Policy Gradient\n\n### Key Differences\n| Type | Data | Goal | Examples |\n|------|------|------|---------|\n| Supervised | Labeled | Predict | Classification, Regression |\n| Unsupervised | Unlabeled | Discover | Clustering, Association |\n| Reinforcement | Rewards/Penalties | Optimize | Game AI, Robotics |', 20, 2, 'document', NOW(), NOW()),
(7, 4, 'ML Fundamentals Assessment', 'Evaluate your understanding of machine learning fundamentals.\n\nThis assessment covers:\n- Definition and importance of ML\n- Supervised vs Unsupervised vs Reinforcement Learning\n- Common algorithms and their applications\n- Real-world ML examples\n\nComplete all questions to proceed to the next module.', 15, 3, 'exercise', NOW(), NOW());

-- Insert course reviews
INSERT INTO course_reviews (id, course_id, user_id, rating, comment, helpful, not_helpful, verified, created_at, updated_at) VALUES
(1, 1, 201, 5, 'Rất hay và dễ hiểu!', 10, 0, true, NOW(), NOW()),
(2, 1, 202, 4, 'Nội dung tốt nhưng hơi nhanh', 5, 1, true, NOW(), NOW()),
(3, 2, 203, 5, 'Khóa học xuất sắc về Machine Learning', 15, 0, true, NOW(), NOW()),
(4, 2, 204, 4, 'Nội dung tốt, nên có thêm ví dụ.', 5, 1, true, NOW(), NOW()),
(5, 3, 205, 5, 'React course tuyệt vời!', 8, 0, true, NOW(), NOW()),
(6, 4, 206, 5, 'Python Data Science rất hữu ích', 12, 0, true, NOW(), NOW());

-- Insert instructor qualifications
INSERT INTO instructor_qualifications (id, user_id, title, institution, date, credential_url, created_at, updated_at) VALUES
(1, 101, 'MSc Computer Science', 'HUST', '2020-06-01', null, NOW(), NOW()),
(2, 101, 'Certified Angular Developer', 'Google', '2021-03-15', 'https://example.com/cert1', NOW(), NOW()),
(3, 102, 'PhD in Machine Learning', 'MIT', '2018-05-20', null, NOW(), NOW()),
(4, 102, 'Data Science Certification', 'Coursera', '2019-08-10', 'https://example.com/cert2', NOW(), NOW());

-- Insert course enrollments (sample data)
INSERT INTO course_enrollments (id, user_id, course_id, progress, status, start_date, completion_date, rating, created_at, updated_at) VALUES
(1, 201, 1, 80, 'in-progress', '2024-02-10', null, 5, NOW(), NOW()),
(2, 202, 2, 100, 'completed', '2024-03-10', '2024-04-01', 4, NOW(), NOW()),
(3, 203, 3, 45, 'in-progress', '2024-03-15', null, null, NOW(), NOW()),
(4, 204, 4, 100, 'completed', '2024-03-20', '2024-04-15', 5, NOW(), NOW());
