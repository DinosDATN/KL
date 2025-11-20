# Instructor Management - Hướng Dẫn Sử Dụng

## 📋 Tổng Quan

Chức năng Instructor Management cho phép admin quản lý toàn diện các instructor (giảng viên) trong hệ thống, bao gồm:
- Xem danh sách và thống kê instructor
- Quản lý thông tin cá nhân và trạng thái
- Quản lý qualifications (bằng cấp/chứng chỉ)
- Theo dõi courses và students
- Lọc và tìm kiếm nâng cao

## 🎨 Tính Năng

### 1. Dashboard & Statistics
- **Tổng số instructors**: Hiển thị tổng số instructor trong hệ thống
- **Active/Inactive**: Phân loại theo trạng thái hoạt động
- **Total Courses**: Tổng số khóa học được tạo
- **Total Students**: Tổng số học viên
- **Average Rating**: Đánh giá trung bình

### 2. Danh Sách Instructors
- Hiển thị dạng bảng với đầy đủ thông tin
- Avatar, tên, email, trạng thái
- Số lượng courses, students, rating
- Ngày tham gia hệ thống

### 3. Filters & Search
- **Search**: Tìm kiếm theo tên hoặc email
- **Status**: Lọc theo Active/Inactive
- **Has Courses**: Lọc instructor có/không có khóa học
- **Min Courses**: Số khóa học tối thiểu
- **Min Students**: Số học viên tối thiểu
- **Min Rating**: Đánh giá tối thiểu
- **Sort By**: Sắp xếp theo nhiều tiêu chí
- **Registration Date**: Lọc theo thời gian đăng ký

### 4. Chi Tiết Instructor
- Thông tin cá nhân đầy đủ
- Profile information (bio, phone, website)
- Statistics chi tiết (courses, students, rating, revenue)
- Danh sách qualifications
- Danh sách courses với trạng thái

### 5. Quản Lý Qualifications
- Thêm mới qualification
- Chỉnh sửa qualification
- Xóa qualification
- Thông tin: Title, Institution, Date, Credential URL

### 6. Actions
- **View Details**: Xem chi tiết instructor
- **Edit**: Chỉnh sửa thông tin (name, email, status, subscription)
- **Toggle Status**: Kích hoạt/vô hiệu hóa instructor

## 🎨 Dark/Light Mode

Component đã được tích hợp hoàn toàn với ThemeService:
- Tự động chuyển đổi theme theo hệ thống
- Lưu preference vào localStorage
- Smooth transitions giữa các theme
- Tất cả colors đều có dark mode variant

### Cách Sử Dụng Theme

```typescript
// Component đã inject ThemeService
constructor(public themeService: ThemeService) {}

// Trong template, sử dụng dark: prefix cho Tailwind
class="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
```

## 🔌 API Endpoints

### Base URL
```
http://localhost:3000/api/v1/admin/instructors
```

### Endpoints

#### 1. Get Statistics
```http
GET /api/v1/admin/instructors/statistics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_instructors": 50,
    "active_instructors": 45,
    "inactive_instructors": 5,
    "instructors_with_courses": 40,
    "instructors_without_courses": 10,
    "total_courses": 150,
    "total_students": 5000,
    "average_rating": "4.5"
  }
}
```

#### 2. Get All Instructors
```http
GET /api/v1/admin/instructors?page=1&limit=10&search=john&is_active=true
```

**Query Parameters:**
- `page`: Số trang (default: 1)
- `limit`: Số items per page (default: 10)
- `search`: Tìm kiếm theo tên/email
- `is_active`: true/false
- `has_courses`: true/false
- `min_courses`: Số khóa học tối thiểu
- `min_students`: Số học viên tối thiểu
- `min_rating`: Rating tối thiểu
- `sortBy`: created_at, name, email, courses_count, students_count, avg_rating
- `registration_date`: today, this_week, this_month, this_year

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 50,
    "items_per_page": 10
  }
}
```

#### 3. Get Instructor By ID
```http
GET /api/v1/admin/instructors/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "instructor": {...},
    "courses": [...],
    "statistics": {
      "total_courses": 5,
      "published_courses": 4,
      "total_students": 200,
      "unique_students": 180,
      "average_rating": "4.5",
      "total_revenue": 50000000,
      "recent_enrollments": 20
    }
  }
}
```

#### 4. Update Instructor
```http
PUT /api/v1/admin/instructors/:id
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "is_active": true,
  "subscription_status": "premium",
  "subscription_end_date": "2024-12-31"
}
```

#### 5. Toggle Instructor Status
```http
PATCH /api/v1/admin/instructors/:id/status
```

#### 6. Create Qualification
```http
POST /api/v1/admin/instructors/:id/qualifications
```

**Body:**
```json
{
  "title": "Master of Computer Science",
  "institution": "Stanford University",
  "date": "2020-06-01",
  "credential_url": "https://example.com/credential"
}
```

#### 7. Update Qualification
```http
PUT /api/v1/admin/instructors/:id/qualifications/:qualification_id
```

#### 8. Delete Qualification
```http
DELETE /api/v1/admin/instructors/:id/qualifications/:qualification_id
```

## 🧪 Testing

### Chạy Test Script

```bash
# Install axios nếu chưa có
npm install axios

