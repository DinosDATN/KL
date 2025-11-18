# Debug Hướng Dẫn - Vấn Đề Progress Không Cập Nhật

## Vấn Đề

Progress không được cập nhật khi hoàn thành lesson và không lưu vào database.

## Các Bước Debug

### 1. Kiểm Tra Database Schema

```bash
# Kiểm tra bảng course_lesson_completions có tồn tại không
mysql -u root -p lfys_db -e "SHOW TABLES LIKE 'course_lesson_completions';"

# Kiểm tra cấu trúc bảng
mysql -u root -p lfys_db -e "DESCRIBE course_lesson_completions;"

# Kiểm tra dữ liệu
mysql -u root -p lfys_db -e "SELECT * FROM course_lesson_completions;"
```

**Nếu bảng không tồn tại:**
```bash
cd api
mysql -u root -p lfys_db < sql-scripts/006-course-lesson-completion.sql
```

### 2. Kiểm Tra Model Đã Load

Khởi động API server và xem log:

```bash
cd api
npm run dev
```

Không có lỗi về model là OK.

### 3. Test Trực Tiếp Với Script

#### 3.1. Test Progress Update Logic

```bash
# Syntax: node test-progress-update.js <userId> <courseId> <lessonId>
node test-progress-update.js 1 1 1
```

Script này sẽ:
- ✅ Tạo enrollment nếu chưa có
- ✅ Tạo completion record
- ✅ Tính toán progress
- ✅ Cập nhật enrollment
- ✅ Verify trong database

**Kết quả mong đợi:**
```
✅ SUCCESS: Progress was saved correctly to database!
```

#### 3.2. Debug Enrollment Data

```bash
# Syntax: node debug-enrollment-db.js <userId> <courseId>
node debug-enrollment-db.js 1 1
```

Script này sẽ hiển thị:
- Enrollment hiện tại
- Tất cả lesson completions
- So sánh progress expected vs actual

#### 3.3. Test Qua API

```bash
# Chạy test API đầy đủ
node test-lesson-completion.js
```

Script này sẽ:
1. Login
2. Enroll course
3. Get progress BEFORE
4. Complete a lesson
5. Get progress AFTER
6. So sánh kết quả

### 4. Kiểm Tra API Logs

Khi gọi API complete lesson, xem log trong terminal API server:

```
[completeLesson] User 1 completing lesson 1 in course 1
[completeLesson] Current enrollment progress: 0%, status: not-started
[completeLesson] Lesson found: Introduction to Programming
[completeLesson] Created new completion record with ID: 1
[completeLesson] Updating status from not-started to in-progress
[completeLesson] Recalculating progress...
[completeLesson] Completed lesson IDs: [1]
[completeLesson] Calculated progress: 5% (1/20)
[completeLesson] Updating enrollment progress from 0% to 5%
[completeLesson] Enrollment saved successfully
[completeLesson] Final enrollment progress in DB: 5%
```

**Nếu không thấy log này:**
- API server chưa được restart sau khi update code
- Restart lại: `npm run dev`

### 5. Kiểm Tra Trực Tiếp Trong Database

```sql
-- Kiểm tra enrollment
SELECT * FROM course_enrollments WHERE user_id = 1 AND course_id = 1;

-- Kiểm tra completions
SELECT * FROM course_lesson_completions WHERE user_id = 1 AND course_id = 1;

-- Tính progress thủ công
SELECT 
  ce.id,
  ce.progress as stored_progress,
  ce.status,
  COUNT(clc.id) as completed_lessons,
  (SELECT COUNT(*) 
   FROM course_lessons cl 
   JOIN course_modules cm ON cl.module_id = cm.id 
   WHERE cm.course_id = 1) as total_lessons,
  ROUND((COUNT(clc.id) * 100.0 / (SELECT COUNT(*) 
   FROM course_lessons cl 
   JOIN course_modules cm ON cl.module_id = cm.id 
   WHERE cm.course_id = 1)), 0) as calculated_progress
FROM course_enrollments ce
LEFT JOIN course_lesson_completions clc 
  ON ce.user_id = clc.user_id AND ce.course_id = clc.course_id
WHERE ce.user_id = 1 AND ce.course_id = 1
GROUP BY ce.id;
```

### 6. Các Vấn Đề Thường Gặp

