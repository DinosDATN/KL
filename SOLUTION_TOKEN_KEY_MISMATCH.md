# ✅ Giải Quyết Vấn Đề Token Key Mismatch

## 🔍 Vấn Đề Đã Tìm Ra

**Root Cause:** AuthService và CoursesService sử dụng **khác key** để lưu/lấy token!

```typescript
// AuthService lưu token với key:
private readonly TOKEN_KEY = 'auth_token';  // ✅ Đúng

// CoursesService tìm token với key:
localStorage.getItem('token');  // ❌ Sai - không tìm thấy!
```

## ✅ Giải Pháp

Cập nhật CoursesService để tìm token với đúng key:

```typescript
private getToken(): string | null {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    // Try 'auth_token' first (used by AuthService)
    let token = localStorage.getItem('auth_token');  // ✅ Đúng key
    
    // Fallback to 'token' for backward compatibility
    if (!token) {
      token = localStorage.getItem('token');
    }
    
    return token;
  }
  
  return null;
}
```

## 🧪 Test Ngay

### 1. Kiểm Tra Token Key

```javascript
// Mở Console (F12) và chạy:
console.log('auth_token:', localStorage.getItem('auth_token'));
console.log('token:', localStorage.getItem('token'));
```

**Kết quả mong đợi:**
```
auth_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  ✅
token: null  ⚠️ (không có - đây là lý do lỗi 401)
```

### 2. Test API

Sau khi sửa, test lại:

```javascript
// Trong browser console
fetch('http://localhost:3000/api/v1/course-enrollments/1/check', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "data": {
    "isEnrolled": false,
    "enrollment": null
  }
}
```

### 3. Test Trong Angular App

1. Restart Angular dev server (nếu cần)
2. Đăng nhập lại (nếu cần)
3. Vào trang lesson learning
4. Xem Console - không còn lỗi 401

## 📊 So Sánh Trước/Sau

### Trước (Lỗi)
```
User login → Token saved as 'auth_token'
CoursesService → Tìm 'token' → Không tìm thấy → 401 Unauthorized
```

### Sau (Đúng)
```
User login → Token saved as 'auth_token'
CoursesService → Tìm 'auth_token' → Tìm thấy → Gửi trong header → 200 OK
```

## 🔧 Các Cách Giải Quyết Khác

### Option 1: Thống nhất key (Recommended)

Tạo một constant chung:

```typescript
// constants/auth.constants.ts
export const AUTH_TOKEN_KEY = 'auth_token';
export const AUTH_USER_KEY = 'auth_user';
```

Sử dụng trong cả AuthService và CoursesService:

```typescript
import { AUTH_TOKEN_KEY } from '../constants/auth.constants';

// AuthService
private readonly TOKEN_KEY = AUTH_TOKEN_KEY;

// CoursesService
private getToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}
```

### Option 2: Dùng AuthService để lấy token

```typescript
// CoursesService
constructor(
  private http: HttpClient,
  private authService: AuthService  // Inject AuthService
) {}

private getToken(): string | null {
  return this.authService.getToken();  // Dùng method của AuthService
}
```

### Option 3: HTTP Interceptor (Best Practice)

Tạo interceptor tự động thêm token:

```typescript
// auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('auth_token');
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(req);
};
```

Đăng ký trong app.config.ts:

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};
```

**Lợi ích:**
- ✅ Không cần thêm headers thủ công
- ✅ Token tự động được thêm vào mọi request
- ✅ Dễ maintain và test

## 🎯 Checklist Sau Khi Sửa

- [ ] CoursesService tìm token với key 'auth_token'
- [ ] Console không còn warning "Token not found"
- [ ] API không còn trả về 401 Unauthorized
- [ ] Network tab hiển thị Authorization header
- [ ] User có thể enroll và complete lessons
- [ ] Progress được lưu vào database

## 🚀 Kết Quả

Sau khi sửa:
- ✅ Token được tìm thấy đúng cách
- ✅ Token được gửi trong mọi protected request
- ✅ API trả về 200 OK
- ✅ Enrollment và progress tracking hoạt động
- ✅ Dữ liệu được lưu vào database

## 📝 Bài Học

**Luôn kiểm tra:**
1. Key lưu token có đúng không?
2. Key lấy token có khớp không?
3. Token có tồn tại trong localStorage không?
4. Token có được gửi trong header không?

**Best Practice:**
- Dùng constants cho keys
- Dùng HTTP Interceptor
- Log để debug
- Test kỹ authentication flow

---

Vấn đề đã được giải quyết! 🎉
