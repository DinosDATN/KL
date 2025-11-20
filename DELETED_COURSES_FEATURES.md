# Deleted Courses - Tính Năng Hoàn Chỉnh

## Tổng Quan
Phần Deleted Courses cho phép admin quản lý các khóa học đã bị xóa, bao gồm khôi phục hoặc xóa vĩnh viễn.

## Các Tính Năng Chính

### 1. Tab Deleted Courses

#### Truy Cập
- Click vào tab "Deleted Courses" trong Course Management
- Hiển thị số lượng khóa học đã xóa trong badge màu đỏ

#### Hiển Thị
- ✅ Danh sách tất cả khóa học đã bị soft delete
- ✅ Badge "Deleted" màu đỏ hiển thị bên cạnh tên khóa học
- ✅ Tất cả thông tin khóa học vẫn được giữ nguyên
- ✅ Empty state đặc biệt khi không có khóa học nào bị xóa

### 2. Single Course Actions (Hành Động Đơn Lẻ)

#### View (Xem)
- **Icon**: eye
- **Màu**: Gray
- **Chức năng**: Xem chi tiết khóa học đã xóa
- **Điều hướng**: `/courses/:id`

#### Edit (Sửa)
- **Icon**: edit
- **Màu**: Blue
- **Chức năng**: Chỉnh sửa thông tin khóa học (có thể cần restore trước)
- **Note**: Có thể cần xem xét logic có cho phép edit khóa học đã xóa không

#### Restore (Khôi Phục)
- **Icon**: rotate-ccw
- **Màu**: Green
- **Chức năng**: Khôi phục khóa học về trạng thái bình thường
- **Confirmation**: "Are you sure you want to restore this course?"
- **Kết quả**: 
  - Khóa học chuyển về tab "All Courses"
  - Trạng thái is_deleted = false
  - Notification thành công/thất bại

#### Permanent Delete (Xóa Vĩnh Viễn)
- **Icon**: trash
- **Màu**: Red
- **Chức năng**: Xóa vĩnh viễn khóa học khỏi database
- **Confirmation**: "Are you sure you want to permanently delete this course? This action cannot be undone."
- **Kết quả**:
  - Khóa học bị xóa hoàn toàn khỏi database
  - Không thể khôi phục
  - Notification thành công/thất bại

### 3. Bulk Actions (Hành Động Hàng Loạt)

#### Restore Multiple Courses
- **Button**: "Restore" (màu xanh lá)
- **Icon**: rotate-ccw
- **Chức năng**: Khôi phục nhiều khóa học cùng lúc
- **Confirmation**: "Are you sure you want to restore X courses?"
- **API**: `POST /admin/courses/bulk/restore`
- **Kết quả**:
  - Tất cả khóa học được chọn chuyển về tab "All Courses"
  - Notification: "Successfully restored X courses"

#### Permanent Delete Multiple Courses
- **Button**: "Permanent Delete" (màu đỏ)
- **Icon**: trash
- **Chức năng**: Xóa vĩnh viễn nhiều khóa học cùng lúc
- **Confirmation**: "Are you sure you want to PERMANENTLY delete X courses? This action cannot be undone."
- **API**: `POST /admin/courses/bulk/delete` với `permanent: true`
- **Kết quả**:
  - Tất cả khóa học được chọn bị xóa vĩnh viễn
  - Notification: "Successfully permanently deleted X courses"

### 4. UI/UX Đặc Biệt

#### Visual Indicators
- ✅ Badge "Deleted" màu đỏ bên cạnh tên khóa học
- ✅ Icon trash trong empty state
- ✅ Hover effects cho tất cả nút action
- ✅ Màu sắc phân biệt rõ ràng:
  - Restore: Green
  - Permanent Delete: Red

#### Empty State
```
Icon: trash (màu gray)
Title: "No deleted courses"
Description: "All deleted courses have been restored or permanently removed"
```

