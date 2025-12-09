# Test Flow - Tính năng Tài khoản Ngân hàng Creator

## ✅ Checklist Test

### 1. Backend Setup
- [x] Migration đã chạy thành công
- [x] Bảng `creator_bank_accounts` đã được tạo
- [x] Routes đã được thêm vào app.js
- [x] Model, Controller đã được tạo
- [x] Logic thanh toán đã được cập nhật

### 2. Frontend Setup
- [x] Service đã được tạo
- [x] Component đã được tạo
- [x] Route đã được thêm
- [x] Link đã được thêm vào profile

### 3. Test Cases

## 📝 Test Case 1: Truy cập trang Bank Account (Creator)

**Điều kiện:** Đăng nhập với tài khoản creator

**Các bước:**
1. Đăng nhập với tài khoản creator
2. Vào Profile
3. Click vào "Tài khoản ngân hàng"

**Kết quả mong đợi:**
- Trang `/profile/bank-account` được load
- Hiển thị form thêm tài khoản ngân hàng (nếu chưa có)
- Hiển thị thông tin tài khoản (nếu đã có)

**Status:** ⏳ Chưa test

---

## 📝 Test Case 2: Thêm tài khoản ngân hàng mới

**Điều kiện:** Creator chưa có tài khoản ngân hàng

**Các bước:**
1. Vào trang `/profile/bank-account`
2. Chọn ngân hàng: "Techcombank"
3. Nhập số tài khoản: "19036512345678"
4. Nhập tên chủ TK: "NGUYEN VAN A"
5. Nhập chi nhánh: "Chi nhánh Hà Nội"
6. Click "Lưu"

**Kết quả mong đợi:**
- Hiển thị thông báo "Thêm thông tin tài khoản ngân hàng thành công"
- Chuyển sang chế độ xem
- Trạng thái: "Chờ xác thực"
- Số tài khoản bị mask: "**********5678"

**API Call:**
```
POST /api/v1/creator-bank-accounts/my-bank-account
Body: {
  "bank_name": "Techcombank",
  "account_number": "19036512345678",
  "account_name": "NGUYEN VAN A",
  "branch": "Chi nhánh Hà Nội"
}
```

**Status:** ⏳ Chưa test

---

## 📝 Test Case 3: Xem thông tin tài khoản

**Điều kiện:** Creator đã có tài khoản ngân hàng

**Các bước:**
1. Vào trang `/profile/bank-account`

**Kết quả mong đợi:**
- Hiển thị thông tin tài khoản
- Số tài khoản bị mask
- Hiển thị trạng thái xác thực
- Có nút "Chỉnh sửa" và "Xóa"

**API Call:**
```
GET /api/v1/creator-bank-accounts/my-bank-account
```

**Status:** ⏳ Chưa test

---

## 📝 Test Case 4: Chỉnh sửa tài khoản

**Điều kiện:** Creator đã có tài khoản ngân hàng

**Các bước:**
1. Vào trang `/profile/bank-account`
2. Click "Chỉnh sửa"
3. Thay đổi chi nhánh: "Chi nhánh TP.HCM"
4. Click "Cập nhật"

**Kết quả mong đợi:**
- Hiển thị thông báo "Cập nhật thông tin tài khoản ngân hàng thành công"
- Thông tin được cập nhật
- Trạng thái reset về "Chờ xác thực"

**API Call:**
```
PUT /api/v1/creator-bank-accounts/my-bank-account
Body: {
  "bank_name": "Techcombank",
  "account_number": "19036512345678",
  "account_name": "NGUYEN VAN A",
  "branch": "Chi nhánh TP.HCM"
}
```

**Status:** ⏳ Chưa test

---

## 📝 Test Case 5: Xóa tài khoản

**Điều kiện:** Creator đã có tài khoản ngân hàng

**Các bước:**
1. Vào trang `/profile/bank-account`
2. Click "Xóa"
3. Xác nhận xóa

**Kết quả mong đợi:**
- Hiển thị thông báo "Xóa thông tin tài khoản ngân hàng thành công"
- Chuyển sang chế độ thêm mới
- Form trống

**API Call:**
```
DELETE /api/v1/creator-bank-accounts/my-bank-account
```

**Status:** ⏳ Chưa test

---

## 📝 Test Case 6: Admin xác thực tài khoản

**Điều kiện:** Admin đã đăng nhập

**Các bước:**
1. Gọi API lấy danh sách tài khoản chưa xác thực
2. Chọn tài khoản cần xác thực
3. Gọi API xác thực

**Kết quả mong đợi:**
- Trạng thái tài khoản chuyển thành "Đã xác thực"

**API Calls:**
```
GET /api/v1/creator-bank-accounts/admin/bank-accounts?is_verified=false

PATCH /api/v1/creator-bank-accounts/admin/bank-accounts/1/verify
Body: {
  "is_verified": true
}
```

**Status:** ⏳ Chưa test

---

## 📝 Test Case 7: Thanh toán với tài khoản creator (Chưa xác thực)

**Điều kiện:** 
- Creator đã có tài khoản ngân hàng nhưng chưa được xác thực
- User đã đăng nhập

**Các bước:**
1. Chọn khóa học của creator
2. Vào trang thanh toán
3. Chọn "Chuyển khoản ngân hàng"
4. Click "Thanh toán"

