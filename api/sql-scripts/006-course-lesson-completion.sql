-- Create table for tracking lesson completion
CREATE TABLE IF NOT EXISTS `course_lesson_completions` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `course_id` BIGINT NOT NULL,
  `lesson_id` BIGINT NOT NULL,
  `completed_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `time_spent` INT DEFAULT 0 COMMENT 'Time spent in seconds',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`lesson_id`) REFERENCES `course_lessons`(`id`) ON DELETE CASCADE,
  
  UNIQUE KEY `unique_user_lesson` (`user_id`, `lesson_id`),
  INDEX `idx_user_course` (`user_id`, `course_id`),
  INDEX `idx_lesson` (`lesson_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
