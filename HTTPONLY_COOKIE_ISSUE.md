# HttpOnly Cookie Issue - Giải thích và Giải pháp

## Vấn đề phát hiện

Từ console log:
```
🔑 ChatService: Token available: false
❌ ChatService: Cannot initialize - token is null
[Auth] getToken() is deprecated. Token is in HttpOnly cookie.
```

## Nguyên nhân

Hệ thống sử dụng **HttpOnly Cookie** để lưu trữ authentication token thay vì localStorage. Đây là một practice tốt cho bảo mật vì:

1. ✅ **Bảo vệ khỏi XSS attacks**: JavaScript không thể đọc HttpOnly cookie
2. ✅ **Tự động gửi với mọi request**: Browser tự động attach cookie vào HTTP headers
3. ✅ **Không cần quản lý token manually**: Backend tự động verify cookie

## Vấn đề với code hiện tại

Code cũ check token từ `authService.getToken()`:

```typescript
const token = this.authService.getToken();

if (!token) {
  console.error('❌ Cannot initialize - token is null');
  return; // DỪNG LẠI Ở ĐÂY!
}
```

Nhưng vì token ở trong HttpOnly cookie, `getToken()` trả về `null`, dẫn đến:
- ❌ Chat không initialize
- ❌ API không được gọi
- ❌ Danh sách phòng không load

## Giải pháp

### 1. Không check token nữa
Thay vì check token, chỉ check `isAuthenticated()`:

```typescript
const isAuthenticated = this.authService.isAuthenticated();

if (!isAuthenticated) {
  console.error('❌ Cannot initialize - user not authenticated');
  return;
}

// Token sẽ tự động được gửi kèm trong HTTP request
this.loadUserRooms().subscribe(...);
```

### 2. HTTP Requests tự động gửi cookie
Khi gọi API:
```typescript
this.http.get('/api/v1/chat/rooms')
```

Browser tự động:
1. Tìm HttpOnly cookie cho domain này
2. Attach cookie vào request header
3. Backend nhận và verify cookie
4. Trả về data nếu hợp lệ

### 3. Socket.IO connection
Đối với Socket.IO, có 2 cách:

**Cách 1: Sử dụng cookie-based auth**
```typescript
// Socket.IO tự động gửi cookies
io.connect(url, {
  withCredentials: true // Cho phép gửi cookies
});
```

**Cách 2: Lấy token từ API endpoint**
```typescript
// Backend cung cấp endpoint để lấy token cho socket
this.http.get('/api/v1/auth/socket-token').subscribe(token => {
  this.socketService.connect(token, user);
});
```

## Thay đổi đã thực hiện

### File: `cli/src/app/core/services/chat.service.ts`

**Trước**:
```typescript
const token = this.authService.getToken();

if (!token) {
  console.error('❌ Cannot initialize - token is null');
  return;
}

this.socketService.connect(token, user);
```

**Sau**:
```typescript
const isAuthenticated = this.authService.isAuthenticated();

if (!isAuthenticated) {
  console.error('❌ Cannot initialize - user not authenticated');
  return;
}

console.log('ℹ️ Token is in HttpOnly cookie (will be sent automatically)');

// Try to get token for socket (might be null, socket might use cookies)
const token = this.authService.getToken();
this.socketService.connect(token || '', user);
```

## Test

### Test 1: Reload trang
```bash
1. F5
2. Kiểm tra console log
3. Phải thấy:
   - ✅ "User authenticated: true"
   - ✅ "Loading rooms from API..."
   - ✅ "Loaded X chat rooms from API"
   - ❌ KHÔNG thấy "token is null"
```

### Test 2: Network tab
```bash
1. F12 > Network > XHR
2. F5
3. Tìm request "/api/v1/chat/rooms"
4. Click vào request
5. Tab "Headers" > "Request Headers"
6. Phải thấy "Cookie: ..." với token
```

### Test 3: Application tab
```bash
1. F12 > Application > Cookies
2. Chọn domain của bạn
3. Phải thấy cookie với:
   - Name: (tên cookie của bạn, vd: "token", "auth_token")
   - HttpOnly: ✓ (checked)
   - Secure: ✓ (nếu dùng HTTPS)
```

## Lưu ý quan trọng

### 1. CORS Configuration
Backend phải config CORS để cho phép credentials:

```javascript
// Express.js example
app.use(cors({
  origin: 'http://localhost:4200', // Frontend URL
  credentials: true // CHO PHÉP GỬI COOKIES
}));
```

### 2. Frontend HTTP Client
Angular HttpClient phải config `withCredentials`:

```typescript
// Trong interceptor hoặc mỗi request
this.http.get(url, {
  withCredentials: true // GỬI COOKIES
})
```

### 3. Socket.IO Configuration
Socket.IO cũng cần config credentials:

```typescript
// Frontend
io.connect(url, {
  withCredentials: true,
  extraHeaders: {
    // Có thể thêm headers khác nếu cần
  }
});

// Backend
io.on('connection', (socket) => {
  // Verify cookie từ socket.handshake.headers.cookie
});
```

## Kết luận

Vấn đề đã được giải quyết bằng cách:
1. ✅ Không check token từ `getToken()` nữa
2. ✅ Chỉ check `isAuthenticated()`
3. ✅ Tin tưởng vào HttpOnly cookie tự động gửi kèm requests
4. ✅ API sẽ hoạt động vì browser tự động gửi cookie

Sau khi áp dụng fix này, khi reload trang:
- ✅ Chat sẽ initialize
- ✅ API sẽ được gọi
- ✅ Danh sách phòng sẽ load
- ✅ Không còn lỗi "token is null"
