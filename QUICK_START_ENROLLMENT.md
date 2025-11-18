# Hướng Dẫn Nhanh - Hệ Thống Enrollment

## Bước 1: Chạy Migration Database

```bash
cd api
mysql -u root -p lfys_db < sql-scripts/006-course-lesson-completion.sql
```

Hoặc nếu dùng Docker:

```bash
cd api
docker exec -i lfys-mysql mysql -u root -proot lfys_db < sql-scripts/006-course-lesson-completion.sql
```

## Bước 2: Khởi Động Lại API Server

```bash
cd api
npm run dev
```

## Bước 3: Test API

### 3.1. Đăng nhập để lấy token

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

Lưu token từ response.

### 3.2. Đăng ký khóa học

```bash
curl -X POST http://localhost:3000/api/v1/course-enrollments/1/enroll \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3.3. Kiểm tra tiến độ

```bash
curl -X GET http://localhost:3000/api/v1/course-enrollments/1/progress \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3.4. Hoàn thành bài học

```bash
curl -X POST http://localhost:3000/api/v1/course-enrollments/1/lessons/1/complete \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"timeSpent": 300}'
```

## Bước 4: Chạy Test Script (Tùy chọn)

```bash
# Cập nhật thông tin test user trong file test-course-enrollment.js
# Sau đó chạy:
node test-course-enrollment.js
```

## Bước 5: Kiểm Tra Trong Database

```sql
-- Xem enrollments
SELECT * FROM course_enrollments;

-- Xem lesson completions
SELECT * FROM course_lesson_completions;

-- Xem tiến độ của user
SELECT 
  u.name,
  c.title,
  ce.progress,
  ce.status,
  COUNT(clc.id) as completed_lessons
FROM course_enrollments ce
JOIN users u ON ce.user_id = u.id
JOIN courses c ON ce.course_id = c.id
LEFT JOIN course_lesson_completions clc ON ce.user_id = clc.user_id AND ce.course_id = clc.course_id
GROUP BY ce.id;
```

## Các Endpoints Quan Trọng

### Public (Không cần đăng nhập)
- `GET /api/v1/courses` - Danh sách khóa học
- `GET /api/v1/courses/:id` - Chi tiết khóa học
- `GET /api/v1/courses/:id/details` - Chi tiết đầy đủ

### Protected (Cần đăng nhập)
- `POST /api/v1/course-enrollments/:courseId/enroll` - Đăng ký
- `GET /api/v1/course-enrollments/my-enrollments` - Khóa học của tôi
- `GET /api/v1/course-enrollments/:courseId/progress` - Tiến độ
- `POST /api/v1/course-enrollments/:courseId/lessons/:lessonId/complete` - Hoàn thành bài
- `GET /api/v1/course-enrollments/dashboard` - Dashboard học tập

### Protected Content (Cần enrollment)
- `GET /api/v1/courses/:id/modules` - Modules (cần đăng ký)
- `GET /api/v1/courses/:id/lessons` - Lessons (cần đăng ký)
- `GET /api/v1/courses/lessons/:lessonId` - Chi tiết lesson (cần đăng ký)

## Lưu Ý

1. **Token Authentication**: Tất cả protected endpoints cần JWT token trong header
2. **Enrollment Required**: Phải đăng ký khóa học trước khi xem nội dung
3. **Progress Auto-Update**: Tiến độ tự động cập nhật khi hoàn thành bài học
4. **Status Auto-Change**: Trạng thái tự động chuyển từ not-started -> in-progress -> completed

## Troubleshooting

### Lỗi "Table doesn't exist"
```bash
# Chạy lại migration
mysql -u root -p lfys_db < api/sql-scripts/006-course-lesson-completion.sql
```

### Lỗi "401 Unauthorized"
- Kiểm tra token có hợp lệ không
- Kiểm tra token có trong header không
- Đăng nhập lại để lấy token mới

### Lỗi "403 Forbidden"
- User chưa đăng ký khóa học
- Gọi API enroll trước

### Lỗi "Module not found"
- Khởi động lại API server
- Kiểm tra file CourseLessonCompletion.js đã được tạo chưa

## Kiểm Tra Nhanh

```bash
# 1. Kiểm tra API đang chạy
curl http://localhost:3000/api/v1/courses

# 2. Kiểm tra database
mysql -u root -p lfys_db -e "SHOW TABLES LIKE 'course%';"

# 3. Kiểm tra model đã load
# Xem log khi start API server, không có lỗi là OK
```

## Hoàn Thành! 🎉

Hệ thống enrollment đã sẵn sàng. Bây giờ bạn có thể:
- ✅ Đăng ký khóa học
- ✅ Theo dõi tiến độ
- ✅ Hoàn thành bài học
- ✅ Xem dashboard học tập
- ✅ Bảo vệ nội dung khóa học
