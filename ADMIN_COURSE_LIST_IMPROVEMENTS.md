# Admin Course List - Cải Tiến Hiển Thị

## Tổng Quan
Đã cải tiến phần hiển thị danh sách khóa học trong admin để hiển thị đầy đủ thông tin và các nút action.

## Các Cải Tiến Đã Thực Hiện

### 1. Thông Tin Hiển Thị Đầy Đủ

#### Cột Title (Tiêu đề)
- ✅ Tên khóa học
- ✅ Mô tả ngắn (truncate)
- ✅ Badge Premium (nếu là khóa học premium)
- ✅ Badge Level (Beginner/Intermediate/Advanced)

#### Cột Category (Danh mục)
- ✅ Tên danh mục khóa học
- ✅ Hiển thị "N/A" nếu không có

#### Cột Instructor (Giảng viên)
- ✅ Tên giảng viên
- ✅ Hiển thị "N/A" nếu không có

#### Cột Price (Giá) - MỚI
- ✅ Giá hiện tại (màu xanh lá)
- ✅ Giá gốc (gạch ngang nếu có giảm giá)
- ✅ Phần trăm giảm giá (màu đỏ)
- ✅ Hiển thị "Free" cho khóa học miễn phí

#### Cột Status (Trạng thái)
- ✅ Badge với màu sắc phù hợp:
  - Published: Xanh lá
  - Draft: Vàng
  - Archived: Tím

#### Cột Students (Học viên)
- ✅ Số lượng học viên
- ✅ Icon users

#### Cột Rating (Đánh giá)
- ✅ Điểm đánh giá
- ✅ Icon ngôi sao vàng

#### Cột Created (Ngày tạo)
- ✅ Định dạng ngày theo locale Việt Nam

### 2. Các Nút Action

#### Nút View (Xem) - MỚI
- ✅ Icon: eye
- ✅ Màu: Gray
- ✅ Chức năng: Xem chi tiết khóa học
- ✅ Điều hướng đến trang chi tiết khóa học

#### Nút Edit (Sửa)
- ✅ Icon: edit
- ✅ Màu: Blue
- ✅ Chức năng: Mở modal chỉnh sửa khóa học
- ✅ Hover effect với background

#### Nút Restore (Khôi phục) - CHỈ HIỂN THỊ TRONG TAB DELETED
- ✅ Icon: rotate-ccw
- ✅ Màu: Green
- ✅ Chức năng: Khôi phục khóa học đã xóa
- ✅ Có xác nhận trước khi thực hiện
- ✅ Hiển thị notification khi thành công/thất bại

#### Nút Delete (Xóa)
- ✅ Icon: trash
- ✅ Màu: Red
- ✅ Chức năng:
  - Tab "All Courses": Soft delete (xóa mềm)
  - Tab "Deleted Courses": Permanent delete (xóa vĩnh viễn)
- ✅ Có xác nhận khác nhau cho từng loại xóa
- ✅ Hiển thị notification khi thành công/thất bại

### 3. Tính Năng Sắp Xếp

Các cột có thể sắp xếp:
- ✅ Title (Tiêu đề)
- ✅ Price (Giá) - MỚI
- ✅ Students (Học viên)
- ✅ Rating (Đánh giá)
- ✅ Created (Ngày tạo)

### 4. UI/UX Improvements

#### Hover Effects
- ✅ Các nút action có hover effect với background color
- ✅ Hàng trong bảng có hover effect

#### Responsive Design
- ✅ Bảng có thể scroll ngang trên màn hình nhỏ
- ✅ Các cột được căn chỉnh hợp lý

#### Dark Mode Support
- ✅ Tất cả màu sắc đều có variant cho dark mode
- ✅ Transition mượt mà khi chuyển đổi theme

#### Visual Feedback
- ✅ Notification khi thực hiện action thành công/thất bại
- ✅ Confirmation dialog trước khi xóa
- ✅ Loading state khi đang tải dữ liệu

## Cấu Trúc File

### Files Đã Cập Nhật

1. **course-list.component.html**
   - Thêm cột Category
   - Thêm cột Price với hiển thị đầy đủ
   - Thêm badges cho Premium và Level
   - Cải thiện UI cho các nút action
   - Thêm nút View và Restore

2. **course-list.component.ts**
   - Thêm `@Output() viewCourse`
   - Thêm `@Output() restoreCourse`
   - Thêm method `onView()`
   - Thêm method `onRestore()`
   - Đã có sẵn `formatCurrency()` method

3. **course-management.component.ts**
   - Thêm method `onViewCourse()` - điều hướng đến trang chi tiết
   - Thêm method `onRestoreCourse()` - khôi phục khóa học
   - Cải thiện method `onDeleteCourse()` - xử lý cả soft delete và permanent delete
   - Thêm notification cho các action

4. **course-management.component.html**
   - Thêm event binding cho `viewCourse`
   - Thêm event binding cho `restoreCourse`

## Cách Sử Dụng

### Xem Chi Tiết Khóa Học
1. Click vào nút "View" (icon eye) ở cột Actions
2. Hệ thống sẽ điều hướng đến trang `/courses/:id`

### Chỉnh Sửa Khóa Học
1. Click vào nút "Edit" (icon edit) ở cột Actions
2. Modal chỉnh sửa sẽ mở ra

### Khôi Phục Khóa Học (Tab Deleted)
1. Chuyển sang tab "Deleted Courses"
2. Click vào nút "Restore" (icon rotate-ccw)
3. Xác nhận trong dialog
4. Khóa học sẽ được khôi phục về tab "All Courses"

### Xóa Khóa Học
1. **Trong tab "All Courses"**: Soft delete - khóa học chuyển sang tab "Deleted"
2. **Trong tab "Deleted Courses"**: Permanent delete - xóa vĩnh viễn khỏi database
3. Cả hai đều có confirmation dialog

## Định Dạng Giá

```typescript
formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}
```

Ví dụ:
- 500000 → "500.000 ₫"
- 0 → "Free"

## Màu Sắc Status

- **Published**: Green (bg-green-100 text-green-800)
- **Draft**: Yellow (bg-yellow-100 text-yellow-800)
- **Archived**: Purple (bg-purple-100 text-purple-800)

## Testing

### Test Cases Cần Kiểm Tra

1. ✅ Hiển thị đầy đủ thông tin khóa học
2. ✅ Hiển thị giá đúng format
3. ✅ Hiển thị giá gốc và discount khi có
4. ✅ Hiển thị "Free" cho khóa học miễn phí
5. ✅ Nút View điều hướng đúng
6. ✅ Nút Edit mở modal
7. ✅ Nút Restore hoạt động (trong tab Deleted)
8. ✅ Nút Delete hoạt động (cả soft và permanent)
9. ✅ Sắp xếp theo Price hoạt động
10. ✅ Dark mode hiển thị đúng
11. ✅ Responsive trên mobile

## Lưu Ý

- Nút "Restore" chỉ hiển thị trong tab "Deleted Courses"
- Xóa trong tab "All Courses" là soft delete
- Xóa trong tab "Deleted Courses" là permanent delete
- Tất cả action đều có notification feedback
- Giá được format theo locale Việt Nam (VND)
