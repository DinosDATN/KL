# Hướng Dẫn Sử Dụng Bảng Chấm Bài

## Tổng Quan

Bảng chấm bài (Grading Board) là tính năng dành cho admin để xem và quản lý tất cả các bài nộp của học viên trong hệ thống.

## Tính Năng

### 1. Xem Danh Sách Bài Nộp

- **Đường dẫn**: `/admin/grading-board`
- **Quyền truy cập**: Chỉ dành cho Admin

#### Thông tin hiển thị trong bảng:

- **ID**: Mã định danh của bài nộp
- **Bài tập**: Tên bài tập và độ khó (Dễ/Trung bình/Khó)
- **Người nộp**: Thông tin người dùng (avatar, tên, email)
- **Thời gian nộp**: Ngày giờ nộp bài
- **Ngôn ngữ**: Ngôn ngữ lập trình sử dụng (Python, JavaScript, Java, C++, C)
- **Trạng thái**: 
  - ✅ Đúng (Accepted)
  - ❌ Sai (Wrong Answer)
  - ⏱️ Quá thời gian (Time Limit Exceeded)
  - 💾 Quá bộ nhớ (Memory Limit Exceeded)
  - ⚠️ Lỗi runtime (Runtime Error)
  - 🔧 Lỗi biên dịch (Compilation Error)
- **Test Cases**: Số test case đạt / tổng số test case
- **Thời gian thực thi**: Thời gian chạy code (ms)
- **Bộ nhớ sử dụng**: Dung lượng bộ nhớ sử dụng (MB)

### 2. Bộ Lọc (Filters)

Bạn có thể lọc danh sách bài nộp theo:

- **Trạng thái**: Lọc theo kết quả chấm bài
- **Ngôn ngữ**: Lọc theo ngôn ngữ lập trình
- **ID Bài tập**: Xem tất cả bài nộp của một bài tập cụ thể
- **ID Người dùng**: Xem tất cả bài nộp của một người dùng cụ thể

#### Cách sử dụng bộ lọc:

1. Chọn các tiêu chí lọc từ dropdown hoặc nhập ID
2. Nhấn nút **"Lọc"** để áp dụng
3. Nhấn nút **"Đặt lại"** để xóa tất cả bộ lọc

### 3. Sắp Xếp (Sorting)

Bạn có thể sắp xếp danh sách theo:

- **ID**: Mã bài nộp
- **Bài tập**: ID bài tập
- **Thời gian nộp**: Ngày giờ nộp bài
- **Trạng thái**: Kết quả chấm bài

#### Cách sử dụng:

- Click vào tiêu đề cột để sắp xếp
- Click lần nữa để đảo ngược thứ tự (tăng dần ↑ / giảm dần ↓)

### 4. Phân Trang (Pagination)

- Mỗi trang hiển thị 20 bài nộp
- Sử dụng các nút **"Trước"** và **"Sau"** để chuyển trang
- Click vào số trang để nhảy trực tiếp đến trang đó

### 5. Xem Chi Tiết Bài Nộp

#### Cách xem:

1. Click vào nút 👁️ (icon mắt) ở cột "Hành động"
2. Hoặc truy cập: `/admin/grading-board/{id}`

#### Thông tin chi tiết bao gồm:

**Tổng quan:**
- Trạng thái chấm bài
- Ngôn ngữ lập trình
- Thời gian thực thi
- Bộ nhớ sử dụng
- Số test case đạt/tổng số
- Thời gian nộp bài

**Thông tin bài tập:**
- Tên bài tập
- Độ khó
- ID bài tập
- Danh mục

**Thông tin người nộp:**
- Avatar
- Tên đầy đủ
- Email
- ID người dùng

**Thông báo lỗi** (nếu có):
- Hiển thị chi tiết lỗi khi bài nộp không thành công

**Mã nguồn:**
- Xem toàn bộ code mà học viên đã nộp
- Hiển thị với syntax highlighting

## API Endpoints

### 1. Lấy danh sách bài nộp

```
GET /api/submissions
```

**Query Parameters:**
- `page`: Số trang (mặc định: 1)
- `limit`: Số bài nộp mỗi trang (mặc định: 20)
- `status`: Lọc theo trạng thái
- `language`: Lọc theo ngôn ngữ
- `problem_id`: Lọc theo ID bài tập
- `user_id`: Lọc theo ID người dùng
- `sort_by`: Sắp xếp theo trường (mặc định: submitted_at)
- `sort_order`: Thứ tự sắp xếp (ASC/DESC, mặc định: DESC)

**Response:**
```json
{
  "success": true,
  "data": {
    "submissions": [...],
    "pagination": {
      "current_page": 1,
      "total_pages": 10,
      "total_items": 200,
      "per_page": 20
    }
  }
}
```

### 2. Lấy chi tiết bài nộp

```
GET /api/submissions/:id?include_code=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "problem_id": 45,
    "user_id": 67,
    "language": "python",
    "status": "accepted",
    "execution_time": 150,
    "memory_used": 2048,
    "test_cases_passed": 10,
    "total_test_cases": 10,
    "submitted_at": "2024-12-10T10:30:00Z",
    "User": {...},
    "Problem": {...},
    "Code": {
      "source_code": "..."
    }
  }
}
```

## Quyền Truy Cập

- **Admin**: Có thể xem tất cả bài nộp và mã nguồn của tất cả người dùng
- **User thường**: Chỉ có thể xem bài nộp và mã nguồn của chính mình

## Giao Diện

### Màu sắc trạng thái:

- 🟢 **Xanh lá**: Accepted (Đúng)
- 🔴 **Đỏ**: Wrong Answer, Runtime Error, Compilation Error
- 🟠 **Cam**: Time Limit Exceeded, Memory Limit Exceeded

### Màu sắc độ khó:

- 🟢 **Xanh lá**: Easy (Dễ)
- 🟠 **Cam**: Medium (Trung bình)
- 🔴 **Đỏ**: Hard (Khó)

## Responsive Design

- Giao diện tự động điều chỉnh cho các thiết bị:
  - Desktop: Hiển thị đầy đủ bảng
  - Tablet: Bảng có thể cuộn ngang
  - Mobile: Bảng có thể cuộn ngang với kích thước tối ưu

## Lưu Ý

1. **Hiệu suất**: Với số lượng bài nộp lớn, nên sử dụng bộ lọc để giảm tải
2. **Mã nguồn**: Chỉ admin mới có thể xem mã nguồn của người khác
3. **Thời gian**: Tất cả thời gian hiển thị theo múi giờ Việt Nam (vi-VN)
4. **Cập nhật**: Dữ liệu được tải lại mỗi khi thay đổi bộ lọc hoặc chuyển trang

## Troubleshooting

### Không thể tải dữ liệu

1. Kiểm tra kết nối mạng
2. Đảm bảo đã đăng nhập với tài khoản admin
3. Kiểm tra console để xem lỗi chi tiết
4. Thử nhấn nút "Thử lại"

### Không thấy mã nguồn

1. Đảm bảo bạn có quyền admin
2. Kiểm tra xem bài nộp có chứa mã nguồn không
3. Một số bài nộp cũ có thể không có mã nguồn được lưu

## Cải Tiến Tương Lai

- [ ] Export danh sách bài nộp ra Excel/CSV
- [ ] Thống kê chi tiết theo bài tập
- [ ] Biểu đồ phân tích xu hướng nộp bài
- [ ] Tính năng so sánh mã nguồn
- [ ] Tự động phát hiện đạo văn
- [ ] Gửi feedback trực tiếp cho học viên
