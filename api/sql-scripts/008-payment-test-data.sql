-- Test data for payment system
-- Thêm các mã giảm giá test

-- Mã giảm 10%
INSERT INTO course_coupons (
  code, 
  description, 
  discount_type, 
  discount_value, 
  min_purchase_amount,
  valid_from, 
  valid_until, 
  usage_limit,
  is_active,
  created_at,
  updated_at
) VALUES (
  'WELCOME10',
  'Giảm 10% cho khóa học đầu tiên',
  'percentage',
  10.00,
  0,
  NOW(),
  DATE_ADD(NOW(), INTERVAL 90 DAY),
  1000,
  1,
  NOW(),
  NOW()
);

-- Mã giảm 50,000 VND
INSERT INTO course_coupons (
  code, 
  description, 
  discount_type, 
  discount_value, 
  min_purchase_amount,
  valid_from, 
  valid_until, 
  usage_limit,
  is_active,
  created_at,
  updated_at
) VALUES (
  'SAVE50K',
  'Giảm 50,000đ cho đơn hàng từ 200,000đ',
  'fixed_amount',
  50000.00,
  200000,
  NOW(),
  DATE_ADD(NOW(), INTERVAL 60 DAY),
  500,
  1,
  NOW(),
  NOW()
);

-- Mã giảm 20% cho khóa học premium
INSERT INTO course_coupons (
  code, 
  description, 
  discount_type, 
  discount_value, 
  min_purchase_amount,
  max_discount_amount,
  valid_from, 
  valid_until, 
  usage_limit,
  is_active,
  created_at,
  updated_at
) VALUES (
  'PREMIUM20',
  'Giảm 20% cho khóa học Premium (tối đa 100,000đ)',
  'percentage',
  20.00,
  300000,
  100000,
  NOW(),
  DATE_ADD(NOW(), INTERVAL 30 DAY),
  200,
  1,
  NOW(),
  NOW()
);

-- Mã giảm đặc biệt 30%
INSERT INTO course_coupons (
  code, 
  description, 
  discount_type, 
  discount_value, 
  min_purchase_amount,
  valid_from, 
  valid_until, 
  usage_limit,
  is_active,
  created_at,
  updated_at
) VALUES (
  'SPECIAL30',
  'Mã giảm giá đặc biệt 30%',
  'percentage',
  30.00,
  500000,
  NOW(),
  DATE_ADD(NOW(), INTERVAL 7 DAY),
  50,
  1,
  NOW(),
  NOW()
);

-- Mã giảm 100,000 VND cho khóa học cao cấp
INSERT INTO course_coupons (
  code, 
  description, 
  discount_type, 
  discount_value, 
  min_purchase_amount,
  valid_from, 
  valid_until, 
  usage_limit,
  is_active,
  created_at,
  updated_at
) VALUES (
  'VIP100K',
  'Giảm 100,000đ cho khóa học từ 1,000,000đ',
  'fixed_amount',
  100000.00,
  1000000,
  NOW(),
  DATE_ADD(NOW(), INTERVAL 45 DAY),
  100,
  1,
  NOW(),
  NOW()
);

-- Cập nhật một số khóa học để có giá (nếu chưa có)
UPDATE courses 
SET 
  price = 299000,
  original_price = 399000,
  discount = 25
WHERE id = 1 AND (price IS NULL OR price = 0);

UPDATE courses 
SET 
  price = 499000,
  original_price = 699000,
  discount = 29
WHERE id = 2 AND (price IS NULL OR price = 0);

UPDATE courses 
SET 
  price = 799000,
  original_price = 999000,
  discount = 20
WHERE id = 3 AND (price IS NULL OR price = 0);

-- Thêm một khóa học test có phí
INSERT INTO courses (
  title,
  description,
  thumbnail,
  level,
  duration,
  price,
  original_price,
  discount,
  category_id,
  instructor_id,
  status,
  is_premium,
  students,
  rating,
  created_at,
  updated_at
) VALUES (
  'Khóa học Test Thanh toán',
  'Khóa học này dùng để test hệ thống thanh toán. Bao gồm VNPay và chuyển khoản ngân hàng.',
  'https://placehold.co/600x400/667eea/white?text=Payment+Test',
  'Beginner',
  120,
  199000,
  299000,
  33,
  1,
  1,
  'published',
  1,
  0,
  5.0,
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE title = title;

-- Lấy ID của khóa học vừa tạo và thêm module + lesson
SET @test_course_id = LAST_INSERT_ID();

-- Thêm module cho khóa học test
INSERT INTO course_modules (
  course_id,
  title,
  position,
  created_at,
  updated_at
) VALUES (
  @test_course_id,
  'Module 1: Giới thiệu',
  1,
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE title = title;

SET @test_module_id = LAST_INSERT_ID();

-- Thêm lesson cho module test
INSERT INTO course_lessons (
  module_id,
  title,
  type,
  content,
  duration,
  position,
  created_at,
  updated_at
) VALUES (
  @test_module_id,
  'Bài 1: Hướng dẫn thanh toán',
  'video',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  15,
  1,
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE title = title;

-- Hiển thị thông tin các mã giảm giá
SELECT 
  code,
  description,
  discount_type,
  discount_value,
  min_purchase_amount,
  max_discount_amount,
  valid_from,
  valid_until,
  usage_limit,
  used_count,
  is_active
FROM course_coupons
WHERE is_active = 1
ORDER BY created_at DESC;