#### Bulk Actions Bar
- Chỉ hiển thị 2 nút:
  1. Restore (xanh lá)
  2. Permanent Delete (đỏ)
- Không hiển thị các nút Publish, Draft, Archive

### 5. Notifications

#### Success Messages
- **Single Restore**: "Course restored successfully"
- **Bulk Restore**: "Successfully restored X courses"
- **Single Permanent Delete**: "Course deleted successfully"
- **Bulk Permanent Delete**: "Successfully permanently deleted X courses"

#### Error Messages
- **Restore Failed**: "Failed to restore course"
- **Delete Failed**: "Failed to delete course"
- **Generic Error**: Hiển thị error message từ API

### 6. Confirmation Dialogs

#### Restore Single Course
```
"Are you sure you want to restore this course?"
```

#### Restore Multiple Courses
```
"Are you sure you want to restore X courses?"
```

#### Permanent Delete Single Course
```
"Are you sure you want to permanently delete this course? This action cannot be undone."
```

#### Permanent Delete Multiple Courses
```
"Are you sure you want to PERMANENTLY delete X courses? This action cannot be undone."
```

## API Endpoints

### Get Deleted Courses
```
GET /admin/courses/deleted
Query Params: page, limit, search, sortBy, filters
Response: PaginatedResponse<AdminCourse>
```

### Restore Single Course
```
POST /admin/courses/:id/restore
Response: ApiResponse<AdminCourse>
```

### Permanent Delete Single Course
```
DELETE /admin/courses/:id/permanent
Response: ApiResponse<void>
```

### Bulk Restore
```
POST /admin/courses/bulk/restore
Body: { course_ids: number[] }
Response: ApiResponse<any>
```

### Bulk Permanent Delete
```
POST /admin/courses/bulk/delete
Body: { course_ids: number[], permanent: true }
Response: ApiResponse<any>
```

## Workflow

### Soft Delete → Restore
1. User xóa khóa học từ tab "All Courses"
2. Backend set `is_deleted = true` cho khóa học
3. Khóa học **biến mất** khỏi tab "All Courses" (filter `is_deleted = false`)
4. Khóa học **xuất hiện** trong tab "Deleted Courses" (filter `is_deleted = true`)
5. User click "Restore" trong tab "Deleted Courses"
6. Backend set `is_deleted = false` cho khóa học
7. Khóa học **quay lại** tab "All Courses"

### Soft Delete → Permanent Delete
1. User xóa khóa học từ tab "All Courses"
2. Backend set `is_deleted = true` cho khóa học
3. Khóa học chuyển sang tab "Deleted Courses"
4. User click "Permanent Delete" trong tab "Deleted Courses"
5. Backend xóa vĩnh viễn record khỏi database
6. Khóa học **biến mất hoàn toàn**

### Bulk Operations
1. User chọn nhiều khóa học (checkbox)
2. Bulk Actions Bar xuất hiện
3. User chọn action (Restore hoặc Permanent Delete)
4. Confirm dialog xuất hiện
5. Action được thực hiện cho tất cả khóa học đã chọn
6. Danh sách tự động refresh

## Filter Logic

### Tab "All Courses"
```typescript
filters = {
  ...otherFilters,
  is_deleted: false  // ✅ Chỉ hiển thị courses chưa bị xóa
}
```

### Tab "Deleted Courses"
```typescript
filters = {
  ...otherFilters,
  is_deleted: true   // ✅ Chỉ hiển thị courses đã bị xóa
}
```

### Quan Trọng
- Filter `is_deleted` được **tự động thêm** vào mọi request dựa trên tab đang active
- Khi search, sort, paginate, filter `is_deleted` **luôn được giữ nguyên**
- Backend **phải** filter dựa trên `is_deleted` parameter

## Security & Validation

### Permissions
- ✅ Chỉ admin mới có quyền truy cập
- ✅ Kiểm tra authentication với HttpOnly cookie
- ✅ Kiểm tra authorization trên backend