# Chạy test
node test-instructor-api.js
```

### Test Cases
1. ✅ Admin Login
2. ✅ Get Instructor Statistics
3. ✅ Get All Instructors
4. ✅ Get Instructor By ID
5. ✅ Filter Instructors
6. ✅ Update Instructor
7. ✅ Toggle Instructor Status
8. ✅ Create Qualification
9. ✅ Update Qualification
10. ✅ Delete Qualification

## 📁 Cấu Trúc Files

```
api/
├── src/
│   ├── controllers/
│   │   └── instructorAdminController.js    # Controller xử lý logic
│   ├── routes/
│   │   └── instructorAdminRoutes.js        # Định nghĩa routes
│   ├── services/
│   │   └── courseService.js                # Service liên quan
│   └── models/
│       ├── User.js                         # Model User
│       ├── InstructorQualification.js      # Model Qualification
│       └── Course.js                       # Model Course

cli/
├── src/
│   └── app/
│       ├── core/
│       │   └── services/
│       │       ├── admin-instructor.service.ts    # Service gọi API
│       │       └── theme.service.ts               # Theme service
│       └── features/
│           └── admin/
│               └── instructor-management/
│                   ├── instructor-management.component.ts      # Component logic
│                   ├── instructor-management.component.html    # Template
│                   └── instructor-management.component.css     # Styles
```

## 🔐 Authentication & Authorization

### Requirements
- User phải đăng nhập
- User phải có role = 'admin'
- Sử dụng HttpOnly cookies cho authentication

### Middleware
```javascript
router.use(authenticateToken);        // Xác thực user
router.use(requireRole(['admin']));   // Yêu cầu role admin
```

## 🎯 Best Practices

### Frontend
1. **Reactive Forms**: Sử dụng FormBuilder và validators
2. **RxJS**: Proper subscription management với takeUntil
3. **Performance**: TrackBy functions cho ngFor
4. **UX**: Loading states, error handling, success notifications
5. **Accessibility**: Proper labels, ARIA attributes
6. **Theme**: Consistent dark/light mode support

### Backend
1. **Validation**: Input validation và sanitization
2. **Error Handling**: Proper error messages và status codes
3. **Security**: Role-based access control
4. **Performance**: Efficient queries với includes và attributes
5. **Pagination**: Proper pagination implementation

## 🐛 Troubleshooting

### Lỗi Thường Gặp

#### 1. 401 Unauthorized
```
Nguyên nhân: Chưa đăng nhập hoặc token hết hạn
Giải pháp: Đăng nhập lại với tài khoản admin
```

#### 2. 403 Forbidden
```
Nguyên nhân: User không có quyền admin
Giải pháp: Đảm bảo user có role = 'admin'
```

#### 3. 404 Not Found
```
Nguyên nhân: Instructor ID không tồn tại
Giải pháp: Kiểm tra lại ID instructor
```

#### 4. Dark Mode Không Hoạt Động
```
Nguyên nhân: ThemeService chưa được inject
Giải pháp: Đảm bảo component inject ThemeService trong constructor
```

## 📝 Notes

- Tất cả API calls sử dụng `withCredentials: true` để gửi HttpOnly cookies
- Component sử dụng standalone mode (Angular 17+)
- Tailwind CSS được sử dụng cho styling
- Dark mode được implement với Tailwind's dark: prefix
- Pagination được implement ở cả frontend và backend
- Filters được debounce 300ms để tối ưu performance

## 🚀 Deployment

### Production Checklist
- [ ] Kiểm tra tất cả API endpoints
- [ ] Test dark/light mode
- [ ] Verify authentication flow
- [ ] Test pagination với large datasets
- [ ] Verify filters và search
- [ ] Test responsive design
- [ ] Check error handling
- [ ] Verify loading states
- [ ] Test CRUD operations
- [ ] Check performance

## 📞 Support

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra console logs
2. Verify API responses
3. Check network tab
4. Review error messages
5. Test với Postman/test script

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Author**: Development Team
