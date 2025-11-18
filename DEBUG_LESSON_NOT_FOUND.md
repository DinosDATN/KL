# Debug: Không Tìm Thấy Bài Học

## Vấn Đề

Khi truy cập `http://localhost:4200/courses/1/lessons/1`, trang hiển thị "Không tìm thấy bài học".

## Nguyên Nhân Có Thể

1. **Lesson không tồn tại trong database** với ID được yêu cầu
2. **Lesson có `module_id` không khớp** với modules của course
3. **Lesson bị filter ra** do điều kiện nào đó (status, is_deleted, etc.)
4. **Type mismatch**: Frontend tìm lesson với `id` là number nhưng database lưu là string

## Các Bước Debug

### Bước 1: Kiểm Tra Database

Chạy query SQL để xem lessons trong database:

```sql
-- Xem tất cả lessons của course 1
SELECT 
  l.id,
  l.title,
  l.module_id,
  l.type,
  l.duration,
  l.position,
  l.status,
  l.is_deleted,
  m.title as module_title,
  m.course_id
FROM course_lessons l
LEFT JOIN course_modules m ON l.module_id = m.id
WHERE m.course_id = 1
ORDER BY m.position, l.position;

-- Kiểm tra lesson cụ thể
SELECT * FROM course_lessons WHERE id = 1;

-- Kiểm tra modules của course 1
SELECT id, title, course_id, position 
FROM course_modules 
WHERE course_id = 1
ORDER BY position;
```

### Bước 2: Test API Endpoint

Sử dụng script test đã tạo:

```bash
node test-course-lessons.js
```

Hoặc test bằng curl/Postman:

```bash
# Get course details
curl http://localhost:3000/api/courses/1/details

# Kiểm tra response có lessons không
```

### Bước 3: Kiểm Tra Console Log

Mở DevTools trong browser và xem console khi truy cập trang lesson. Tìm log:

```
🔍 Lesson search: {
  requestedLessonId: 1,
  foundLesson: null,  // ← Nếu null thì lesson không được tìm thấy
  lessonIndex: -1,
  totalLessons: X,
  allLessonIds: [...]  // ← Xem IDs có sẵn
}
```

### Bước 4: Kiểm Tra Type Mismatch

Vấn đề phổ biến là ID từ URL là string nhưng so sánh với number:

```typescript
// Trong component
const lessonId = Number(params.get('lessonId')); // ✅ Convert to number

// Trong find
this.currentLesson = this.courseLessons.find((l) => l.id === lessonId);
// Nếu l.id là string và lessonId là number → không match!
```

## Giải Pháp

### Giải Pháp 1: Tạo Dữ Liệu Mẫu

Nếu database chưa có lessons, tạo dữ liệu mẫu:

```sql
-- Tạo module mẫu
INSERT INTO course_modules (course_id, title, description, position, status, created_at, updated_at)
VALUES (1, 'Module 1: Giới thiệu', 'Module giới thiệu khóa học', 1, 'published', NOW(), NOW());

-- Lấy ID của module vừa tạo (giả sử là 1)
SET @module_id = LAST_INSERT_ID();

-- Tạo lessons mẫu
INSERT INTO course_lessons (module_id, title, description, type, content_url, duration, position, status, created_at, updated_at)
VALUES 
  (@module_id, 'Bài 1: Giới thiệu khóa học', 'Bài học giới thiệu', 'video', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 10, 1, 'published', NOW(), NOW()),
  (@module_id, 'Bài 2: Cài đặt môi trường', 'Hướng dẫn cài đặt', 'video', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 15, 2, 'published', NOW(), NOW()),
  (@module_id, 'Bài 3: Bài tập thực hành', 'Bài tập đầu tiên', 'document', NULL, 20, 3, 'published', NOW(), NOW());
```

### Giải Pháp 2: Sửa Type Mismatch

Đảm bảo so sánh đúng type trong component:

```typescript
// Trong loadCourseData
const lessonId = Number(params.get('lessonId'));

// Trong find - thêm logging
this.currentLesson = this.courseLessons.find((l) => {
  console.log('Comparing:', l.id, typeof l.id, 'with', lessonId, typeof lessonId);
  return l.id === lessonId;
}) || null;
```

### Giải Pháp 3: Fallback to First Lesson

Nếu lesson không tìm thấy, redirect về lesson đầu tiên:

```typescript
// Find current lesson
this.currentLesson = this.courseLessons.find((l) => l.id === lessonId) || null;

// If not found, redirect to first lesson
if (!this.currentLesson && this.courseLessons.length > 0) {
  console.warn(`Lesson ${lessonId} not found, redirecting to first lesson`);
  const firstLesson = this.courseLessons[0];
  this.router.navigate(['/courses', courseId, 'lessons', firstLesson.id]);
  return;
}

// If still no lesson, show error
if (!this.currentLesson) {
  this.error = `Không tìm thấy bài học với ID ${lessonId} trong khóa học này`;
  return;
}
```

## Files Đã Sửa

### 1. `cli/src/app/features/courses/lesson-learning/lesson-learning.component.ts`

**Thêm logging và error handling:**
- Log chi tiết khi tìm lesson
- Hiển thị error message cụ thể khi không tìm thấy
- Kiểm tra và log tất cả lesson IDs có sẵn

### 2. `cli/src/app/features/courses/lesson-learning/lesson-learning.component.html`

**Cải thiện error display:**
- Tách error state và not found state
- Hiển thị error message cụ thể từ component
- Thêm button quay về khóa học

### 3. `test-course-lessons.js`

**Script test để debug:**
- Kiểm tra course details API
- Liệt kê tất cả modules và lessons
- Phát hiện orphaned lessons
- Test truy cập lesson cụ thể

## Cách Sử Dụng

### 1. Chạy Test Script

```bash
node test-course-lessons.js
```

Xem output để biết:
- Course có bao nhiêu modules và lessons
- Lesson IDs có sẵn
- Có orphaned lessons không

### 2. Truy Cập Trang Lesson

```
http://localhost:4200/courses/1/lessons/1
```

Mở DevTools Console và xem logs:
- `🔍 Lesson search:` - Thông tin tìm kiếm lesson
- `❌ Lesson not found:` - Nếu không tìm thấy

### 3. Kiểm Tra Error Message

Nếu hiển thị error, đọc message để biết:
- "Không tìm thấy bài học với ID X" → Lesson không tồn tại
- "Bạn cần đăng ký khóa học" → Chưa enroll
- "Không thể kiểm tra đăng ký" → Lỗi API

## Checklist Debug

- [ ] Kiểm tra database có lessons không
- [ ] Chạy test script để xem API response
- [ ] Kiểm tra console logs trong browser
- [ ] Verify lesson IDs trong database vs URL
- [ ] Kiểm tra type của lesson.id (string vs number)
- [ ] Verify user đã enroll course chưa
- [ ] Kiểm tra modules có đúng course_id không
- [ ] Verify lessons có đúng module_id không

## Kết Luận

Sau khi debug, bạn sẽ biết chính xác:
1. Lessons có tồn tại trong database không
2. Lesson IDs nào có sẵn
3. Vấn đề nằm ở đâu (database, API, hoặc frontend)
4. Cách fix cụ thể cho trường hợp của bạn
