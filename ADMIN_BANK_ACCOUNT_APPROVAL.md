# 🔐 Tính năng Admin Duyệt Tài khoản Ngân hàng

## Tổng quan

Tính năng này cho phép admin xem, quản lý và duyệt tài khoản ngân hàng của creator. Admin có thể:
- Xem danh sách tất cả tài khoản ngân hàng
- Lọc theo trạng thái (đã duyệt/chờ duyệt)
- Tìm kiếm theo tên, email, ngân hàng
- Duyệt/hủy duyệt tài khoản

## 🎯 Mục đích

- Đảm bảo thông tin tài khoản ngân hàng chính xác
- Ngăn chặn gian lận
- Kiểm soát chất lượng dữ liệu
- Bảo vệ cả creator và học viên

## 📋 Các thành phần đã tạo

### Frontend

1. **Component:** `cli/src/app/features/admin/bank-accounts/bank-accounts-admin.component.ts`
   - Logic quản lý danh sách tài khoản
   - Chức năng lọc và tìm kiếm
   - Pagination
   - Duyệt/hủy duyệt tài khoản

2. **Template:** `bank-accounts-admin.component.html`
   - Bảng hiển thị danh sách tài khoản
   - Thống kê tổng quan
   - Bộ lọc và tìm kiếm
   - Nút duyệt/hủy duyệt

3. **Styles:** `bank-accounts-admin.component.css`
   - Responsive design
   - Dark mode support
   - Professional UI

### Routes

- **Admin Route:** `/admin/bank-accounts`
- **Menu:** Payments & Transactions → Bank Accounts

## 🚀 Cách sử dụng

### Bước 1: Truy cập trang quản lý

1. Đăng nhập với tài khoản **admin**
2. Vào menu **Admin**
3. Chọn **Payments & Transactions**
4. Click **Bank Accounts**

Hoặc truy cập trực tiếp: `http://localhost:4200/admin/bank-accounts`

### Bước 2: Xem danh sách tài khoản

Trang sẽ hiển thị:
- **Thống kê tổng quan:**
  - Tổng số tài khoản
  - Số tài khoản đã xác thực
  - Số tài khoản chờ xác thực
  - Số tài khoản đang hoạt động

- **Bảng danh sách:**
  - Thông tin creator (tên, email)
  - Ngân hàng
  - Số tài khoản (đã mask)
  - Tên chủ tài khoản
  - Chi nhánh
  - Trạng thái
  - Ngày tạo
  - Thao tác

### Bước 3: Lọc và tìm kiếm

**Lọc theo trạng thái:**
- Tất cả
- Chờ xác thực
- Đã xác thực

**Tìm kiếm:**
- Theo tên creator
- Theo email
- Theo tên ngân hàng
- Theo tên chủ tài khoản

### Bước 4: Duyệt tài khoản

**Duyệt tài khoản mới:**
1. Tìm tài khoản có trạng thái "Chờ xác thực"
2. Kiểm tra thông tin:
   - Tên ngân hàng
   - Số tài khoản
   - Tên chủ tài khoản
   - Chi nhánh
3. Click nút **"✓ Duyệt"**
4. Xác nhận trong popup
5. Tài khoản sẽ chuyển sang trạng thái "Đã xác thực"

**Hủy duyệt tài khoản:**
1. Tìm tài khoản có trạng thái "Đã xác thực"
2. Click nút **"✗ Hủy"**
3. Xác nhận trong popup
4. Tài khoản sẽ chuyển về trạng thái "Chờ xác thực"

## 🔍 Quy trình kiểm tra

### Checklist khi duyệt tài khoản:

- [ ] Tên ngân hàng có chính xác không?
- [ ] Số tài khoản có đúng định dạng không?
- [ ] Tên chủ tài khoản có viết HOA, KHÔNG DẤU không?
- [ ] Tên chủ tài khoản có khớp với tên creator không?
- [ ] Chi nhánh có hợp lý không?
- [ ] Creator có uy tín không?

### Lý do từ chối:

- Thông tin không chính xác
- Tên chủ tài khoản không khớp
- Nghi ngờ gian lận
- Tài khoản không tồn tại
- Thông tin không đầy đủ

## 📊 Thống kê

### Metrics hiển thị:

1. **Tổng số tài khoản:** Tất cả tài khoản trong hệ thống
2. **Đã xác thực:** Số tài khoản đã được admin duyệt
3. **Chờ xác thực:** Số tài khoản đang chờ admin duyệt
4. **Đang hoạt động:** Số tài khoản active (is_active = true)

### Tỷ lệ duyệt:

```
Tỷ lệ duyệt = (Đã xác thực / Tổng số) × 100%
```

## 🎨 UI Features

### 1. Statistics Cards
- Hiển thị 4 thẻ thống kê với icon và màu sắc khác nhau
- Gradient background đẹp mắt
- Responsive trên mọi thiết bị

### 2. Filters & Search
- Dropdown lọc theo trạng thái
- Search box với icon
- Real-time filtering

### 3. Data Table
- Hiển thị đầy đủ thông tin
- Hover effect
- Status badges với màu sắc phù hợp
- Action buttons rõ ràng

### 4. Pagination
- Hiển thị 10 items/page (có thể tùy chỉnh)
- Previous/Next buttons
- Page numbers
- Info text hiển thị range