#### Vấn đề 1: Bảng không tồn tại
**Triệu chứng:** Error "Table 'course_lesson_completions' doesn't exist"

**Giải pháp:**
```bash
mysql -u root -p lfys_db < api/sql-scripts/006-course-lesson-completion.sql
```

#### Vấn đề 2: Model không load
**Triệu chứng:** Error "CourseLessonCompletion is not defined"

**Giải pháp:**
1. Kiểm tra file `api/src/models/CourseLessonCompletion.js` có tồn tại
2. Kiểm tra file `api/src/models/index.js` có import model
3. Restart API server

#### Vấn đề 3: Progress không cập nhật
**Triệu chứng:** API trả về success nhưng progress vẫn 0%

**Kiểm tra:**
```bash
# Chạy test trực tiếp
node test-progress-update.js 1 1 1

# Xem log API server khi gọi complete lesson
# Phải thấy log "[completeLesson] ..."
```

**Nguyên nhân có thể:**
- Không có lesson nào trong course (totalLessons = 0)
- Lesson không thuộc course đó
- Enrollment không tồn tại

#### Vấn đề 4: Associations không đúng
**Triệu chứng:** Error về include/associations

**Giải pháp:**
Kiểm tra file `api/src/models/index.js` có đầy đủ associations:
```javascript
// Course lesson completion associations
CourseLessonCompletion.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

CourseLessonCompletion.belongsTo(Course, {
  foreignKey: "course_id",
  as: "Course",
});

CourseLessonCompletion.belongsTo(CourseLesson, {
  foreignKey: "lesson_id",
  as: "Lesson",
});
```

### 7. Test Từng Bước

#### Bước 1: Tạo enrollment thủ công
```sql
INSERT INTO course_enrollments (user_id, course_id, progress, status, start_date, created_at, updated_at)
VALUES (1, 1, 0, 'not-started', NOW(), NOW(), NOW());
```

#### Bước 2: Tạo completion thủ công
```sql
INSERT INTO course_lesson_completions (user_id, course_id, lesson_id, time_spent, completed_at, created_at, updated_at)
VALUES (1, 1, 1, 300, NOW(), NOW(), NOW());
```

#### Bước 3: Cập nhật progress thủ công
```sql
UPDATE course_enrollments 
SET progress = 5, status = 'in-progress', updated_at = NOW()
WHERE user_id = 1 AND course_id = 1;
```

#### Bước 4: Verify
```sql
SELECT * FROM course_enrollments WHERE user_id = 1 AND course_id = 1;
```

Nếu các bước thủ công hoạt động, vấn đề nằm ở code logic.

### 8. Checklist Hoàn Chỉnh

- [ ] Bảng `course_lesson_completions` đã được tạo
- [ ] Model `CourseLessonCompletion` tồn tại
- [ ] Model được import trong `index.js`
- [ ] Associations được định nghĩa
- [ ] API server đã restart sau khi update code
- [ ] Course có lessons (totalLessons > 0)
- [ ] User đã enroll course
- [ ] Lesson thuộc về course đó
- [ ] API trả về success khi complete lesson
- [ ] Log hiển thị progress được tính toán
- [ ] Database có record trong `course_lesson_completions`
- [ ] Database có progress được cập nhật trong `course_enrollments`

### 9. Liên Hệ Hỗ Trợ

Nếu vẫn gặp vấn đề, cung cấp thông tin sau:

1. **Output của test script:**
```bash
node test-progress-update.js 1 1 1 > test-output.txt 2>&1
```

2. **API logs khi complete lesson**

3. **Database state:**
```sql
SELECT * FROM course_enrollments WHERE user_id = 1;
SELECT * FROM course_lesson_completions WHERE user_id = 1;
SELECT COUNT(*) FROM course_lessons cl 
JOIN course_modules cm ON cl.module_id = cm.id 
WHERE cm.course_id = 1;
```

4. **API response khi gọi complete lesson**

## Kết Luận

Hệ thống đã được thiết kế để tự động:
1. ✅ Lưu lesson completion vào database
2. ✅ Tính toán progress dựa trên số lesson hoàn thành
3. ✅ Cập nhật enrollment progress
4. ✅ Tự động chuyển status (not-started → in-progress → completed)

Nếu làm theo các bước debug trên, bạn sẽ tìm ra vấn đề!
