CREATE TABLE IF NOT EXISTS `course_payments` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `course_id` BIGINT NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `original_amount` DECIMAL(10, 2) NOT NULL,
  `discount_amount` DECIMAL(10, 2) DEFAULT 0,
  `payment_method` ENUM('credit_card', 'debit_card', 'bank_transfer', 'e_wallet', 'paypal', 'momo', 'vnpay', 'zalopay') NOT NULL,
  `payment_status` ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled') DEFAULT 'pending' NOT NULL,
  `transaction_id` VARCHAR(255) UNIQUE,
  `payment_gateway` VARCHAR(100),
  `payment_date` DATETIME,
  `refund_date` DATETIME,
  `refund_reason` TEXT,
  `notes` TEXT,
  `metadata` JSON,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE,
  
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_course_id` (`course_id`),
  INDEX `idx_payment_status` (`payment_status`),
  INDEX `idx_transaction_id` (`transaction_id`),
  INDEX `idx_payment_date` (`payment_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `course_coupons` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `code` VARCHAR(50) UNIQUE NOT NULL,
  `description` TEXT,
  `discount_type` ENUM('percentage', 'fixed_amount') NOT NULL,
  `discount_value` DECIMAL(10, 2) NOT NULL,
  `min_purchase_amount` DECIMAL(10, 2) DEFAULT 0,
  `max_discount_amount` DECIMAL(10, 2),
  `usage_limit` INT,
  `used_count` INT DEFAULT 0,
  `valid_from` DATETIME NOT NULL,
  `valid_until` DATETIME NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE NOT NULL,
  `applicable_courses` JSON,
  `created_by` BIGINT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  
  INDEX `idx_code` (`code`),
  INDEX `idx_valid_dates` (`valid_from`, `valid_until`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `coupon_usage` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `coupon_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `payment_id` BIGINT NOT NULL,
  `discount_amount` DECIMAL(10, 2) NOT NULL,
  `used_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`coupon_id`) REFERENCES `course_coupons`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`payment_id`) REFERENCES `course_payments`(`id`) ON DELETE CASCADE,
  
  UNIQUE KEY `unique_user_coupon_payment` (`user_id`, `coupon_id`, `payment_id`),
  INDEX `idx_coupon_id` (`coupon_id`),
  INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `course_enrollments`
  ADD COLUMN IF NOT EXISTS `payment_id` BIGINT,
  ADD COLUMN IF NOT EXISTS `enrollment_type` ENUM('free', 'paid', 'gifted') DEFAULT 'free' NOT NULL;

ALTER TABLE `course_enrollments`
  ADD CONSTRAINT `fk_enrollment_payment` FOREIGN KEY (`payment_id`) REFERENCES `course_payments`(`id`) ON DELETE SET NULL;

ALTER TABLE `course_enrollments`
  ADD INDEX IF NOT EXISTS `idx_payment_id` (`payment_id`),
  ADD INDEX IF NOT EXISTS `idx_enrollment_type` (`enrollment_type`);

INSERT INTO `course_coupons` (`code`, `description`, `discount_type`, `discount_value`, `min_purchase_amount`, `max_discount_amount`, `usage_limit`, `valid_from`, `valid_until`, `is_active`) VALUES
('WELCOME50', 'Giảm 50% cho khóa học đầu tiên', 'percentage', 50.00, 0, 500000, 100, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), TRUE),
('NEWYEAR2024', 'Giảm 200k cho đơn hàng từ 500k', 'fixed_amount', 200000.00, 500000, NULL, 500, NOW(), DATE_ADD(NOW(), INTERVAL 60 DAY), TRUE),
('STUDENT30', 'Giảm 30% cho sinh viên', 'percentage', 30.00, 0, 300000, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), TRUE);
