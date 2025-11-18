# Hệ Thống Đăng Ký và Theo Dõi Tiến Độ Khóa Học

## Tổng Quan

Hệ thống khóa học đã được nâng cấp để lưu trữ tiến độ học tập vào tài khoản người dùng thay vì session. Người dùng bắt buộc phải đăng nhập và đăng ký khóa học trước khi có thể học.

## Các Tính Năng Mới

### 1. Đăng Ký Khóa Học (Course Enrollment)
- Người dùng phải đăng nhập để đăng ký khóa học
- Mỗi người dùng chỉ có thể đăng ký một lần cho mỗi khóa học
- Theo dõi trạng thái: `not-started`, `in-progress`, `completed`
- Lưu ngày bắt đầu và ngày hoàn thành

### 2. Theo Dõi Tiến Độ Bài Học (Lesson Completion)
- Lưu trữ từng bài học đã hoàn thành
- Theo dõi thời gian học (time spent)
- Tự động cập nhật tiến độ khóa học
- Không cho phép trùng lặp (unique constraint)

### 3. Bảo Vệ Nội Dung (Content Protection)
- Chỉ người dùng đã đăng ký mới xem được modules và lessons
- API endpoints được bảo vệ bằng authentication middleware
- Kiểm tra enrollment trước khi trả về nội dung

## Cấu Trúc Database

### Bảng `course_enrollments`
```sql
- id: BIGINT (Primary Key)
- user_id: BIGINT (Foreign Key -> users)
- course_id: BIGINT (Foreign Key -> courses)
- progress: INTEGER (0-100)
- status: ENUM('not-started', 'in-progress', 'completed')
- start_date: DATE
- completion_date: DATE
- rating: FLOAT (0-5)
- created_at, updated_at: DATETIME
```

### Bảng `course_lesson_completions` (MỚI)
```sql
- id: BIGINT (Primary Key)
- user_id: BIGINT (Foreign Key -> users)
- course_id: BIGINT (Foreign Key -> courses)
- lesson_id: BIGINT (Foreign Key -> course_lessons)
- completed_at: DATETIME
- time_spent: INTEGER (seconds)
- created_at, updated_at: DATETIME
```

## API Endpoints

### Enrollment Management

#### 1. Đăng Ký Khóa Học
```
POST /api/v1/course-enrollments/:courseId/enroll
Headers: Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully enrolled in course",
  "data": {
    "id": 1,
    "user_id": 123,
    "course_id": 456,
    "progress": 0,
    "status": "not-started",
    "start_date": "2024-01-01"
  }
}
```

#### 2. Lấy Danh Sách Khóa Học Đã Đăng Ký
```
GET /api/v1/course-enrollments/my-enrollments?status=in-progress
Headers: Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): `not-started`, `in-progress`, `completed`

#### 3. Kiểm Tra Trạng Thái Đăng Ký
```
GET /api/v1/course-enrollments/:courseId/check
Headers: Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isEnrolled": true,
    "enrollment": { ... }
  }
}
```

#### 4. Lấy Tiến Độ Khóa Học
```
GET /api/v1/course-enrollments/:courseId/progress
Headers: Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "enrollment": { ... },
    "progress": {
      "totalLessons": 20,
      "completedLessons": 5,
      "progressPercentage": 25,
      "totalDuration": 600,
      "completedDuration": 150,
      "nextLesson": { ... }
    },
    "structure": {
      "modules": [ ... ],
      "totalModules": 4,
      "totalLessons": 20,
      "completedLessons": 5
    },
    "completedLessonIds": [1, 2, 3, 4, 5]
  }
}
```

### Lesson Completion

#### 5. Đánh Dấu Bài Học Hoàn Thành
```
POST /api/v1/course-enrollments/:courseId/lessons/:lessonId/complete
Headers: Authorization: Bearer <token>
Content-Type: application/json

{
  "timeSpent": 300
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lesson marked as complete",
  "data": {
    "completion": { ... },
    "enrollment": {
      "progress": 30,
      "status": "in-progress"
    },
    "progress": { ... }
  }
}
```

### Learning Dashboard

#### 6. Lấy Dashboard Học Tập
```
GET /api/v1/course-enrollments/dashboard
Headers: Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalCourses": 5,
      "completedCourses": 2,
      "inProgressCourses": 3,
      "averageProgress": 45
    },
    "recentActivity": [ ... ],
    "nextSteps": [ ... ],
    "enrollments": [ ... ]
  }
}
```

### Protected Course Content

#### 7. Lấy Modules (Yêu Cầu Enrollment)
```
GET /api/v1/courses/:id/modules
Headers: Authorization: Bearer <token>
```

#### 8. Lấy Lessons (Yêu Cầu Enrollment)
```
GET /api/v1/courses/:id/lessons
Headers: Authorization: Bearer <token>
```

#### 9. Lấy Chi Tiết Lesson (Yêu Cầu Enrollment)
```
GET /api/v1/courses/lessons/:lessonId
Headers: Authorization: Bearer <token>
```

## Cài Đặt

### 1. Chạy Migration Database
```bash
cd api
mysql -u root -p lfys_db < sql-scripts/006-course-lesson-completion.sql
```

### 2. Khởi Động Lại API Server
```bash
cd api
npm run dev
```

### 3. Test API
```bash
# Đăng nhập để lấy token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Đăng ký khóa học
curl -X POST http://localhost:3000/api/v1/course-enrollments/1/enroll \
  -H "Authorization: Bearer YOUR_TOKEN"

