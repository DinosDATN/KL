# Quick Test - Restore Function

## Bước 1: Mở Browser Console

1. Mở trang admin course management
2. Nhấn F12 để mở Developer Tools
3. Chọn tab "Console"

## Bước 2: Chuyển sang Tab "Deleted Courses"

Khi chuyển tab, bạn sẽ thấy logs:
```
🔵 [CourseList] showDeletedActions set to: true
```

Nếu KHÔNG thấy log này → Vấn đề: Component không nhận được prop

## Bước 3: Click Nút Restore

Khi click nút Restore, bạn sẽ thấy logs theo thứ tự:
```
🔵 [CourseList] onRestore called with courseId: 123
🔵 [CourseList] Emitting restoreCourse event...
🔵 [CourseList] Event emitted
🔄 Attempting to restore course: 123
```

### Nếu KHÔNG thấy log đầu tiên:
**Vấn đề:** Nút không được click hoặc không tồn tại

**Kiểm tra:**
1. Nút có hiển thị không? (màu xanh lá, icon rotate-ccw)
2. Thử click vào vùng khác xung quanh nút
3. Kiểm tra console có error không?

### Nếu chỉ thấy 3 logs đầu, KHÔNG thấy log "🔄 Attempting...":
**Vấn đề:** Event không được parent component nhận

**Kiểm tra:**
1. Event binding trong template:
   ```html
   <app-course-list
     ...
     (restoreCourse)="onRestoreCourse($event)"
   ></app-course-list>
   ```

2. Method trong parent component có tồn tại không?

### Nếu thấy "🔄 Attempting..." nhưng không có "📤 Sending...":
**Vấn đề:** User cancel confirmation dialog

**Giải pháp:** Click OK trong confirmation dialog

### Nếu thấy "📤 Sending..." nhưng không có response:
**Vấn đề:** API không trả về hoặc bị block

**Kiểm tra:**
1. Mở tab "Network"
2. Tìm request `POST /api/admin/courses/{id}/restore`
3. Xem status code và response

## Bước 4: Kiểm Tra Network

1. Mở tab "Network" trong Developer Tools
2. Click nút Restore
3. Tìm request: `POST /api/admin/courses/{id}/restore`

### Request Details:
- **Method:** POST
- **URL:** http://localhost:3000/api/admin/courses/{id}/restore
- **Headers:** Phải có Cookie
- **Status:** Mong đợi 200

### Các Status Code:

#### 200 OK
```json
{
  "success": true,
  "message": "Course restored successfully",
  "data": { ... }
}
```
✅ API hoạt động đúng

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```
❌ Không có quyền admin hoặc session hết hạn
→ Login lại

#### 404 Not Found
```json
{
  "success": false,
  "error": "Deleted course not found"
}
```
❌ Course không tồn tại hoặc chưa bị soft delete
→ Kiểm tra database

#### 500 Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```
❌ Lỗi backend
→ Kiểm tra backend logs

## Bước 5: Test với Console Command

Paste vào Console và chạy:

```javascript
// Test 1: Kiểm tra component có tồn tại không
console.log('Testing restore function...');

// Test 2: Trigger restore manually (thay 1 bằng course ID thực tế)
const courseId = 1;
console.log('Manually triggering restore for course:', courseId);

// Giả lập click event
const event = new MouseEvent('click', {
  bubbles: true,
  cancelable: true,
  view: window
});

// Tìm nút restore và click
const restoreButtons = document.querySelectorAll('button[title="Restore"]');
console.log('Found restore buttons:', restoreButtons.length);

if (restoreButtons.length > 0) {
  console.log('Clicking first restore button...');
  restoreButtons[0].dispatchEvent(event);
} else {
  console.log('❌ No restore buttons found!');
  console.log('Are you in the Deleted Courses tab?');
}
```

## Bước 6: Kiểm Tra Database

```sql
-- Xem courses đã deleted
SELECT id, title, is_deleted, deleted_at 
FROM courses 
WHERE is_deleted = true
LIMIT 5;

-- Nếu không có courses nào, tạo một course deleted để test
UPDATE courses 
SET is_deleted = true, deleted_at = NOW() 
WHERE id = 1;
```

## Expected Full Log Flow

Khi mọi thứ hoạt động đúng:

```
1. 🔵 [CourseList] showDeletedActions set to: true
   (Khi chuyển sang tab Deleted)

2. 🔵 [CourseList] onRestore called with courseId: 123
   (Khi click nút Restore)

3. 🔵 [CourseList] Emitting restoreCourse event...
   (Child component emit event)

4. 🔵 [CourseList] Event emitted
   (Event đã được emit)

5. 🔄 Attempting to restore course: 123
   (Parent component nhận event)

6. (Confirmation dialog xuất hiện, user click OK)

7. 📤 Sending restore request to API...
   (Gửi request đến backend)

8. ✅ Restore response: { success: true, ... }
   (Nhận response thành công)

9. (Notification "Course restored successfully" xuất hiện)

10. (Course biến mất khỏi Deleted tab)
```

## Troubleshooting Checklist

- [ ] Console có logs không?
- [ ] Nút Restore có hiển thị không?
- [ ] Click nút có trigger event không?
- [ ] Event có đến parent component không?
- [ ] Confirmation dialog có xuất hiện không?
- [ ] Network request có được gửi không?
- [ ] Status code là gì?
- [ ] Response body là gì?
- [ ] Backend có nhận request không?
- [ ] Database có course với is_deleted = true không?

## Quick Commands

```bash
# 1. Kiểm tra backend đang chạy
curl http://localhost:3000/api/health

# 2. Test restore API trực tiếp
node test-restore-api.js

# 3. Kiểm tra database
mysql -u root -p
USE your_database;
SELECT * FROM courses WHERE is_deleted = true LIMIT 5;
```

## Nếu Vẫn Không Hoạt Động

Chụp màn hình và gửi:
1. Console logs (toàn bộ)
2. Network tab (request/response)
3. Tab hiện tại (All Courses hay Deleted Courses)
4. Nút Restore có hiển thị không

Hoặc copy/paste:
- Toàn bộ console logs
- Network request URL
- Response body
