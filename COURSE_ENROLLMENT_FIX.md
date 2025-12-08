# Fix: Ở lại trang chi tiết khóa học sau khi đăng ký

## Vấn đề
Khi đăng ký khóa học, hệ thống tự động chuyển người dùng đến trang học (`/courses/:id/learn`), thay vì ở lại trang chi tiết khóa học.

## Nguyên nhân
Trong `course-detail.component.ts`, sau khi đăng ký thành công, code gọi `this.startLearning()` tự động:

```typescript
this.coursesService.enrollCourse(this.course.id).subscribe({
  next: (response: any) => {
    this.isEnrolled = true;
    this.notificationService.success(...);
    this.startLearning(); // ← TỰ ĐỘNG CHUYỂN ĐẾN TRANG HỌC
  }
});
```

Method `startLearning()` sẽ navigate đến `/courses/:id/learn`:
```typescript
startLearning(): void {
  this.router.navigate(['/courses', this.course?.id, 'learn']);
}
```

## Giải pháp
Bỏ việc tự động gọi `startLearning()` sau khi đăng ký thành công. Để người dùng tự quyết định:
- Ở lại trang chi tiết để xem thông tin khóa học
- Đánh giá khóa học
- Click button "Bắt đầu học" khi sẵn sàng

### Thay đổi code

**File**: `cli/src/app/features/courses/course-detail/course-detail.component.ts`

**Trước**:
```typescript
next: (response: any) => {
  this.isEnrolled = true;
  this.isEnrolling = false;
  this.notificationService.success(
    'Đăng ký thành công',
    'Bạn đã đăng ký khóa học thành công! Bây giờ bạn có thể đánh giá khóa học.'
  );
  this.startLearning(); // ← Tự động chuyển đến trang học
}
```

**Sau**:
```typescript
next: (response: any) => {
  this.isEnrolled = true;
  this.isEnrolling = false;
  this.notificationService.success(
    'Đăng ký thành công',
    'Bạn đã đăng ký khóa học thành công! Bây giờ bạn có thể bắt đầu học hoặc đánh giá khóa học.'
  );
  // Stay on course detail page after enrollment
  // User can click "Bắt đầu học" button to start learning
}
```

Cũng bỏ `startLearning()` trong error handler khi user đã enrolled:
```typescript
} else if (error.message.includes('already enrolled')) {
  this.isEnrolled = true;
  // Stay on course detail page, don't auto-navigate
}
```

## Kết quả

### Trước khi sửa
1. User vào trang chi tiết khóa học
2. Click "Đăng ký"
3. Đăng ký thành công
4. **Tự động chuyển đến trang học** `/courses/:id/learn`

### Sau khi sửa
1. User vào trang chi tiết khóa học
2. Click "Đăng ký"
3. Đăng ký thành công
4. **Ở lại trang chi tiết khóa học** `/courses/:id`
5. User có thể:
   - Xem thông tin khóa học
   - Đánh giá khóa học
   - Click "Bắt đầu học" khi sẵn sàng

## User Experience

### Lợi ích
- ✅ User có thời gian xem lại thông tin khóa học sau khi đăng ký
- ✅ User có thể đánh giá khóa học ngay sau khi đăng ký
- ✅ User tự quyết định khi nào bắt đầu học
- ✅ Không bị "ép" vào trang học ngay lập tức

### Flow mới
```
Trang chi tiết khóa học
  ↓
Click "Đăng ký"
  ↓
Đăng ký thành công
  ↓
Vẫn ở trang chi tiết (button "Đăng ký" → "Bắt đầu học")
  ↓
User click "Bắt đầu học" khi sẵn sàng
  ↓
Chuyển đến trang học
```

## Test

### Test 1: Đăng ký khóa học miễn phí
```bash
1. Vào trang chi tiết khóa học miễn phí
2. Click "Đăng ký"
3. Kiểm tra:
   - ✅ Thông báo "Đăng ký thành công"
   - ✅ Vẫn ở trang chi tiết khóa học
   - ✅ Button "Đăng ký" đổi thành "Bắt đầu học"
   - ✅ Có thể đánh giá khóa học
```

### Test 2: Đăng ký khóa học có phí
```bash
1. Vào trang chi tiết khóa học có phí
2. Click "Đăng ký"
3. Chuyển đến trang thanh toán
4. Thanh toán thành công
5. Kiểm tra:
   - ✅ Chuyển về trang chi tiết khóa học (hoặc trang học, tùy backend config)
```

### Test 3: User đã đăng ký rồi
```bash
1. Vào trang chi tiết khóa học đã đăng ký
2. Kiểm tra:
   - ✅ Hiển thị button "Bắt đầu học" thay vì "Đăng ký"
   - ✅ Click "Bắt đầu học" → Chuyển đến trang học
```

## Lưu ý

- Button "Bắt đầu học" vẫn hoạt động bình thường, sẽ navigate đến `/courses/:id/learn`
- Chỉ thay đổi hành vi sau khi đăng ký, không ảnh hưởng đến các flow khác
- Notification message đã được cập nhật để phản ánh hành vi mới