# Kiểm tra tiến độ
curl -X GET http://localhost:3000/api/v1/course-enrollments/1/progress \
  -H "Authorization: Bearer YOUR_TOKEN"

# Hoàn thành bài học
curl -X POST http://localhost:3000/api/v1/course-enrollments/1/lessons/1/complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"timeSpent":300}'
```

## Luồng Hoạt Động

### 1. Người Dùng Xem Khóa Học
```
User -> Browse Courses (Public)
     -> View Course Details (Public)
     -> Click "Enroll" Button
```

### 2. Đăng Ký Khóa Học
```
User -> Login (if not logged in)
     -> POST /course-enrollments/:courseId/enroll
     -> System creates enrollment record
     -> Redirect to course learning page
```

### 3. Học Bài
```
User -> GET /courses/:id/modules (Check enrollment)
     -> GET /courses/:id/lessons (Check enrollment)
     -> View lesson content
     -> POST /course-enrollments/:courseId/lessons/:lessonId/complete
     -> System updates progress automatically
```

### 4. Theo Dõi Tiến Độ
```
User -> GET /course-enrollments/dashboard
     -> View all enrolled courses
     -> View progress for each course
     -> Continue learning from last position
```

## Tính Năng Tự Động

### 1. Cập Nhật Trạng Thái
- Khi hoàn thành bài học đầu tiên: `not-started` -> `in-progress`
- Khi hoàn thành 100% bài học: `in-progress` -> `completed`
- Tự động set `completion_date` khi hoàn thành

### 2. Tính Toán Tiến Độ
- Tự động tính % hoàn thành dựa trên số bài học
- Tính tổng thời gian đã học
- Xác định bài học tiếp theo cần học

### 3. Bảo Vệ Nội Dung
- Tự động kiểm tra enrollment trước khi trả về nội dung
- Trả về lỗi 403 nếu chưa đăng ký
- Trả về lỗi 401 nếu chưa đăng nhập

## Lưu Ý Quan Trọng

1. **Authentication Required**: Tất cả endpoints enrollment đều yêu cầu JWT token
2. **Unique Enrollment**: Mỗi user chỉ có thể đăng ký 1 lần cho mỗi khóa học
3. **Unique Completion**: Mỗi bài học chỉ được đánh dấu hoàn thành 1 lần (có thể update time_spent)
4. **Cascade Delete**: Khi xóa user/course/lesson, các records liên quan sẽ tự động xóa
5. **Progress Calculation**: Tiến độ được tính tự động, không cần update thủ công

## Tích Hợp Frontend

### 1. Kiểm Tra Enrollment Trước Khi Hiển Thị Nội Dung
```typescript
async checkEnrollment(courseId: number) {
  const response = await this.http.get(
    `${API_URL}/course-enrollments/${courseId}/check`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.isEnrolled;
}
```

### 2. Đăng Ký Khóa Học
```typescript
async enrollCourse(courseId: number) {
  const response = await this.http.post(
    `${API_URL}/course-enrollments/${courseId}/enroll`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}
```

### 3. Theo Dõi Tiến Độ
```typescript
async getCourseProgress(courseId: number) {
  const response = await this.http.get(
    `${API_URL}/course-enrollments/${courseId}/progress`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}
```

### 4. Hoàn Thành Bài Học
```typescript
async completeLesson(courseId: number, lessonId: number, timeSpent: number) {
  const response = await this.http.post(
    `${API_URL}/course-enrollments/${courseId}/lessons/${lessonId}/complete`,
    { timeSpent },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}
```

## Troubleshooting

### Lỗi 401 Unauthorized
- Kiểm tra JWT token có hợp lệ không
- Kiểm tra token có được gửi trong header không
- Kiểm tra token có hết hạn không

### Lỗi 403 Forbidden
- User chưa đăng ký khóa học
- Cần gọi API enroll trước

### Lỗi 400 Already Enrolled
- User đã đăng ký khóa học rồi
- Không cần đăng ký lại

## Kết Luận

Hệ thống enrollment mới đảm bảo:
- ✅ Tiến độ học tập được lưu vào database
- ✅ Yêu cầu đăng nhập để học
- ✅ Theo dõi chi tiết từng bài học
- ✅ Tự động cập nhật tiến độ
- ✅ Bảo vệ nội dung khóa học
- ✅ Dashboard học tập cho người dùng
