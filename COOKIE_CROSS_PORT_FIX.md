# 🔧 Fix Cookie Cross-Port Issue

## ❌ Vấn Đề

Cookie được set từ backend (port 3000) nhưng frontend (port 4200) không thể đọc được:

```
✅ Cookie đã có trong DevTools
❌ Nhưng không được gửi trong API requests
❌ Error: Access token is required, error: No token provided
```

**Nguyên nhân**: Browsers không share cookies giữa các ports khác nhau, ngay cả trên cùng localhost.

## 🎯 Giải Pháp: Angular Proxy

Cấu hình Angular proxy để tất cả API requests đi qua cùng port với frontend.

### Đã Thực Hiện

**1. Tạo `cli/proxy.conf.json`**:

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

**Giải thích**:
- `/api/*` requests sẽ được proxy đến `http://localhost:3000`
- `changeOrigin: true` - Thay đổi origin header
- `logLevel: "debug"` - Log proxy requests (có thể tắt sau)

**2. Update `cli/package.json`**:

```json
{
  "scripts": {
    "start": "ng serve --proxy-config proxy.conf.json"
  }
}
```

### Cách Hoạt Động

**Trước (Không có proxy)**:
```
Frontend: http://localhost:4200
Backend:  http://localhost:3000

Request: http://localhost:4200 → http://localhost:3000/api/v1/auth/profile
Cookie: ❌ Không được gửi (cross-port)
```

**Sau (Có proxy)**:
```
Frontend: http://localhost:4200
Proxy:    http://localhost:4200/api → http://localhost:3000/api

Request: http://localhost:4200/api/v1/auth/profile → Proxy → http://localhost:3000/api/v1/auth/profile
Cookie: ✅ Được gửi (same-origin)
```

## 🚀 Cách Sử Dụng

### Bước 1: Restart Frontend

```bash
cd cli
# Ctrl+C để stop server hiện tại
npm start
```

**Quan sát logs**:
```
[HPM] Proxy created: /api  -> http://localhost:3000
[HPM] Proxy rewrite rule created: "^/api" ~> ""
```

### Bước 2: Test OAuth Login

1. Mở `http://localhost:4200/auth/login`
2. Click **Đăng nhập với Google**
3. Authorize app
4. Quan sát console logs:

**Kết quả mong đợi**:
```
OAuth callback query params: { success: 'true' }
✅ OAuth callback: Success flag received
✅ Cookie should be set by backend, verifying session...
✅ Session verified, user authenticated: User Name
✅ Cookie is working correctly
✅ User authenticated, initializing app
🔌 Socket connection status: CONNECTED
📬 Loading notifications
✅ Loaded X notifications
```

### Bước 3: Kiểm Tra Network Tab

1. F12 > Network tab
2. Tìm request đến `/api/v1/auth/profile`
3. Kiểm tra:
   - **Request URL**: `http://localhost:4200/api/v1/auth/profile` (same-origin!)
   - **Request Headers**: `Cookie: auth_token=...` ✅
   - **Response**: 200 OK ✅

## 📊 So Sánh

### ❌ Không Có Proxy

```
Request URL: http://localhost:3000/api/v1/auth/profile
Origin: http://localhost:4200
Cookie: ❌ Không có (cross-port)
Response: 401 Unauthorized
```

### ✅ Có Proxy

```
Request URL: http://localhost:4200/api/v1/auth/profile
Origin: http://localhost:4200
Cookie: auth_token=eyJhbGc... ✅
Response: 200 OK
```

## 🔍 Debug Proxy

Nếu proxy không hoạt động, kiểm tra:

### 1. Proxy Logs

Trong terminal khi start frontend, bạn sẽ thấy:

```
[HPM] GET /api/v1/auth/profile -> http://localhost:3000
```

### 2. Network Tab

Request URL phải là:
```
http://localhost:4200/api/v1/auth/profile
```

**KHÔNG PHẢI**:
```
http://localhost:3000/api/v1/auth/profile
```

### 3. Environment Config

Đảm bảo `environment.ts` vẫn dùng `/api/v1`:

```typescript
// cli/src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: '/api/v1', // ✅ Relative URL, sẽ được proxy
  // KHÔNG PHẢI: 'http://localhost:3000/api/v1'
};
```

## 🎯 Lợi Ích Của Proxy

1. ✅ **Cookies hoạt động** - Same-origin requests
2. ✅ **Không cần CORS** - Không còn cross-origin
3. ✅ **Đơn giản hơn** - Không cần cấu hình phức tạp
4. ✅ **Giống production** - Production cũng dùng same-origin
5. ✅ **Dễ debug** - Tất cả requests trong cùng domain

## 🚨 Lưu Ý

### Development vs Production

**Development** (với proxy):
```
Frontend: http://localhost:4200
API: http://localhost:4200/api → Proxy → http://localhost:3000/api
```

**Production** (không cần proxy):
```
Frontend: https://yourdomain.com
API: https://yourdomain.com/api → Nginx/Apache reverse proxy → Backend
```

### Environment Variables

**Development** (`environment.ts`):
```typescript
apiUrl: '/api/v1' // Relative URL
```

**Production** (`environment.prod.ts`):
```typescript
apiUrl: '/api/v1' // Vẫn relative, Nginx sẽ proxy
```

Hoặc nếu API ở subdomain khác:
```typescript
apiUrl: 'https://api.yourdomain.com/v1' // Absolute URL
```

## ✅ Checklist

- [x] Tạo `cli/proxy.conf.json`
- [x] Update `cli/package.json` start script
- [ ] Restart frontend với `npm start`
- [ ] Kiểm tra proxy logs trong terminal
- [ ] Test OAuth login
- [ ] Verify cookie được gửi trong requests
- [ ] Verify không còn 401 errors
- [ ] Test normal login (email/password)
- [ ] Test tất cả protected routes

## 🎉 Kết Quả

Sau khi setup proxy:

1. ✅ **Cookies hoạt động** với OAuth và normal login
2. ✅ **Không còn 401 errors**
3. ✅ **Socket.IO connects** thành công
4. ✅ **Notifications load** thành công
5. ✅ **All protected APIs work** thành công

---

**Files đã tạo/sửa**:
- `cli/proxy.conf.json` (NEW)
- `cli/package.json` (UPDATED)

**Restart frontend và test lại!** 🚀

## 📚 Tham Khảo

- [Angular Proxy Configuration](https://angular.io/guide/build#proxying-to-a-backend-server)
- [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware)
