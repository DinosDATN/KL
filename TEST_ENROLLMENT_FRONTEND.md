# Test Hệ Thống Enrollment - Frontend

## Những Gì Đã Được Cập Nhật

### 1. CoursesService (`cli/src/app/core/services/courses.service.ts`)
Đã thêm 6 methods mới:
- ✅ `enrollCourse(courseId)` - Đăng ký khóa học
- ✅ `checkEnrollment(courseId)` - Kiểm tra đã đăng ký chưa
- ✅ `getMyEnrollments(status?)` - Lấy danh sách khóa học đã đăng ký
- ✅ `getCourseProgress(courseId)` - Lấy tiến độ khóa học
- ✅ `completeLesson(courseId, lessonId, timeSpent)` - Đánh dấu hoàn thành bài học
- ✅ `getLearningDashboard()` - Lấy dashboard học tập

### 2. LessonLearningComponent (`cli/src/app/features/courses/lesson-learning/`)
Đã cập nhật:
- ✅ Kiểm tra enrollment trước khi cho phép học
- ✅ Load progress từ server thay vì localStorage
- ✅ Gọi API khi đánh dấu hoàn thành bài học
- ✅ Tự động cập nhật progress từ server
- ✅ Theo dõi thời gian học (time tracking)
- ✅ Hiển thị progress từ database

## Cách Test

### Bước 1: Đảm Bảo Backend Đang Chạy

```bash
cd api
npm run dev
```

Kiểm tra API hoạt động:
```bash
curl http://localhost:3000/api/v1/courses
```

### Bước 2: Khởi Động Frontend

```bash
cd cli
ng serve
```

Mở browser: `http://localhost:4200`

### Bước 3: Test Flow Đầy Đủ

#### 3.1. Đăng Nhập
1. Vào trang login: `http://localhost:4200/login`
2. Đăng nhập với tài khoản test
3. Lưu ý: Phải đăng nhập mới có thể học

#### 3.2. Xem Khóa Học
1. Vào trang courses: `http://localhost:4200/courses`
2. Click vào một khóa học
3. Xem chi tiết khóa học

#### 3.3. Đăng Ký Khóa Học
1. Trên trang chi tiết khóa học
2. Click nút "Đăng ký khóa học" (hoặc "Enroll")
3. Kiểm tra:
   - ✅ Nút chuyển thành "Tiếp tục học"
   - ✅ Hiển thị tiến độ 0%

#### 3.4. Bắt Đầu Học
1. Click "Tiếp tục học" hoặc "Bắt đầu học"
2. Chuyển đến trang lesson learning
3. Kiểm tra:
   - ✅ Hiển thị bài học đầu tiên
   - ✅ Hiển thị progress bar
   - ✅ Hiển thị danh sách lessons

#### 3.5. Hoàn Thành Bài Học
1. Đọc/xem nội dung bài học
2. Click nút "Đánh dấu hoàn thành" hoặc checkbox
3. Kiểm tra:
   - ✅ Hiển thị alert "Hoàn thành bài học! Tiến độ: X%"
   - ✅ Progress bar tăng lên
   - ✅ Số bài hoàn thành tăng (X/Y bài)
   - ✅ Bài học được đánh dấu completed

#### 3.6. Verify Trong Database
Mở MySQL và chạy:

```sql
-- Kiểm tra enrollment
SELECT * FROM course_enrollments 
WHERE user_id = YOUR_USER_ID 
ORDER BY updated_at DESC;

-- Kiểm tra lesson completions
SELECT * FROM course_lesson_completions 
WHERE user_id = YOUR_USER_ID 
ORDER BY completed_at DESC;

-- Xem progress chi tiết
SELECT 
  ce.id,
  c.title as course_title,
  ce.progress,
  ce.status,
  COUNT(clc.id) as completed_lessons
FROM course_enrollments ce
JOIN courses c ON ce.course_id = c.id
LEFT JOIN course_lesson_completions clc 
  ON ce.user_id = clc.user_id AND ce.course_id = clc.course_id
WHERE ce.user_id = YOUR_USER_ID
GROUP BY ce.id;
```

### Bước 4: Kiểm Tra Browser Console

Mở DevTools (F12) và xem Console tab:

**Khi load trang lesson learning:**
```
Progress loaded from server: {progress: 5, completed: 1, total: 20}
```

**Khi complete lesson:**
```
Marking lesson 1 as complete. Time spent: 45s
Lesson completed successfully: {data: {...}}
```

### Bước 5: Kiểm Tra Network Tab

Mở DevTools > Network tab:

**Khi load lesson:**
- ✅ `GET /course-enrollments/1/check` - Status 200
- ✅ `GET /courses/1/details` - Status 200
- ✅ `GET /course-enrollments/1/progress` - Status 200

