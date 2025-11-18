# Hướng Dẫn Authentication Setup

## Vấn Đề Đã Sửa

Lỗi **401 Unauthorized** xảy ra vì CoursesService không gửi JWT token trong header khi gọi các API protected.

## Đã Cập Nhật

### 1. Thêm Helper Methods trong CoursesService

```typescript
/**
 * Get auth headers with JWT token
 */
private getAuthHeaders(): any {
  const token = this.getToken();
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  return {
    'Content-Type': 'application/json'
  };
}

/**
 * Get JWT token from localStorage
 */
private getToken(): string | null {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}
```

### 2. Cập Nhật Tất Cả Protected Endpoints

Các endpoints sau đã được cập nhật để gửi auth headers:

**Enrollment APIs:**
- ✅ `enrollCourse(courseId)` 
- ✅ `checkEnrollment(courseId)`
- ✅ `getMyEnrollments(status?)`
- ✅ `getCourseProgress(courseId)`
- ✅ `completeLesson(courseId, lessonId, timeSpent)`
- ✅ `getLearningDashboard()`

**Protected Content APIs:**
- ✅ `getCourseModules(courseId)`
- ✅ `getCourseLessons(courseId)`
- ✅ `getLessonById(lessonId)`

## Cách Token Được Lưu

### Khi Login Thành Công

Giả sử bạn có AuthService như sau:

```typescript
// auth.service.ts
login(email: string, password: string): Observable<any> {
  return this.http.post(`${API_URL}/auth/login`, { email, password })
    .pipe(
      tap(response => {
        if (response.token) {
          // Lưu token vào localStorage
          localStorage.setItem('token', response.token);
          
          // Lưu user info (optional)
          localStorage.setItem('user', JSON.stringify(response.user));
        }
      })
    );
}
```

### Khi Logout

```typescript
// auth.service.ts
logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  this.router.navigate(['/login']);
}
```

## Kiểm Tra Token

### 1. Trong Browser Console

```javascript
// Kiểm tra token có tồn tại không
localStorage.getItem('token')

// Xem token
console.log(localStorage.getItem('token'))
```

### 2. Trong DevTools > Application Tab

1. Mở DevTools (F12)
2. Chọn tab **Application**
3. Sidebar: **Storage** > **Local Storage** > `http://localhost:4200`
4. Tìm key `token`

### 3. Trong Network Tab

1. Mở DevTools (F12)
2. Chọn tab **Network**
3. Gọi một API protected (ví dụ: check enrollment)
4. Click vào request
5. Tab **Headers** > **Request Headers**
6. Tìm `Authorization: Bearer eyJhbGc...`

## Test Authentication

### Test 1: Không Có Token

```javascript
// Xóa token
localStorage.removeItem('token');

// Thử gọi API
// Kết quả: 401 Unauthorized
```

### Test 2: Token Hợp Lệ

```javascript
// Đăng nhập để lấy token
// Token được lưu tự động

// Gọi API
// Kết quả: 200 OK với data
```

### Test 3: Token Hết Hạn

```javascript
// Đợi token hết hạn (thường 24h)
// Hoặc set token cũ

// Gọi API
// Kết quả: 401 Unauthorized với message "Token has expired"

// Giải pháp: Login lại
```

## Troubleshooting

### Lỗi: "Access token is required"

**Nguyên nhân:** Token không được gửi trong header

**Kiểm tra:**
```javascript
// 1. Token có trong localStorage không?
console.log(localStorage.getItem('token'));

// 2. getAuthHeaders() có trả về token không?
// Thêm log trong CoursesService:
console.log('Auth headers:', this.getAuthHeaders());
```

**Giải pháp:**
- Đảm bảo đã login
- Kiểm tra token được lưu đúng key: `'token'`
- Restart frontend nếu cần

### Lỗi: "Invalid token"

**Nguyên nhân:** Token không đúng format hoặc bị corrupt

**Kiểm tra:**
```javascript
const token = localStorage.getItem('token');
console.log('Token:', token);
console.log('Token length:', token?.length);
console.log('Token starts with:', token?.substring(0, 20));
```

**Giải pháp:**
- Login lại để lấy token mới
- Xóa token cũ: `localStorage.removeItem('token')`

### Lỗi: "Token has expired"

**Nguyên nhân:** Token đã hết hạn (thường sau 24h)

**Giải pháp:**
- Login lại
- Implement refresh token (advanced)

### Lỗi: "User not found"

**Nguyên nhân:** Token hợp lệ nhưng user không tồn tại trong DB

**Giải pháp:**
- Kiểm tra user có trong database không
- Login lại với tài khoản đúng

## Best Practices

### 1. Interceptor (Recommended)

Thay vì thêm headers thủ công, nên dùng HTTP Interceptor:

```typescript
// auth.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = localStorage.getItem('token');
    
    if (token) {
      const cloned = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(cloned);
    }
    
    return next.handle(req);
  }
}
```

**Đăng ký trong app.config.ts:**
```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};
```

### 2. Auth Guard

Bảo vệ routes yêu cầu authentication:

```typescript
// auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    return true;
  }
  
  // Redirect to login
  const router = inject(Router);
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};
```

**Sử dụng:**
```typescript
const routes: Routes = [
  {
    path: 'courses/:courseId/lessons/:lessonId',
    component: LessonLearningComponent,
    canActivate: [authGuard]
  }
];
```

### 3. Token Refresh

Tự động refresh token khi sắp hết hạn:

```typescript
// auth.service.ts
refreshToken(): Observable<any> {
  const refreshToken = localStorage.getItem('refreshToken');
  return this.http.post(`${API_URL}/auth/refresh`, { refreshToken })
    .pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
      })
    );
}
```

## Kiểm Tra Hoàn Chỉnh

### Checklist

- [ ] Token được lưu vào localStorage sau khi login
- [ ] Token được gửi trong header của tất cả protected requests
- [ ] Header format: `Authorization: Bearer <token>`
- [ ] API trả về 200 OK (không còn 401)
- [ ] Console không có lỗi authentication
- [ ] Network tab hiển thị Authorization header
- [ ] Logout xóa token khỏi localStorage
- [ ] Login lại tạo token mới

### Test Script

```javascript
// 1. Login
fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
})
.then(res => res.json())
.then(data => {
  console.log('Token:', data.token);
  localStorage.setItem('token', data.token);
});

// 2. Test protected endpoint
const token = localStorage.getItem('token');
fetch('http://localhost:3000/api/v1/course-enrollments/1/check', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => console.log('Enrollment:', data));
```

## Kết Luận

Sau khi cập nhật:
- ✅ Token được gửi tự động trong tất cả protected requests
- ✅ Không còn lỗi 401 Unauthorized
- ✅ User có thể enroll và complete lessons
- ✅ Progress được lưu vào database

Nếu vẫn gặp lỗi 401, kiểm tra:
1. Token có trong localStorage không?
2. Token có được gửi trong header không? (xem Network tab)
3. Token có hợp lệ không? (test bằng curl hoặc Postman)
