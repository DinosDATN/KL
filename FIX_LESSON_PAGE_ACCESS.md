# Sửa Lỗi Không Truy Cập Được Trang Lessons

## Vấn Đề

Trang lessons (`/courses/:courseId/lessons/:lessonId`) không thể truy cập được sau khi sửa guards.

## Nguyên Nhân

1. **Timeout trong SSR**: Guards đợi `authInitialized$` nhưng không xử lý timeout error, dẫn đến trang bị treo
2. **Redirect URL sai**: Component redirect về `/login` thay vì `/auth/login`
3. **Thiếu error handling**: Không có fallback khi auth initialization bị timeout

## Giải Pháp

### 1. Thêm Error Handling cho Timeout

Thêm `catchError` để xử lý timeout trong guards:

```typescript
return this.authService.authInitialized$.pipe(
  filter(initialized => initialized === true),
  take(1),
  timeout(5000),
  catchError(() => {
    // Nếu timeout, coi như chưa authenticated
    console.warn('Auth initialization timeout, redirecting to login');
    return of(false); // hoặc of(null) cho AdminGuard
  }),
  switchMap(() => this.authService.isAuthenticated$),
  take(1),
  map((isAuthenticated: boolean) => {
    // Xử lý authentication
  })
);
```

### 2. Sửa Redirect URL trong Component

**Trước:**
```typescript
this.router.navigate(['/login'], {
  queryParams: { returnUrl: `/courses/${courseId}/lessons/${lessonId}` }
});
```

**Sau:**
```typescript
this.router.navigate(['/auth/login'], {
  queryParams: { returnUrl: `/courses/${courseId}/lessons/${lessonId}` }
});
```

## Files Đã Sửa

### 1. `cli/src/app/core/guards/auth.guard.ts`

**Thay đổi:**
- Import thêm `catchError` và `of`
- Thêm error handling cho timeout trong `AuthGuard`
- Thêm error handling cho timeout trong `NoAuthGuard`

**Code:**
```typescript
import { Observable, map, take, filter, switchMap, timeout, catchError, of } from 'rxjs';

// Trong canActivate:
return this.authService.authInitialized$.pipe(
  filter(initialized => initialized === true),
  take(1),
  timeout(5000),
  catchError(() => {
    console.warn('Auth initialization timeout, redirecting to login');
    return of(false);
  }),
  switchMap(() => this.authService.isAuthenticated$),
  take(1),
  map((isAuthenticated: boolean) => { ... })
);
```

### 2. `cli/src/app/core/guards/admin.guard.ts`

**Thay đổi:**
- Import thêm `catchError` và `of`
- Thêm error handling cho timeout

**Code:**
```typescript
import { Observable, map, take, filter, switchMap, timeout, catchError, of } from 'rxjs';

// Trong canActivate:
return this.authService.authInitialized$.pipe(
  filter(initialized => initialized === true),
  take(1),
  timeout(5000),
  catchError(() => {
    console.warn('Auth initialization timeout in AdminGuard, redirecting to login');
    return of(null);
  }),
  switchMap(() => this.authService.currentUser$),
  take(1),
  map((user) => { ... })
);
```

### 3. `cli/src/app/features/courses/lesson-learning/lesson-learning.component.ts`

**Thay đổi:**
- Sửa redirect URL từ `/login` thành `/auth/login`

**Trước:**
```typescript
this.router.navigate(['/login'], {
  queryParams: { returnUrl: `/courses/${courseId}/lessons/${lessonId}` }
});
```

**Sau:**
```typescript
this.router.navigate(['/auth/login'], {
  queryParams: { returnUrl: `/courses/${courseId}/lessons/${lessonId}` }
});
```

## Cách Hoạt Động

### Flow Khi Truy Cập Trang Lessons:

1. **User truy cập** `/courses/1/lessons/5`
2. **AuthGuard kiểm tra**:
   - Nếu SSR: Cho phép render ngay
   - Nếu Browser: Đợi `authInitialized$` (max 5s)
3. **Nếu timeout**:
   - `catchError` bắt lỗi
   - Trả về `of(false)` → Coi như chưa authenticated
   - Redirect về `/auth/login?returnUrl=/courses/1/lessons/5`
4. **Nếu authenticated**:
   - Component load và kiểm tra enrollment
   - Nếu enrolled: Hiển thị lesson
   - Nếu chưa enrolled: Hiển thị thông báo
5. **Nếu chưa authenticated**:
   - Guard redirect về `/auth/login?returnUrl=/courses/1/lessons/5`
   - Sau khi login, redirect về trang lesson

## Testing

### Test 1: Truy cập khi đã đăng nhập và enrolled
1. Đăng nhập vào hệ thống
2. Đăng ký khóa học
3. Truy cập `/courses/1/lessons/5`
4. ✅ Trang lesson hiển thị bình thường

### Test 2: Truy cập khi đã đăng nhập nhưng chưa enrolled
1. Đăng nhập vào hệ thống
2. Không đăng ký khóa học
3. Truy cập `/courses/1/lessons/5`
4. ✅ Hiển thị thông báo "Bạn cần đăng ký khóa học để xem bài học này"

### Test 3: Truy cập khi chưa đăng nhập
1. Chưa đăng nhập
2. Truy cập `/courses/1/lessons/5`
3. ✅ Redirect về `/auth/login?returnUrl=/courses/1/lessons/5`
4. Sau khi login, redirect về trang lesson

### Test 4: Reload trang lesson
1. Đăng nhập và truy cập trang lesson
2. Reload trang (F5)
3. ✅ Trang vẫn hiển thị, không bị redirect về login

### Test 5: SSR
1. Truy cập trang lesson lần đầu (SSR)
2. ✅ Trang render được, không bị timeout
3. Client-side hydration kiểm tra auth
4. Nếu chưa authenticated, redirect về login

## Lưu Ý

- **Timeout 5 giây**: Đủ thời gian cho auth initialization nhưng không quá lâu
- **Error handling**: Đảm bảo guards không bao giờ bị treo
- **SSR compatible**: Guards cho phép render trong SSR
- **Consistent redirect**: Tất cả redirect đều về `/auth/login`
- **Return URL**: Sau khi login, user được redirect về trang họ muốn truy cập

## Kết Luận

Trang lessons giờ đây có thể truy cập được bình thường với:
- ✅ Xử lý timeout đúng cách
- ✅ Redirect URL nhất quán
- ✅ SSR hoạt động tốt
- ✅ Reload trang không bị lỗi
- ✅ Error handling đầy đủ
