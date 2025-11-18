# Debug Token Issue - 401 Unauthorized

## Vấn Đề

API vẫn trả về **401 Unauthorized** với message "Access token is required" nghĩa là token không được gửi trong request.

## Các Bước Debug

### Bước 1: Kiểm Tra Token Trong Browser

#### Option 1: Dùng Console
```javascript
// Mở Console (F12) và chạy:
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));
console.log('All keys:', Object.keys(localStorage));
```

**Kết quả mong đợi:**
```
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
User: {"id":1,"name":"Test User","email":"test@example.com"}
All keys: ['token', 'user']
```

**Nếu token = null:**
- ❌ User chưa đăng nhập
- ❌ Token bị xóa
- ❌ Key lưu sai tên (không phải 'token')

#### Option 2: Dùng DevTools
1. F12 > Tab **Application**
2. Sidebar: **Storage** > **Local Storage** > `http://localhost:4200`
3. Tìm key `token`
4. Xem value

#### Option 3: Dùng Test Tool
```bash
# Mở file test-token-debug.html trong browser
# Click "Check Token in localStorage"
```

### Bước 2: Kiểm Tra AuthService

Xem AuthService có lưu token đúng cách không:

<function_calls>
<invoke name="grepSearch">
<parameter name="explanation">Find AuthService to check how it saves token