**Kết quả mong đợi:**
- Hiển thị thông tin tài khoản **mặc định** của hệ thống
- Có ghi chú: "Creator chưa cập nhật thông tin tài khoản ngân hàng"

**API Call:**
```
POST /api/v1/payments/courses/1/process-payment
Body: {
  "paymentMethod": "bank_transfer"
}
```

**Status:** ⏳ Chưa test

---

## 📝 Test Case 8: Thanh toán với tài khoản creator (Đã xác thực)

**Điều kiện:** 
- Creator đã có tài khoản ngân hàng và đã được xác thực
- User đã đăng nhập

**Các bước:**
1. Chọn khóa học của creator
2. Vào trang thanh toán
3. Chọn "Chuyển khoản ngân hàng"
4. Click "Thanh toán"

**Kết quả mong đợi:**
- Hiển thị thông tin tài khoản **của creator**
- Có đầy đủ: Tên ngân hàng, Số TK, Tên chủ TK, Chi nhánh
- Có QR code thanh toán

**API Call:**
```
POST /api/v1/payments/courses/1/process-payment
Body: {
  "paymentMethod": "bank_transfer"
}
```

**Status:** ⏳ Chưa test

---

## 📝 Test Case 9: Truy cập bị từ chối (User thường)

**Điều kiện:** Đăng nhập với tài khoản user (không phải creator)

**Các bước:**
1. Vào trang `/profile/bank-account`

**Kết quả mong đợi:**
- Hiển thị thông báo lỗi: "Chỉ creator mới có thể quản lý tài khoản ngân hàng"
- Redirect về trang chủ

**Status:** ⏳ Chưa test

---

## 📝 Test Case 10: Validation form

**Điều kiện:** Creator đang ở trang thêm/sửa tài khoản

**Các bước:**
1. Để trống các trường bắt buộc
2. Click "Lưu"

**Kết quả mong đợi:**
- Hiển thị lỗi: "Vui lòng điền đầy đủ thông tin bắt buộc"
- Form không được submit

**Status:** ⏳ Chưa test

---

## 🔧 Cách test thủ công

### Bước 1: Khởi động Backend
```bash
cd api
npm start
```

### Bước 2: Khởi động Frontend
```bash
cd cli
npm start
```

### Bước 3: Tạo tài khoản Creator (nếu chưa có)
```sql
-- Cập nhật role của user thành creator
UPDATE users SET role = 'creator' WHERE id = 1;
```

### Bước 4: Test từng case theo thứ tự
1. Test Case 1 → 2 → 3 → 4 → 5
2. Test Case 6 (Admin)
3. Test Case 7 → 8 (Payment flow)
4. Test Case 9 → 10 (Edge cases)

---

## 🧪 Test với Postman/HTTP Client

Sử dụng file `api/test-bank-account.http` để test API

### Test Creator APIs
```http
### 1. Lấy thông tin tài khoản
GET http://localhost:3000/api/v1/creator-bank-accounts/my-bank-account
Authorization: Bearer YOUR_TOKEN

### 2. Tạo tài khoản mới
POST http://localhost:3000/api/v1/creator-bank-accounts/my-bank-account
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "bank_name": "Techcombank",
  "account_number": "19036512345678",
  "account_name": "NGUYEN VAN A",
  "branch": "Chi nhánh Hà Nội"
}
```

---

## 📊 Kết quả Test

| Test Case | Status | Ghi chú |
|-----------|--------|---------|
| TC1: Truy cập trang | ⏳ | |
| TC2: Thêm tài khoản | ⏳ | |
| TC3: Xem thông tin | ⏳ | |
| TC4: Chỉnh sửa | ⏳ | |
| TC5: Xóa tài khoản | ⏳ | |
| TC6: Admin xác thực | ⏳ | |
| TC7: Thanh toán (chưa xác thực) | ⏳ | |
| TC8: Thanh toán (đã xác thực) | ⏳ | |
| TC9: Truy cập bị từ chối | ⏳ | |
| TC10: Validation | ⏳ | |

**Chú thích:**
- ⏳ Chưa test
- ✅ Pass
- ❌ Fail
- ⚠️ Có lỗi nhỏ

---

## 🐛 Bug Report Template

Nếu phát hiện lỗi, ghi lại theo format:

```
**Bug ID:** BUG-001
**Test Case:** TC2
**Mô tả:** Không thể lưu tài khoản ngân hàng
**Các bước tái hiện:**
1. Vào trang /profile/bank-account
2. Điền đầy đủ thông tin
3. Click "Lưu"

**Kết quả thực tế:** Hiển thị lỗi 500
**Kết quả mong đợi:** Lưu thành công
**Log/Screenshot:** [Đính kèm]
**Độ ưu tiên:** High/Medium/Low
```

---

## ✅ Checklist hoàn thành

- [ ] Tất cả test cases đã pass
- [ ] Không có bug critical
- [ ] UI/UX hoạt động mượt mà
- [ ] API response time < 1s
- [ ] Validation hoạt động đúng
- [ ] Security đã được kiểm tra
- [ ] Documentation đã đầy đủ

---

**Người test:** _________________
**Ngày test:** _________________
**Kết quả:** Pass / Fail / Pending
