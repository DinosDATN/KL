# ✨ Tính Năng Mới: Làm Bài Tập Trong Cuộc Thi

## 🎯 Tóm Tắt
Người dùng đã đăng ký cuộc thi có thể làm bài tập trực tiếp khi cuộc thi đang diễn ra.

## ✅ Đã Thêm

### 1. Nút "Làm Bài Tập" 
- Hiển thị khi: User đã đăng ký + Contest đang active
- Màu xanh lá với icon play
- Click để bắt đầu làm bài

### 2. Banner "Chế Độ Thi Đấu"
- Hiển thị ở đầu trang problem detail
- Màu tím-xanh gradient
- Có nút "Quay lại cuộc thi"

### 3. Contest Submission
- Submit code vào contest (không phải problem thường)
- Tính điểm theo contest scoring
- Lưu vào bảng `contest_submissions`

## 🚀 Cách Sử Dụng

### Bước 1: Đăng Ký Cuộc Thi
```
/contests → Click cuộc thi → Click "Tham gia cuộc thi"
```

### Bước 2: Làm Bài Tập
```
Xem danh sách bài tập → Click "Làm bài tập" → Viết code → Submit
```

### Bước 3: Xem Kết Quả
```
Nhận điểm số → Xem test cases → Quay lại cuộc thi
```

## 📋 Điều Kiện

### Để Thấy Nút "Làm Bài Tập"
- ✅ Đã đăng nhập
- ✅ Đã đăng ký cuộc thi
- ✅ Cuộc thi đang active

### Để Submit Code
- ✅ Đã đăng nhập
- ✅ Đã đăng ký cuộc thi
- ✅ Cuộc thi đang active

## 📁 Files Đã Thay Đổi

### Frontend
1. `cli/src/app/features/contests/contest-detail/`
   - Thêm nút "Làm bài tập"
   - Logic `canStartProblem()`

2. `cli/src/app/features/problems/problem-detail/`
   - Thêm contest mode banner
   - Detect contest context từ query params

3. `cli/src/app/features/problems/.../code-editor/`
   - Hỗ trợ contest submission
   - Gọi `contestService.submitToContest()`

## 🧪 Test Nhanh

```bash
# 1. Khởi động servers
cd api && npm start
cd cli && npm start

# 2. Test flow
1. Đăng nhập
2. Truy cập /contests
3. Đăng ký cuộc thi active
4. Click "Làm bài tập"
5. Viết code và submit
6. Kiểm tra kết quả
```

## 📚 Tài Liệu Chi Tiết

- `CONTEST_PROBLEM_SOLVING_FEATURE.md` - Tài liệu đầy đủ
- `TEST_CONTEST_PROBLEM_SOLVING.md` - Hướng dẫn test chi tiết

## 🎉 Kết Quả

Người dùng giờ có thể:
- ✅ Xem danh sách bài tập mà không cần đăng ký
- ✅ Đăng ký cuộc thi để làm bài
- ✅ Làm bài tập trực tiếp trong contest mode
- ✅ Submit code và nhận điểm số
- ✅ Xem kết quả và test cases

Trải nghiệm làm bài tập trong cuộc thi giờ đã hoàn chỉnh! 🚀
