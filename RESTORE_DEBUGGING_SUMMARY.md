# Restore Function Debugging - Summary

## Vấn Đề Ban Đầu
Chức năng Restore không hoạt động khi click vào nút Restore trong tab Deleted Courses.

## Đã Kiểm Tra & Xác Nhận

### ✅ Frontend Code
1. **Event Binding** - Đã đúng
   ```html
   <app-course-list
     ...
     (restoreCourse)="onRestoreCourse($event)"
   ></app-course-list>
   ```

2. **Component Method** - Đã đúng
   ```typescript
   onRestoreCourse(courseId: number): void {
     // Logic restore với logging
   }
   ```

3. **Service Method** - Đã đúng
   ```typescript
   restoreCourse(id: number): Observable<ApiResponse<AdminCourse>> {
     return this.http.post(`${this.apiUrl}/${id}/restore`, {}, {
       withCredentials: true
     });
   }
   ```

4. **Child Component** - Đã đúng
   ```typescript
   @Output() restoreCourse = new EventEmitter<number>();
   
   onRestore(courseId: number): void {
     this.restoreCourse.emit(courseId);
   }
   ```

### ✅ Đã Thêm Logging
```typescript
onRestoreCourse(courseId: number): void {
  console.log('🔄 Attempting to restore course:', courseId);
  // ... confirmation
  console.log('📤 Sending restore request to API...');
  // ... API call
  console.log('✅ Restore response:', response);
  // hoặc
  console.error('❌ Restore error:', error);
}
```

## Các Bước Debug

### 1. Kiểm Tra Console
Mở Developer Tools (F12) → Console tab và click nút Restore.

**Logs mong đợi:**
```
🔄 Attempting to restore course: 123
📤 Sending restore request to API...
✅ Restore response: { success: true, ... }
```

**Nếu không thấy log đầu tiên:**
- Nút không được click
- Event binding có vấn đề
- Component không được render

**Nếu thấy error log:**
- Kiểm tra error message
- Có thể là lỗi backend

### 2. Kiểm Tra Network
Developer Tools → Network tab

**Tìm request:**
```
POST /api/admin/courses/{id}/restore
```

**Kiểm tra:**
- Status code (200, 401, 404, 500?)
- Request headers (có cookie?)
- Response body

### 3. Test Backend API
```bash
# Chạy test script
node test-restore-api.js
```

Script này sẽ:
1. Login as admin
2. Get deleted courses
3. Restore first deleted course
4. Verify course in active list

### 4. Kiểm Tra Database
```sql
-- Xem courses đã deleted
SELECT id, title, is_deleted, deleted_at 
FROM courses 
WHERE is_deleted = true;

-- Sau khi restore, kiểm tra
SELECT id, title, is_deleted, deleted_at 
FROM courses 
WHERE id = {course_id};
-- is_deleted phải là false
```

## Các Nguyên Nhân Có Thể

### 1. Backend API Chưa Implement
**Triệu chứng:**
- Status 404 Not Found
- hoặc Status 405 Method Not Allowed

**Giải pháp:**
- Implement endpoint `POST /admin/courses/:id/restore`
- Xem file `BACKEND_DELETED_COURSES_REQUIREMENTS.md`

### 2. Authentication Issue
**Triệu chứng:**
- Status 401 Unauthorized
- Console error: "Session expired"

**Giải pháp:**
- Login lại với tài khoản admin
- Kiểm tra cookie có được gửi không

### 3. Course Không Tồn Tại
**Triệu chứng:**
- Status 404 Not Found
- Error: "Course not found"

**Giải pháp:**
- Kiểm tra course ID có đúng không
- Kiểm tra course có trong database không

### 4. Course Chưa Bị Soft Delete
**Triệu chứng:**
- Status 404 Not Found
- Error: "Deleted course not found"

**Giải pháp:**
- Kiểm tra `is_deleted = true` trong database
- Soft delete course trước khi restore

