# Debug Guide - Restore Function Not Working

## Vấn Đề
Chức năng Restore không hoạt động khi click vào nút Restore trong tab Deleted Courses.

## Các Bước Debug

### 1. Kiểm Tra Console Log

Mở Developer Tools (F12) và kiểm tra Console khi click nút Restore:

**Logs mong đợi:**
```
🔄 Attempting to restore course: 123
📤 Sending restore request to API...
✅ Restore response: { success: true, data: {...} }
```

**Nếu không thấy logs:**
- Event binding có vấn đề
- Nút không được click đúng

**Nếu thấy error:**
- Kiểm tra error message cụ thể
- Có thể là lỗi backend API

### 2. Kiểm Tra Network Tab

Mở Developer Tools → Network tab:

**Tìm request:**
```
POST /api/admin/courses/{id}/restore
```

**Kiểm tra:**
- ✅ Request có được gửi không?
- ✅ Status code là gì? (200, 401, 404, 500?)
- ✅ Request headers có cookie không?
- ✅ Response body là gì?

**Các trường hợp:**

#### Status 401 (Unauthorized)
```
Nguyên nhân: Không có quyền admin hoặc session hết hạn
Giải pháp: Login lại với tài khoản admin
```

#### Status 404 (Not Found)
```
Nguyên nhân: 
- Course không tồn tại
- Endpoint API sai
- Course chưa bị soft delete (is_deleted = false)

Giải pháp:
- Kiểm tra course ID có đúng không
- Kiểm tra backend route có đúng không
- Kiểm tra course có is_deleted = true không
```

#### Status 500 (Server Error)
```
Nguyên nhân: Lỗi backend
Giải pháp: Kiểm tra backend logs
```

### 3. Kiểm Tra Backend API

#### Test với cURL:
```bash
# Login first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  -c cookies.txt

# Restore course
curl -X POST http://localhost:3000/api/admin/courses/1/restore \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

#### Test với Node.js:
```bash
node test-restore-api.js
```

### 4. Kiểm Tra Database

```sql
-- Kiểm tra course có tồn tại và is_deleted = true không
SELECT id, title, is_deleted, deleted_at 
FROM courses 
WHERE id = 1;

-- Nếu is_deleted = false, course không thể restore
-- Phải soft delete trước:
UPDATE courses 
SET is_deleted = true, deleted_at = NOW() 
WHERE id = 1;
```

### 5. Kiểm Tra Backend Code

#### Route có đúng không?
```javascript
// routes/admin/courses.js
router.post('/admin/courses/:id/restore', authenticateAdmin, restoreCourse);
```

#### Controller có đúng không?
```javascript
async function restoreCourse(req, res) {
  try {
    const { id } = req.params;
    
    // Find course with is_deleted = true
    const course = await Course.findOne({ 
      where: { id, is_deleted: true } 
    });
    
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        error: 'Deleted course not found' 
      });
    }
    
    // Restore course
    await course.update({ 
      is_deleted: false, 
      deleted_at: null 
    });
    
    res.json({
      success: true,
      message: 'Course restored successfully',
      data: course
    });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
```

## Common Issues & Solutions

### Issue 1: Nút Restore không xuất hiện

**Nguyên nhân:**
- Không ở tab "Deleted Courses"
- `showDeletedActions` prop không được set

**Giải pháp:**
```typescript
// Kiểm tra trong course-list.component.html
<button
  *ngIf="showDeletedActions"  // ✅ Phải có điều kiện này
  (click)="onRestore(course.id)"
  ...
>
```

### Issue 2: Click nút không có phản ứng

**Nguyên nhân:**
- Event binding sai
- Method không tồn tại

**Giải pháp:**
```typescript
// course-list.component.ts
@Output() restoreCourse = new EventEmitter<number>();

onRestore(courseId: number): void {
  this.restoreCourse.emit(courseId);  // ✅ Phải emit event
}
```

```html
<!-- course-management.component.html -->
<app-course-list
  ...
  (restoreCourse)="onRestoreCourse($event)"  // ✅ Phải bind event
></app-course-list>
```

### Issue 3: API trả về 404

**Nguyên nhân:**
- Course không có trong database
- Course có `is_deleted = false` (chưa bị soft delete)

**Giải pháp:**
```sql
-- Kiểm tra course
SELECT * FROM courses WHERE id = 1;

-- Nếu is_deleted = false, soft delete trước
UPDATE courses SET is_deleted = true WHERE id = 1;
```

### Issue 4: API trả về 401

**Nguyên nhân:**
- Không có quyền admin
- Session hết hạn
- Cookie không được gửi

**Giải pháp:**
```typescript
// Kiểm tra service có withCredentials: true không
restoreCourse(id: number): Observable<ApiResponse<AdminCourse>> {
  return this.http.post<ApiResponse<AdminCourse>>(
    `${this.apiUrl}/${id}/restore`, 
    {}, 
    { withCredentials: true }  // ✅ Bắt buộc
  );
}
```

### Issue 5: Course restore nhưng không biến mất khỏi Deleted tab

**Nguyên nhân:**
- Frontend không reload data
- Backend không update `is_deleted = false`

**Giải pháp:**
```typescript
// Phải reload courses sau khi restore
onRestoreCourse(courseId: number): void {
  this.adminCourseService.restoreCourse(courseId).subscribe({
    next: (response) => {
      if (response.success) {
        this.loadCourses();  // ✅ Reload list
        this.loadStats();    // ✅ Reload statistics
      }
    }
  });
}
```

## Checklist Debug

- [ ] Console có logs không?
- [ ] Network tab có request không?
- [ ] Status code là gì?
- [ ] Response body là gì?
- [ ] Backend có nhận request không?
- [ ] Database có course với is_deleted = true không?
- [ ] Backend có update is_deleted = false không?
- [ ] Frontend có reload data không?

## Test Flow

1. ✅ Soft delete một course từ tab "All Courses"
2. ✅ Course biến mất khỏi "All Courses"
3. ✅ Chuyển sang tab "Deleted Courses"
4. ✅ Course xuất hiện trong "Deleted Courses"
5. ✅ Click nút "Restore"
6. ✅ Confirm dialog xuất hiện
7. ✅ Click OK
8. ✅ Console log xuất hiện
9. ✅ Network request được gửi
10. ✅ API trả về success
11. ✅ Notification xuất hiện
12. ✅ Course biến mất khỏi "Deleted Courses"
13. ✅ Chuyển sang tab "All Courses"
14. ✅ Course xuất hiện lại trong "All Courses"

## Quick Fix Commands

```bash
# 1. Check backend is running
curl http://localhost:3000/api/health

# 2. Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# 3. Test restore API
node test-restore-api.js

# 4. Check database
mysql -u root -p
USE your_database;
SELECT id, title, is_deleted FROM courses WHERE is_deleted = true;
```

## Contact Backend Developer

Nếu vấn đề vẫn không giải quyết được, cung cấp thông tin sau cho backend developer:

1. Console logs
2. Network request/response
3. Course ID đang test
4. Database state của course đó
5. Backend logs (nếu có)
