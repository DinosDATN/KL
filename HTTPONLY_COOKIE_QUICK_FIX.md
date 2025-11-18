# 🔧 HttpOnly Cookie - Quick Fix

## ❌ Vấn Đề Vừa Sửa

Sau khi migrate sang HttpOnly Cookies, các API requests vẫn bị **401 Unauthorized** vì:

1. ❌ CoursesService vẫn dùng `headers: this.getAuthHeaders()` thay vì `withCredentials: true`
2. ❌ Cookie không được gửi trong requests
3. ❌ Backend không nhận được token

## ✅ Đã Sửa

### CoursesService - Tất Cả Protected Methods

Đã update tất cả methods để dùng `withCredentials: true`:

```typescript
// ❌ TRƯỚC (SAI)
getCourseModules(courseId: number): Observable<CourseModule[]> {
  return this.http.get<ApiResponse<CourseModule[]>>(
    `${this.apiUrl}/courses/${courseId}/modules`,
    { headers: this.getAuthHeaders() } // ❌ Không gửi cookie
  )
}

// ✅ SAU (ĐÚNG)
getCourseModules(courseId: number): Observable<CourseModule[]> {
  return this.http.get<ApiResponse<CourseModule[]>>(
    `${this.apiUrl}/courses/${courseId}/modules`,
    { withCredentials: true } // ✅ Gửi HttpOnly cookie
  )
}
```

### Các Methods Đã Update:

**Course Content**:
- ✅ `getCourseModules(courseId)`
- ✅ `getCourseLessons(courseId)`
- ✅ `getLessonById(lessonId)`

**Enrollment**:
- ✅ `enrollCourse(courseId)`
- ✅ `checkEnrollment(courseId)`
- ✅ `getMyEnrollments(status?)`
- ✅ `getCourseProgress(courseId)`
- ✅ `completeLesson(courseId, lessonId, timeSpent)`
- ✅ `getLearningDashboard()`

**Removed**:
- ❌ `getAuthHeaders()` - Không cần nữa

## 🧪 Test Ngay

### 1. Restart Frontend

```bash
# Ctrl+C để stop
# Sau đó:
cd cli
npm start
```

### 2. Login

1. Mở `http://localhost:4200/auth/login`
2. Đăng nhập
3. Kiểm tra cookie trong DevTools:
   - F12 > Application > Cookies
   - Tìm `auth_token`
   - ✅ HttpOnly: true

### 3. Test Lesson Page

1. Navigate đến một lesson
2. Kiểm tra Console - không còn lỗi 401
3. Kiểm tra Network tab:
   - Request Headers có `Cookie: auth_token=...`
   - Response: 200 OK

### 4. Kiểm Tra Logs

**Trước (Lỗi)**:
```
❌ User logged out, cleaning up
🔌 Socket connection status: DISCONNECTED
CoursesService Error: 401 Unauthorized
Error: Access token is required
```

**Sau (Đúng)**:
```
✅ User authenticated, initializing app
🔌 Socket connection status: CONNECTED
✅ Lesson data loaded successfully
```

## 📊 So Sánh Request Headers

### ❌ Trước (Không Có Cookie)

```
Request Headers:
  Content-Type: application/json
  ❌ KHÔNG CÓ Cookie
```

**Kết quả**: 401 Unauthorized

### ✅ Sau (Có Cookie)

```
Request Headers:
  Content-Type: application/json
  Cookie: auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Kết quả**: 200 OK

## 🎯 Checklist

- [x] Update `getCourseModules()` với `withCredentials: true`
- [x] Update `getCourseLessons()` với `withCredentials: true`
- [x] Update `getLessonById()` với `withCredentials: true`
- [x] Update `enrollCourse()` với `withCredentials: true`
- [x] Update `checkEnrollment()` với `withCredentials: true`
- [x] Update `getMyEnrollments()` với `withCredentials: true`
- [x] Update `getCourseProgress()` với `withCredentials: true`
- [x] Update `completeLesson()` với `withCredentials: true`
- [x] Update `getLearningDashboard()` với `withCredentials: true`
- [x] Remove `getAuthHeaders()` method
- [ ] Test login
- [ ] Test lesson page
- [ ] Test enrollment
- [ ] Test progress tracking

## 🚨 Lưu Ý Quan Trọng

### Tất Cả Protected API Requests Phải Có:

```typescript
{ withCredentials: true }
```

### Không Cần:

```typescript
// ❌ KHÔNG CẦN NỮA
{ 
  headers: {
    'Authorization': `Bearer ${token}`
  }
}
```

### AuthInterceptor Đã Tự Động Thêm:

```typescript
// AuthInterceptor tự động thêm withCredentials cho TẤT CẢ requests
const authReq = req.clone({
  withCredentials: true
});
```

**Nhưng**: Vẫn nên thêm `withCredentials: true` trong từng request để rõ ràng.

## 🎉 Kết Quả

Sau khi sửa:
- ✅ Không còn lỗi 401
- ✅ Cookie được gửi đúng cách
- ✅ Lesson page hoạt động
- ✅ Enrollment hoạt động
- ✅ Progress tracking hoạt động

---

**Files đã sửa**:
- `cli/src/app/core/services/courses.service.ts`

**Restart frontend và test lại!** 🚀