### 5. Backend Logic Sai
**Triệu chứng:**
- Status 200 OK
- Response: `{ success: false }`
- Course không được restore

**Giải pháp:**
- Kiểm tra backend code
- Đảm bảo update `is_deleted = false`

## Files Đã Tạo

1. **test-restore-api.js**
   - Script test API restore
   - Chạy: `node test-restore-api.js`

2. **DEBUG_RESTORE_ISSUE.md**
   - Hướng dẫn debug chi tiết
   - Checklist đầy đủ
   - Common issues & solutions

3. **BACKEND_DELETED_COURSES_REQUIREMENTS.md**
   - Yêu cầu backend API
   - Example implementation
   - Test cases

## Next Steps

### Nếu Vẫn Không Hoạt Động:

1. **Chạy test script:**
   ```bash
   node test-restore-api.js
   ```

2. **Kiểm tra console logs** khi click nút Restore

3. **Kiểm tra Network tab** để xem request/response

4. **Kiểm tra backend logs** để xem có nhận request không

5. **Kiểm tra database** để xem data có được update không

6. **Liên hệ backend developer** với thông tin:
   - Console logs
   - Network request/response
   - Course ID đang test
   - Database state

## Expected Behavior

### Khi Restore Thành Công:

1. ✅ Console log: "🔄 Attempting to restore course: X"
2. ✅ Confirmation dialog xuất hiện
3. ✅ User click OK
4. ✅ Console log: "📤 Sending restore request to API..."
5. ✅ Network request: POST /api/admin/courses/X/restore
6. ✅ Response: Status 200, `{ success: true }`
7. ✅ Console log: "✅ Restore response: ..."
8. ✅ Notification: "Course restored successfully"
9. ✅ Course biến mất khỏi "Deleted Courses" tab
10. ✅ Course xuất hiện lại trong "All Courses" tab
11. ✅ Statistics được cập nhật

### Khi Restore Thất Bại:

1. ✅ Console log: "🔄 Attempting to restore course: X"
2. ✅ Confirmation dialog xuất hiện
3. ✅ User click OK
4. ✅ Console log: "📤 Sending restore request to API..."
5. ✅ Network request: POST /api/admin/courses/X/restore
6. ❌ Response: Status 4xx/5xx hoặc `{ success: false }`
7. ❌ Console error: "❌ Restore error: ..."
8. ❌ Notification: "Failed to restore course"
9. ❌ Course vẫn ở "Deleted Courses" tab

## Code Changes Made

### course-management.component.ts
```typescript
// Added detailed logging
onRestoreCourse(courseId: number): void {
  console.log('🔄 Attempting to restore course:', courseId);
  
  if (!confirm('Are you sure you want to restore this course?')) {
    console.log('❌ Restore cancelled by user');
    return;
  }

  console.log('📤 Sending restore request to API...');
  this.adminCourseService.restoreCourse(courseId).subscribe({
    next: (response) => {
      console.log('✅ Restore response:', response);
      if (response.success) {
        this.notificationService.success('Success', 'Course restored successfully');
        this.loadCourses();
        this.loadStats();
      } else {
        console.error('❌ Restore failed:', response);
        this.notificationService.error('Error', response.message || 'Failed to restore course');
      }
    },
    error: (error) => {
      console.error('❌ Restore error:', error);
      this.notificationService.error('Error', error.message || 'Failed to restore course');
    },
  });
}
```

## Summary

Frontend code đã được kiểm tra và xác nhận là đúng. Vấn đề có thể nằm ở:

1. **Backend API chưa implement** - Cần implement theo `BACKEND_DELETED_COURSES_REQUIREMENTS.md`
2. **Authentication issue** - Cần login lại
3. **Database state** - Course phải có `is_deleted = true`

Sử dụng các tools đã tạo để debug:
- `test-restore-api.js` - Test API
- `DEBUG_RESTORE_ISSUE.md` - Hướng dẫn debug
- Console logs - Xem flow execution