### Validation
- ✅ Không thể restore khóa học không tồn tại
- ✅ Không thể permanent delete khóa học không tồn tại
- ✅ Confirmation dialog cho tất cả destructive actions

### Error Handling
- ✅ Hiển thị error message từ API
- ✅ Fallback error message nếu API không trả về message
- ✅ Notification cho user về kết quả action

## Testing Checklist

### Single Course Actions
- [ ] View deleted course details
- [ ] Edit deleted course (nếu được phép)
- [ ] Restore single course
- [ ] Permanent delete single course
- [ ] Verify notifications hiển thị đúng
- [ ] Verify confirmation dialogs xuất hiện

### Bulk Actions
- [ ] Select multiple courses
- [ ] Restore multiple courses
- [ ] Permanent delete multiple courses
- [ ] Clear selection
- [ ] Verify bulk actions bar hiển thị/ẩn đúng
- [ ] Verify notifications hiển thị đúng

### UI/UX
- [ ] Badge "Deleted" hiển thị đúng
- [ ] Empty state hiển thị đúng
- [ ] Hover effects hoạt động
- [ ] Dark mode hiển thị đúng
- [ ] Responsive trên mobile

### Data Integrity
- [ ] Restored course xuất hiện trong tab "All Courses"
- [ ] Permanently deleted course không còn trong database
- [ ] Statistics cập nhật đúng sau mỗi action
- [ ] Pagination hoạt động đúng

## Code Structure

### Components
```
course-management.component.ts
├── onRestoreCourse(courseId)      // Single restore
├── onDeleteCourse(courseId)       // Single/permanent delete
├── bulkRestoreCourses()           // Bulk restore
└── bulkDeleteCourses()            // Bulk delete (with permanent flag)

course-list.component.ts
├── onView(course)                 // View action
├── onEdit(course)                 // Edit action
├── onRestore(courseId)            // Restore action
└── onDelete(courseId)             // Delete action

bulk-actions.component.ts
├── showRestoreAction              // Toggle restore/delete actions
└── onBulkAction(action)           // Emit bulk action
```

### Services
```
admin-course.service.ts
├── getDeletedCourses()            // Get deleted courses
├── restoreCourse()                // Restore single course
├── permanentlyDeleteCourse()      // Permanent delete single
├── bulkRestoreCourses()           // Bulk restore
└── bulkDeleteCourses()            // Bulk delete (with permanent flag)
```

## Best Practices

### User Experience
1. ✅ Luôn có confirmation cho destructive actions
2. ✅ Phân biệt rõ ràng giữa soft delete và permanent delete
3. ✅ Hiển thị feedback ngay lập tức (notifications)
4. ✅ Visual indicators rõ ràng (badges, colors)

### Performance
1. ✅ Pagination cho danh sách deleted courses
2. ✅ Lazy loading khi cần
3. ✅ Debounce cho search

### Security
1. ✅ Validate permissions trên backend
2. ✅ Confirmation cho tất cả destructive actions
3. ✅ Audit log cho permanent deletes (nên implement)

### Maintainability
1. ✅ Reusable components (bulk-actions, course-list)
2. ✅ Consistent naming conventions
3. ✅ Clear separation of concerns
4. ✅ Type safety với TypeScript

## Future Enhancements

### Potential Features
- [ ] Auto-delete sau X ngày (scheduled cleanup)
- [ ] Audit log cho permanent deletes
- [ ] Undo restore action
- [ ] Batch restore với filters
- [ ] Export deleted courses
- [ ] Restore với version history
- [ ] Soft delete expiration warning

### UI Improvements
- [ ] Drag & drop để restore
- [ ] Preview trước khi restore
- [ ] Bulk edit trước khi restore
- [ ] Timeline của deleted courses
- [ ] Reason for deletion tracking
