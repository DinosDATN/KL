# 🔌 Socket.IO với HttpOnly Cookie - HOÀN THÀNH

## ✅ Đã Sửa

Socket.IO giờ đã sử dụng HttpOnly cookie thay vì token trong auth object!

---

## 🔧 Backend Changes

### socketAuthMiddleware.js - Đọc Cookie

```javascript
const extractToken = (socket) => {
  // ✅ Method 0: HttpOnly Cookie (PRIORITY - Most Secure)
  const cookieHeader = socket.handshake.headers?.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});
    
    if (cookies.auth_token) {
      console.log('🍪 Token found in HttpOnly cookie');
      return cookies.auth_token;
    }
  }
  
  // Fallback to other methods...
};
```

**Giải thích**:
- Socket.IO handshake có `headers.cookie`
- Parse cookie string thành object
- Lấy `auth_token` từ cookies
- Fallback về các methods khác nếu không có cookie

---

## 🎨 Frontend Changes

### socket.service.ts - withCredentials

```typescript
connect(token: string, user: User): void {
  console.log('🍪 Using HttpOnly cookie for authentication');

  this.socket = io(serverUrl, {
    withCredentials: true, // ✅ Important: Send cookies
    transports: ['websocket', 'polling'],
    // ❌ No need to send token in auth - cookie will be sent automatically
  });
}
```

**Thay đổi**:
- ✅ Thêm `withCredentials: true`
- ❌ Xóa `auth: { token: token }`
- Cookie sẽ được gửi tự động trong handshake

### app.component.ts - No Token Needed

```typescript
// ✅ Pass empty string as token - cookie will be sent automatically
this.socketService.connect('', user);
```

---

## 🧪 Test Socket.IO

### Bước 1: Restart Backend

```bash
cd api
# Ctrl+C
npm start
```

### Bước 2: Restart Frontend

```bash
cd cli
# Ctrl+C
npm start
```

### Bước 3: Login và Test

1. Login bằng OAuth hoặc email/password
2. Quan sát backend logs:

**Kết quả mong đợi**:
```
🔐 Starting Socket.IO authentication...
📡 Socket ID: abc123...
🌐 Client: 127.0.0.1
🍪 Token found in HttpOnly cookie
🔑 Token found: eyJhbGciOiJIUzI1NiIs...
✅ JWT token verified successfully
👤 User ID extracted: 51
✅ User validated: Duy Khang (dinos.datn@gmail.com)
✅ Socket authentication successful in 45ms for user: Duy Khang
```

**Frontend logs**:
```
📁 Connecting to Socket.IO server...
👤 User: Duy Khang
🍪 Using HttpOnly cookie for authentication
🌍 Server URL: http://localhost:3000
Connected to server
🔌 Socket connection status: CONNECTED
```

### Bước 4: Test Real-time Features

1. Mở chat
2. Gửi message
3. Kiểm tra real-time updates

**Kết quả**: Tất cả hoạt động bình thường!

---

## 📊 So Sánh Trước/Sau

### ❌ Trước (Token trong Auth)

**Frontend**:
```typescript
this.socket = io(serverUrl, {
  auth: {
    token: token, // ❌ Token exposed
  },
  transports: ['websocket', 'polling'],
});
```

**Backend**:
```javascript
const token = socket.handshake.auth?.token; // ❌ Only checks auth object
```

**Vấn đề**:
- Token phải được truyền từ frontend
- Token có thể bị expose trong memory
- Không tận dụng HttpOnly cookie

### ✅ Sau (HttpOnly Cookie)

**Frontend**:
```typescript
this.socket = io(serverUrl, {
  withCredentials: true, // ✅ Send cookies
  transports: ['websocket', 'polling'],
  // ❌ No token in auth
});
```

**Backend**:
```javascript
// ✅ Check cookie first
const cookieHeader = socket.handshake.headers?.cookie;
const cookies = parseCookies(cookieHeader);
const token = cookies.auth_token;
```

**Lợi ích**:
- ✅ Token trong HttpOnly cookie (secure)
- ✅ Không cần truyền token từ frontend
- ✅ Tự động gửi cookie trong handshake
- ✅ Consistent với REST API authentication

---

## 🔒 Security Benefits

### XSS Protection

**HttpOnly cookie** không thể access từ JavaScript:
```javascript
// ❌ Không thể đánh cắp token
console.log(document.cookie); // Không thấy auth_token
```

### Automatic Cookie Sending

Socket.IO tự động gửi cookies khi có `withCredentials: true`:
```
WebSocket Handshake:
GET /socket.io/?EIO=4&transport=websocket
Cookie: auth_token=eyJhbGc...
```

### Fallback Support

Middleware vẫn support các methods khác:
- Cookie (priority)
- auth.token
- Authorization header
- Query parameters

---

## 🎯 Checklist

- [x] Backend: Parse cookie trong socketAuthMiddleware
- [x] Backend: Check cookie trước các methods khác
- [x] Frontend: Thêm `withCredentials: true`
- [x] Frontend: Xóa `auth: { token }`
- [x] App component: Pass empty string as token
- [ ] Restart backend
- [ ] Restart frontend
- [ ] Test login
- [ ] Test Socket.IO connection
- [ ] Test real-time features (chat, notifications)
- [ ] Verify backend logs show cookie authentication

---

## 🚨 Troubleshooting

### Vấn Đề 1: Socket Vẫn Không Connect

**Kiểm tra backend logs**:
```
❌ No authentication token found in any source
```

**Giải pháp**:
- Check `withCredentials: true` trong socket config
- Check cookie có tồn tại không (F12 > Application > Cookies)
- Restart cả backend và frontend

### Vấn Đề 2: Cookie Không Được Gửi

**Kiểm tra**:
1. Socket.IO config có `withCredentials: true` không?
2. Cookie có domain đúng không? (localhost)
3. CORS có `credentials: true` không?

**Giải pháp**:
- Đảm bảo CORS được cấu hình đúng trong app.js
- Đảm bảo cookie có domain = localhost
- Restart backend

### Vấn Đề 3: Token Invalid

**Backend logs**:
```
❌ JWT verification failed: invalid signature
```

**Giải pháp**:
- Login lại để lấy token mới
- Check JWT_SECRET trong .env
- Clear cookies và login lại

---

## 🎉 Kết Quả

Sau khi hoàn thành:

1. ✅ **Socket.IO authentication** với HttpOnly cookie
2. ✅ **Bảo mật cao** - Token không expose
3. ✅ **Tự động gửi cookie** - Không cần code thêm
4. ✅ **Consistent** - Giống REST API authentication
5. ✅ **Real-time features hoạt động** - Chat, notifications
6. ✅ **Fallback support** - Vẫn support các methods khác

---

**Files đã sửa**:
- `api/src/middleware/socketAuthMiddleware.js`
- `cli/src/app/core/services/socket.service.ts`
- `cli/src/app/app.component.ts`

**Restart cả backend và frontend, rồi test lại!** 🚀
