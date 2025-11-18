# ⚠️ QUAN TRỌNG: Khởi Động Lại Server

## Vấn Đề Hiện Tại
Bạn đang gặp lỗi:
```
401 Unauthorized
Access token is required
```

## Nguyên Nhân
Code đã được sửa đúng, nhưng **server chưa được khởi động lại** để áp dụng thay đổi.

## ✅ Giải Pháp: Khởi Động Lại API Server

### Bước 1: Dừng Server Hiện Tại
Trong terminal đang chạy API server, nhấn:
```
Ctrl + C
```

### Bước 2: Khởi Động Lại Server
```bash
cd api
npm start
```

Hoặc nếu dùng nodemon:
```bash
cd api
npm run dev
```

### Bước 3: Kiểm Tra Server Đã Khởi Động
Bạn sẽ thấy log như:
```
🚀 Server is running on 0.0.0.0:3000
📍 Health check: http://localhost:3000/health
📍 API base URL: http://localhost:3000/api/v1
💬 Socket.IO server is ready
```

## ✅ Kiểm Tra Sau Khi Khởi Động Lại

### Test 1: Kiểm Tra API Trực Tiếp
```bash
curl http://localhost:3000/api/v1/contests/1/problems
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "contest_id": 1,
      "problem_id": 1,
      "score": 100,
      "Problem": {
        "id": 1,
        "title": "Two Sum",
        "difficulty": "Easy"
      }
    }
  ]
}
```

**KHÔNG còn lỗi 401!**

### Test 2: Chạy Script Test
```bash
node test-contest-problems.js
```

**Kết quả mong đợi:** Tất cả 4 test PASS

### Test 3: Kiểm Tra Trên Frontend
1. Reload trang: `http://localhost:4200/contests`
2. Click vào một cuộc thi
3. Kiểm tra danh sách bài tập có hiển thị

**Kết quả mong đợi:** Danh sách bài tập hiển thị đầy đủ

## 🔍 Nếu Vẫn Còn Lỗi

### Kiểm Tra 1: Server có đang chạy không?
```bash
curl http://localhost:3000/health
```

Nếu không có response, server chưa chạy.

### Kiểm Tra 2: Port có bị chiếm không?
```bash
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000
```

Nếu port bị chiếm, kill process hoặc đổi port.

### Kiểm Tra 3: Environment variables
Kiểm tra file `.env` trong thư mục `api`:
```
API_PREFIX=/api/v1
PORT=3000
```

### Kiểm Tra 4: Database connection
Xem log server khi khởi động, đảm bảo không có lỗi kết nối database.

## 📝 Lưu Ý

### Khi Nào Cần Khởi Động Lại Server?
- ✅ Khi thay đổi routes
- ✅ Khi thay đổi controllers
- ✅ Khi thay đổi middleware
- ✅ Khi thay đổi models
- ✅ Khi thay đổi environment variables
- ❌ KHÔNG cần khi thay đổi frontend code

### Nodemon Auto-Restart
Nếu dùng nodemon (`npm run dev`), server sẽ tự động restart khi có thay đổi file.

Nhưng đôi khi cần restart thủ công nếu:
- Thay đổi `.env` file
- Thay đổi `package.json`
- Có lỗi cache

## 🎯 Tóm Tắt
1. **Dừng server**: Ctrl+C
2. **Khởi động lại**: `cd api && npm start`
3. **Kiểm tra**: `curl http://localhost:3000/api/v1/contests/1/problems`
4. **Test frontend**: Reload trang và kiểm tra

Sau khi khởi động lại, lỗi 401 sẽ biến mất và danh sách bài tập sẽ hiển thị! 🎉