**Khi complete lesson:**
- ✅ `POST /course-enrollments/1/lessons/1/complete` - Status 200
- Response body chứa:
  ```json
  {
    "success": true,
    "message": "Lesson marked as complete",
    "data": {
      "completion": {...},
      "enrollment": {
        "progress": 5,
        "status": "in-progress"
      },
      "progress": {...}
    }
  }
  ```

## Các Tình Huống Test

### Test 1: User Chưa Đăng Nhập
**Hành động:** Truy cập trực tiếp `/courses/1/lessons/1`

**Kết quả mong đợi:**
- ❌ Redirect về trang login
- ❌ Hiển thị message "Bạn cần đăng nhập"

### Test 2: User Chưa Đăng Ký Khóa Học
**Hành động:** 
1. Đăng nhập
2. Truy cập `/courses/1/lessons/1` (chưa enroll)

**Kết quả mong đợi:**
- ❌ Hiển thị error "Bạn cần đăng ký khóa học để xem bài học này"
- ❌ Không hiển thị nội dung bài học

### Test 3: Hoàn Thành Nhiều Bài Học
**Hành động:**
1. Complete lesson 1
2. Complete lesson 2
3. Complete lesson 3

**Kết quả mong đợi:**
- ✅ Progress tăng dần: 5% → 10% → 15%
- ✅ Status chuyển từ "not-started" → "in-progress"
- ✅ Database có 3 records trong `course_lesson_completions`

### Test 4: Hoàn Thành 100% Khóa Học
**Hành động:** Complete tất cả lessons

**Kết quả mong đợi:**
- ✅ Progress = 100%
- ✅ Status = "completed"
- ✅ `completion_date` được set trong database

### Test 5: Refresh Trang
**Hành động:**
1. Complete một vài lessons
2. Refresh trang (F5)

**Kết quả mong đợi:**
- ✅ Progress vẫn giữ nguyên
- ✅ Các lessons đã complete vẫn được đánh dấu
- ✅ Dữ liệu load từ server, không phải localStorage

### Test 6: Đăng Xuất và Đăng Nhập Lại
**Hành động:**
1. Complete một vài lessons
2. Logout
3. Login lại với cùng tài khoản

**Kết quả mong đợi:**
- ✅ Progress vẫn giữ nguyên
- ✅ Tiếp tục từ vị trí đã học

### Test 7: Học Trên Nhiều Thiết Bị
**Hành động:**
1. Complete lessons trên máy tính
2. Mở trên điện thoại/máy khác
3. Login cùng tài khoản

**Kết quả mong đợi:**
- ✅ Progress đồng bộ giữa các thiết bị
- ✅ Dữ liệu lấy từ server

## Troubleshooting

### Lỗi: "Cannot read property 'progress' of undefined"
**Nguyên nhân:** Enrollment chưa được load

**Giải pháp:**
- Kiểm tra API `/course-enrollments/:id/check` có trả về data không
- Kiểm tra user đã đăng nhập chưa
- Xem console log có lỗi gì không

### Lỗi: Progress không cập nhật
**Nguyên nhân:** API complete lesson không hoạt động

**Giải pháp:**
1. Mở Network tab, xem request có gửi đi không
2. Kiểm tra response có success = true không
3. Xem backend log có lỗi gì không
4. Chạy test script backend:
   ```bash
   node test-lesson-completion.js
   ```

### Lỗi: 401 Unauthorized
**Nguyên nhân:** Token không hợp lệ hoặc hết hạn

**Giải pháp:**
- Logout và login lại
- Kiểm tra token trong localStorage
- Kiểm tra AuthService có gửi token trong header không

### Lỗi: 403 Forbidden
**Nguyên nhân:** User chưa enroll khóa học

**Giải pháp:**
- Enroll khóa học trước
- Kiểm tra enrollment trong database

## Checklist Hoàn Chỉnh

- [ ] Backend API đang chạy
- [ ] Frontend đang chạy
- [ ] User có thể đăng nhập
- [ ] User có thể đăng ký khóa học
- [ ] User có thể xem lessons (sau khi enroll)
- [ ] User có thể complete lessons
- [ ] Progress được cập nhật trong UI
- [ ] Progress được lưu vào database
- [ ] Progress hiển thị đúng sau khi refresh
- [ ] Progress đồng bộ giữa các thiết bị
- [ ] Console không có lỗi
- [ ] Network requests thành công (200 OK)

## Kết Luận

Sau khi test xong, hệ thống sẽ:
- ✅ Lưu progress vào database thay vì localStorage
- ✅ Yêu cầu đăng nhập để học
- ✅ Yêu cầu enrollment để xem nội dung
- ✅ Tự động cập nhật progress khi complete lesson
- ✅ Đồng bộ dữ liệu giữa các thiết bị
- ✅ Theo dõi thời gian học
- ✅ Tự động chuyển status (not-started → in-progress → completed)

Nếu tất cả test cases đều pass, hệ thống đã hoạt động đúng! 🎉
