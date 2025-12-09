# 🚀 Quick Start - Tính năng Tài khoản Ngân hàng Creator

## ⚡ Bắt đầu nhanh trong 5 phút

### Bước 1: Khởi động hệ thống (1 phút)

```bash
# Terminal 1: Backend
cd api
npm start

# Terminal 2: Frontend
cd cli
npm start
```

### Bước 2: Tạo tài khoản Creator (30 giây)

**Option A: Sử dụng SQL**
```sql
-- Cập nhật user hiện tại thành creator
UPDATE users SET role = 'creator' WHERE id = 1;
```

**Option B: Đăng ký mới và apply creator**
1. Đăng ký tài khoản mới
2. Vào `/profile/creator-application`
3. Điền form và submit

### Bước 3: Thêm tài khoản ngân hàng (2 phút)

1. **Đăng nhập** với tài khoản creator
2. **Vào Profile** (click avatar góc trên phải)
3. **Click "Tài khoản ngân hàng"** trong phần "Quản lý nội dung"
4. **Điền thông tin:**
   ```
   Ngân hàng: Techcombank
   Số tài khoản: 19036512345678
   Tên chủ TK: NGUYEN VAN A
   Chi nhánh: Chi nhánh Hà Nội
   ```
5. **Click "Lưu"**

### Bước 4: Admin xác thực (1 phút)

**Sử dụng Postman hoặc HTTP Client:**

```http
### 1. Lấy danh sách tài khoản chưa xác thực
GET http://localhost:3000/api/v1/creator-bank-accounts/admin/bank-accounts?is_verified=false
Authorization: Bearer YOUR_ADMIN_TOKEN

### 2. Xác thực tài khoản (thay accountId bằng id thực tế)
PATCH http://localhost:3000/api/v1/creator-bank-accounts/admin/bank-accounts/1/verify
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "is_verified": true
}
```

### Bước 5: Test thanh toán (30 giây)

1. **Đăng nhập** với tài khoản user khác
2. **Chọn khóa học** của creator vừa tạo
3. **Click "Đăng ký"** hoặc "Mua khóa học"
4. **Chọn "Chuyển khoản ngân hàng"**
5. **Kiểm tra** thông tin tài khoản hiển thị

✅ **Xong!** Bạn đã tích hợp thành công tính năng!

---

## 🎯 URLs quan trọng

| Trang | URL | Yêu cầu |
|-------|-----|---------|
| Quản lý TK ngân hàng | `/profile/bank-account` | Creator |
| Creator Profile | `/creator/profile` | Creator |
| User Profile | `/profile` | Any user |
| Thanh toán khóa học | `/courses/:id/payment` | User |

---

## 🔑 API Endpoints chính

### Creator
```
GET    /api/v1/creator-bank-accounts/my-bank-account
POST   /api/v1/creator-bank-accounts/my-bank-account
DELETE /api/v1/creator-bank-accounts/my-bank-account
```

### Admin
```
GET    /api/v1/creator-bank-accounts/admin/bank-accounts
PATCH  /api/v1/creator-bank-accounts/admin/bank-accounts/:id/verify
```

---

## 📝 Ví dụ Request/Response

### Thêm tài khoản ngân hàng

**Request:**
```http
POST /api/v1/creator-bank-accounts/my-bank-account
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "bank_name": "Techcombank",
  "account_number": "19036512345678",
  "account_name": "NGUYEN VAN A",
  "branch": "Chi nhánh Hà Nội",
  "notes": "Tài khoản chính"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thêm thông tin tài khoản ngân hàng thành công",
  "data": {
    "id": 1,
    "user_id": 1,
    "bank_name": "Techcombank",
    "account_number": "19036512345678",
    "account_name": "NGUYEN VAN A",
    "branch": "Chi nhánh Hà Nội",
    "is_verified": false,
    "is_active": true,
    "created_at": "2024-12-09T10:00:00.000Z",
    "updated_at": "2024-12-09T10:00:00.000Z"
  }
}
```

---

## 🐛 Troubleshooting

### Lỗi: "Chỉ creator mới có thể quản lý tài khoản ngân hàng"
**Giải pháp:** Kiểm tra role của user
```sql
SELECT id, name, email, role FROM users WHERE id = 1;
-- Nếu role != 'creator', update:
UPDATE users SET role = 'creator' WHERE id = 1;
```

### Lỗi: "Không tìm thấy thông tin tài khoản ngân hàng"
**Giải pháp:** Tài khoản chưa được tạo, thêm mới qua UI hoặc API

### Lỗi: Migration failed
**Giải pháp:** 
```bash
cd api
node run-migration.js
```

### Lỗi: Cannot find module 'creator-bank-account.service'
**Giải pháp:** Restart Angular dev server
```bash
# Ctrl+C để stop
npm start
```

---

## ✅ Checklist hoàn thành

- [ ] Backend đang chạy (port 3000)
- [ ] Frontend đang chạy (port 4200)
- [ ] Migration đã chạy thành công
- [ ] Có tài khoản creator
- [ ] Đã thêm tài khoản ngân hàng
- [ ] Admin đã xác thực
- [ ] Test thanh toán thành công

---

## 📚 Tài liệu chi tiết

- **Kỹ thuật:** `CREATOR_BANK_ACCOUNT_FEATURE.md`
- **Người dùng:** `HUONG_DAN_SU_DUNG_TAI_KHOAN_NGAN_HANG.md`
- **Testing:** `TEST_BANK_ACCOUNT_FLOW.md`
- **Tổng kết:** `BANK_ACCOUNT_INTEGRATION_SUMMARY.md`

---

## 🎉 Chúc mừng!

Bạn đã tích hợp thành công tính năng **Tài khoản Ngân hàng Creator**!

Giờ creator có thể:
- ✅ Quản lý thông tin tài khoản ngân hàng
- ✅ Nhận thanh toán trực tiếp từ học viên
- ✅ Theo dõi trạng thái xác thực

**Happy coding! 🚀**
