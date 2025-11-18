# ✅ Checklist Sửa Lỗi Contest - Không Hiển Thị Bài Tập

## Bước 1: Áp Dụng Fix (✅ ĐÃ HOÀN THÀNH)
- [x] Sửa file `api/src/routes/contestRoutes.js`
  - Thêm `optionalAuth` vào route `GET /:id/problems`
- [x] Sửa file `api/src/controllers/contestController.js`
  - Xóa kiểm tra registration trong method `getContestProblems`

## Bước 2: Khởi Động Lại Server
```bash
# Dừng server hiện tại (Ctrl+C)
# Khởi động lại
cd api
npm start
```

- [ ] Server đã khởi động lại
- [ ] Không có lỗi khi khởi động

## Bước 3: Kiểm Tra API
```bash
# Chạy script test
node test-contest-problems.js
```

- [ ] Test 1: Lấy danh sách cuộc thi - PASS
- [ ] Test 2: Lấy chi tiết cuộc thi - PASS
- [ ] Test 3: Lấy bài tập KHÔNG CẦN đăng nhập - PASS ⭐
- [ ] Test 4: Lấy bài tập VỚI đăng nhập - PASS

## Bước 4: Kiểm Tra Frontend
```bash
# Khởi động frontend (nếu chưa chạy)
cd cli
npm start
```

### Kiểm Tra Trên Trình Duyệt
1. Truy cập: `http://localhost:4200/contests`
   - [ ] Danh sách cuộc thi hiển thị

2. Click vào một cuộc thi bất kỳ
   - [ ] Trang chi tiết cuộc thi hiển thị
   - [ ] Thông tin cuộc thi hiển thị (title, description, stats)
   - [ ] **Danh sách bài tập hiển thị** ⭐
   - [ ] Mỗi bài tập hiển thị: số thứ tự, tên, độ khó, điểm số

3. Mở DevTools (F12)
   - [ ] Console không có lỗi màu đỏ
   - [ ] Network tab: Request `/api/contests/:id/problems` trả về 200

## Bước 5: Kiểm Tra Các Trường Hợp Khác

### Trường Hợp 1: Người Dùng Chưa Đăng Nhập
- [ ] Có thể xem danh sách cuộc thi
- [ ] Có thể xem chi tiết cuộc thi
- [ ] Có thể xem danh sách bài tập ⭐
- [ ] Nút "Tham gia" hiển thị (nếu cuộc thi upcoming/active)

### Trường Hợp 2: Người Dùng Đã Đăng Nhập (Chưa Đăng Ký)
- [ ] Có thể xem danh sách bài tập ⭐
- [ ] Có thể đăng ký cuộc thi
- [ ] Sau khi đăng ký, nút chuyển thành "Hủy tham gia"

### Trường Hợp 3: Người Dùng Đã Đăng Ký
- [ ] Có thể xem danh sách bài tập
- [ ] Có thể nộp bài (nếu cuộc thi active)

## Bước 6: Kiểm Tra Database (Nếu Cần)
```sql
-- Kiểm tra có dữ liệu không
SELECT COUNT(*) FROM contests;
SELECT COUNT(*) FROM contest_problems;

-- Kiểm tra bài tập của contest ID 1
SELECT cp.*, p.title 
FROM contest_problems cp
LEFT JOIN problems p ON cp.problem_id = p.id
WHERE cp.contest_id = 1;
```

- [ ] Có dữ liệu trong bảng `contests`
- [ ] Có dữ liệu trong bảng `contest_problems`
- [ ] Các bài tập có liên kết đúng với problems

## Kết Quả Mong Đợi

### ✅ Thành Công
- Tất cả các test PASS
- Danh sách bài tập hiển thị trên frontend
- Không có lỗi trong console
- Người dùng có thể xem bài tập mà không cần đăng ký

### ❌ Vẫn Còn Lỗi
Nếu vẫn còn vấn đề, xem file `CONTEST_DEBUG_GUIDE.md` để debug chi tiết.

## Ghi Chú
- ⭐ = Điểm quan trọng cần kiểm tra
- Nếu test API PASS nhưng frontend vẫn lỗi, vấn đề có thể ở:
  - CORS configuration
  - Environment configuration
  - Component logic
  - Network issues

## Liên Hệ
Nếu cần hỗ trợ thêm, cung cấp:
1. Kết quả chạy `test-contest-problems.js`
2. Screenshot console errors
3. Screenshot network tab
4. Log từ server