### 5. Empty State
- Hiển thị khi không có dữ liệu
- Icon và message thân thiện

## 🔐 Security

### Authorization:
- Chỉ admin mới có quyền truy cập
- Kiểm tra role trong component
- Route được bảo vệ bởi AdminGuard

### Data Protection:
- Số tài khoản được mask (chỉ hiện 4 số cuối)
- Không hiển thị thông tin nhạy cảm
- Audit log (có thể thêm sau)

## 📱 Responsive Design

- **Desktop:** Hiển thị đầy đủ bảng
- **Tablet:** Bảng có scroll ngang
- **Mobile:** 
  - Stats cards xếp dọc
  - Filters xếp dọc
  - Bảng có scroll ngang

## 🌙 Dark Mode

- Tự động theo system preference
- Màu sắc được tối ưu cho dark mode
- Contrast tốt, dễ đọc

## 🔄 Flow hoạt động

```
Creator tạo tài khoản ngân hàng
    ↓
Trạng thái: is_verified = false
    ↓
Admin vào /admin/bank-accounts
    ↓
Admin lọc "Chờ xác thực"
    ↓
Admin kiểm tra thông tin
    ↓
Admin click "Duyệt"
    ↓
API: PATCH /admin/bank-accounts/:id/verify
    ↓
Trạng thái: is_verified = true
    ↓
Creator nhận thông báo (future)
    ↓
Học viên thanh toán vào tài khoản creator
```

## 🧪 Testing

### Test Cases:

1. **TC1: Xem danh sách**
   - Vào `/admin/bank-accounts`
   - Kiểm tra hiển thị danh sách
   - Kiểm tra statistics

2. **TC2: Lọc theo trạng thái**
   - Chọn "Chờ xác thực"
   - Kiểm tra chỉ hiển thị tài khoản chưa duyệt
   - Chọn "Đã xác thực"
   - Kiểm tra chỉ hiển thị tài khoản đã duyệt

3. **TC3: Tìm kiếm**
   - Nhập tên creator
   - Kiểm tra kết quả lọc
   - Nhập email
   - Kiểm tra kết quả lọc

4. **TC4: Duyệt tài khoản**
   - Click "Duyệt" trên tài khoản chờ duyệt
   - Xác nhận popup
   - Kiểm tra trạng thái chuyển sang "Đã xác thực"

5. **TC5: Hủy duyệt**
   - Click "Hủy" trên tài khoản đã duyệt
   - Xác nhận popup
   - Kiểm tra trạng thái chuyển về "Chờ xác thực"

6. **TC6: Pagination**
   - Kiểm tra hiển thị 10 items/page
   - Click Next/Previous
   - Click số trang

## 📝 API Endpoints

### Lấy danh sách tài khoản
```http
GET /api/v1/creator-bank-accounts/admin/bank-accounts
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "bank_name": "Techcombank",
      "account_number": "19036512345678",
      "account_name": "NGUYEN VAN A",
      "branch": "Chi nhánh Hà Nội",
      "is_verified": false,
      "is_active": true,
      "created_at": "2024-12-09T10:00:00.000Z",
      "User": {
        "id": 2,
        "name": "Nguyen Van A",
        "email": "creator@example.com",
        "role": "creator"
      }
    }
  ]
}
```

### Duyệt tài khoản
```http
PATCH /api/v1/creator-bank-accounts/admin/bank-accounts/:accountId/verify
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "is_verified": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Xác thực tài khoản ngân hàng thành công",
  "data": {
    "id": 1,
    "is_verified": true,
    ...
  }
}
```

## 🎓 Best Practices

### Khi duyệt tài khoản:

1. **Kiểm tra kỹ thông tin**
   - Đối chiếu với giấy tờ (nếu có)
   - Xác minh tên chủ tài khoản
   - Kiểm tra định dạng số tài khoản

2. **Liên hệ creator nếu cần**
   - Yêu cầu bổ sung thông tin
   - Xác nhận thông tin không rõ ràng

3. **Ghi chú lý do từ chối**
   - Giúp creator biết cần sửa gì
   - Tạo transparency

4. **Theo dõi sau khi duyệt**
   - Kiểm tra giao dịch đầu tiên
   - Đảm bảo không có vấn đề

## 🔮 Tính năng mở rộng (Future)

- [ ] Thêm notes/comments cho mỗi tài khoản
- [ ] Lịch sử duyệt/hủy duyệt
- [ ] Thông báo cho creator khi được duyệt
- [ ] Export danh sách ra Excel/CSV
- [ ] Bulk approve/reject
- [ ] Advanced filters (theo ngân hàng, theo ngày tạo)
- [ ] Dashboard analytics
- [ ] Audit log chi tiết

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra role của user (phải là admin)
2. Kiểm tra API response trong Network tab
3. Xem console log
4. Liên hệ team dev

## ✅ Checklist triển khai

- [x] Component đã được tạo
- [x] Routes đã được thêm
- [x] Menu đã được cập nhật
- [x] API endpoints hoạt động
- [x] UI responsive
- [x] Dark mode support
- [ ] Testing hoàn tất
- [ ] Documentation đầy đủ

---

**Ngày tạo:** 09/12/2024
**Version:** 1.0.0
**Status:** ✅ Ready for Testing
