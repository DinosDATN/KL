# Tóm Tắt Sửa Lỗi Contest - Không Hiển Thị Bài Tập

## Vấn Đề
Khi nhấn vào chi tiết cuộc thi, danh sách bài tập của cuộc thi không hiển thị.

## Nguyên Nhân
1. **Route yêu cầu authentication**: Route `/contests/:id/problems` yêu cầu `authenticateToken`, nghĩa là người dùng phải đăng nhập mới có thể gọi API này.

2. **Logic kiểm tra registration quá strict**: Trong controller `getContestProblems`, có kiểm tra yêu cầu người dùng phải đăng ký cuộc thi trước khi xem danh sách bài tập. Điều này không hợp lý vì:
   - Người dùng cần xem danh sách bài tập để quyết định có tham gia hay không
   - Chỉ khi submit bài mới cần kiểm tra đã đăng ký

## Giải Pháp Đã Áp Dụng

### 1. Sửa Route (api/src/routes/contestRoutes.js)
**Vấn đề:** Route `/:id/problems` nằm SAU dòng `router.use(authenticateToken)`, nên nó vẫn yêu cầu authentication.

**Trước:**
```javascript
// Routes requiring authentication
router.use(authenticateToken); // All routes below require authentication

// Contest problems - Registered users can view and submit
router.get('/:id/problems', validateContestId, contestController.getContestProblems);
```

**Sau:**
```javascript
// Contest problems - Anyone can view (no authentication required)
router.get('/:id/problems', validateContestId, optionalAuth, contestController.getContestProblems);

// Routes requiring authentication
router.use(authenticateToken); // All routes below require authentication
```

**Thay đổi:**
- **Di chuyển route lên TRƯỚC** dòng `router.use(authenticateToken)` - Đây là thay đổi quan trọng nhất!
- Thêm `optionalAuth` middleware để cho phép cả người dùng đã đăng nhập và chưa đăng nhập đều có thể xem danh sách bài tập
- Route submit vẫn nằm sau `authenticateToken`, yêu cầu authentication (đúng như mong muốn)

### 2. Sửa Controller Logic (api/src/controllers/contestController.js)
**Trước:**
```javascript
// Check if user is registered (for non-admin users)
if (userId && req.user.role !== 'admin') {
  const registration = await UserContest.findOne({
    where: { contest_id: id, user_id: userId }
  });

  if (!registration) {
    return res.status(403).json({
      success: false,
      message: 'You must register for the contest to view problems'
    });
  }
}
```

**Sau:**
```javascript
// Anyone can view contest problems (no registration check needed)
// This allows users to see what problems are in the contest before registering
```

**Thay đổi:**
- Xóa bỏ kiểm tra registration khi xem danh sách bài tập
- Cho phép mọi người (kể cả chưa đăng nhập) xem danh sách bài tập của cuộc thi
- Kiểm tra registration vẫn được giữ ở method `submitToContest` (đúng như mong muốn)

## Luồng Hoạt Động Mới

### Xem Danh Sách Bài Tập
1. Người dùng truy cập trang chi tiết cuộc thi
2. Frontend gọi API `GET /contests/:id/problems`
3. API trả về danh sách bài tập **không cần** kiểm tra:
   - Người dùng có đăng nhập hay không
   - Người dùng có đăng ký cuộc thi hay không
4. Danh sách bài tập hiển thị cho tất cả mọi người

### Submit Bài Tập
1. Người dùng nhấn submit bài tập
2. Frontend gọi API `POST /contests/:id/problems/:problem_id/submit`
3. API kiểm tra:
   - ✅ Người dùng đã đăng nhập (authenticateToken middleware)
   - ✅ Người dùng đã đăng ký cuộc thi
   - ✅ Cuộc thi đang active
4. Nếu tất cả điều kiện thỏa mãn, cho phép submit

## Kiểm Tra

### 1. Kiểm Tra Không Cần Đăng Nhập
```bash
# Test xem danh sách bài tập của contest ID 1
curl http://localhost:3000/api/contests/1/problems
```

**Kết quả mong đợi:**
- Trả về danh sách bài tập thành công
- Không yêu cầu token

### 2. Kiểm Tra Với Đăng Nhập
```bash
# Test với token
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/contests/1/problems
```

**Kết quả mong đợi:**
- Trả về danh sách bài tập thành công
- Có thể có thêm thông tin về trạng thái đăng ký của user

### 3. Kiểm Tra Trên Frontend
1. Mở trình duyệt và truy cập `/contests`
2. Nhấn vào một cuộc thi bất kỳ
3. Kiểm tra xem danh sách bài tập có hiển thị không

**Kết quả mong đợi:**
- Danh sách bài tập hiển thị đầy đủ
- Hiển thị số lượng bài tập, điểm số, độ khó
- Không có lỗi trong console

### 4. Kiểm Tra Submit (Cần Đăng Ký)
1. Đăng nhập vào hệ thống
2. Truy cập một cuộc thi chưa đăng ký
3. Thử submit bài tập

**Kết quả mong đợi:**
- Hiển thị thông báo yêu cầu đăng ký cuộc thi trước khi submit
- Sau khi đăng ký, có thể submit bài tập

## Files Đã Thay Đổi
1. `api/src/routes/contestRoutes.js` - Thêm optionalAuth middleware
2. `api/src/controllers/contestController.js` - Xóa kiểm tra registration khi xem bài tập

## Lưu Ý
- Kiểm tra registration vẫn được giữ ở method `submitToContest` để đảm bảo chỉ người đã đăng ký mới có thể nộp bài
- Người dùng vẫn cần đăng nhập để đăng ký cuộc thi và submit bài
- Thay đổi này giúp cải thiện UX vì người dùng có thể xem nội dung cuộc thi trước khi quyết định tham gia

## Khởi Động Lại Server
Sau khi thay đổi, cần khởi động lại API server:
```bash
cd api
npm start
```

Hoặc nếu đang dùng nodemon:
```bash
# Server sẽ tự động restart
```

## Chạy Test Tự Động
Đã tạo script test để kiểm tra API:
```bash
node test-contest-problems.js
```

Script này sẽ kiểm tra:
1. ✓ Lấy danh sách tất cả cuộc thi
2. ✓ Lấy chi tiết cuộc thi
3. ✓ Lấy danh sách bài tập KHÔNG CẦN đăng nhập (test chính)
4. ✓ Lấy danh sách bài tập VỚI đăng nhập

**Kết quả mong đợi:** Tất cả 4 test đều PASS
