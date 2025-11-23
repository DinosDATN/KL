# Hướng dẫn test routes Creator - CẬP NHẬT

## Vấn đề đã sửa

Khi nhấn vào nút "Nội dung" trong trang `/creator/courses`, ứng dụng không hiển thị trang quản lý nội dung.

## Nguyên nhân

1. Routes `/creator/courses/:id/content` và `/creator/courses/:id/analytics` chưa được định nghĩa
2. **Thứ tự route sai** - Route cụ thể phải đứng trước route chung

## Giải pháp đã áp dụng

### 1. Đã sửa thứ tự routes trong `app.routes.ts`:
```typescript
// ✅ ĐÚNG - Route cụ thể đứng trước
{
  path: 'creator/courses/:id/content',  // Đứng trước
  loadComponent: () => import('./features/creator/course-content/course-content.component')
    .then((m) => m.CourseContentComponent),
  canActivate: [AuthGuard],
},
{
  path: 'creator/courses/:id/analytics',  // Đứng trước
  loadComponent: () => import('./features/creator/course-analytics/course-analytics.component')
    .then((m) => m.CourseAnalyticsComponent),
  canActivate: [AuthGuard],
},
{
  path: 'creator/courses',  // Đứng sau
  loadComponent: () => import('./features/creator/course-management/creator-course-management.component')
    .then((m) => m.CreatorCourseManagementComponent),
  canActivate: [AuthGuard],
},
```

### 2. Đã tạo 2 components mới:
- `cli/src/app/features/creator/course-content/` - Quản lý nội dung khóa học
- `cli/src/app/features/creator/course-analytics/` - Thống kê khóa học

### 3. Đã thêm logging để debug:
- Console sẽ hiển thị thông tin navigation
- Console sẽ hiển thị khi component được khởi tạo

## Cách test - QUAN TRỌNG

### Bước 1: Clear cache và reload
```bash
# Trong browser, nhấn Ctrl+Shift+R (Windows) hoặc Cmd+Shift+R (Mac)
# Hoặc mở DevTools và right-click vào nút reload → "Empty Cache and Hard Reload"
```

### Bước 2: Kiểm tra console
1. Mở DevTools (F12)
2. Vào tab Console
3. Nhấn vào nút "Nội dung"
4. Xem console log:
   ```
   Navigating to content management for course: [ID]
   Navigation URL: ["/creator/courses", ID, "content"]
   Navigation success: true
   CourseContentComponent initialized
   Route params: {id: "ID"}
   Course ID: ID
   ```

### Bước 3: Kiểm tra URL
- URL phải thay đổi thành: `/creator/courses/[ID]/content`
- Nếu URL không đổi hoặc về trang chủ → Có vấn đề với routing

### Bước 4: Kiểm tra hiển thị
- Trang phải hiển thị header "Quản lý nội dung khóa học"
- Có nút "Quay lại" ở góc trái
- Hiển thị tên khóa học bên dưới tiêu đề

## Nếu vẫn không hoạt động

### Kiểm tra 1: Route có được load không?
```typescript
// Mở browser console và chạy:
console.log(window.location.pathname);
// Phải hiển thị: /creator/courses/[ID]/content
```

### Kiểm tra 2: Component có được load không?
```typescript
// Xem console có log "CourseContentComponent initialized" không
```

### Kiểm tra 3: AuthGuard có block không?
```typescript
// Xem console có warning về AuthGuard không
```

### Kiểm tra 4: Restart dev server
```bash
# Stop server (Ctrl+C)
cd cli
npm start
```

## Debug checklist

- [ ] Đã clear browser cache (Ctrl+Shift+R)
- [ ] Đã mở DevTools Console
- [ ] URL thay đổi đúng khi nhấn nút
- [ ] Console hiển thị "Navigating to content management"
- [ ] Console hiển thị "CourseContentComponent initialized"
- [ ] Trang hiển thị header "Quản lý nội dung khóa học"

## Files đã thay đổi

1. `cli/src/app/app.routes.ts` - Sửa thứ tự routes
2. `cli/src/app/features/creator/course-content/` - Component mới (3 files)
3. `cli/src/app/features/creator/course-analytics/` - Component mới (3 files)
4. `cli/src/app/features/creator/course-management/creator-course-management.component.ts` - Thêm logging
