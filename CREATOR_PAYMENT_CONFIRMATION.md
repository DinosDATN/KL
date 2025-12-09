# 💳 Tính năng Xác nhận Thanh toán cho Creator

## Tổng quan

Tính năng này cho phép creator xác nhận thanh toán từ học viên. Sau khi creator xác nhận, học viên mới có thể truy cập khóa học.

## 🎯 Mục đích

- Creator kiểm soát thanh toán của khóa học mình
- Xác nhận đã nhận được tiền từ học viên
- Tự động cấp quyền truy cập cho học viên
- Quản lý doanh thu hiệu quả

## 📋 Flow hoạt động

```
1. Học viên thanh toán khóa học (chuyển khoản)
   ↓
2. Payment được tạo với status = 'pending'
   ↓
3. Creator nhận thông báo (future)
   ↓
4. Creator vào trang quản lý thanh toán
   ↓
5. Creator kiểm tra thông tin thanh toán
   ↓
6. Creator xác nhận đã nhận tiền
   ↓
7. Payment status = 'completed'
   ↓
8. Enrollment được tạo tự động
   ↓
9. Học viên có thể truy cập khóa học
   ↓
10. Học viên nhận thông báo (future)
```

## 🔧 Backend Implementation

### 1. Controller Methods

**File:** `api/src/controllers/paymentController.js`

#### Method 1: Get Creator Payments
```javascript
async getCreatorPayments(req, res)
```
- Lấy danh sách thanh toán của các khóa học thuộc creator
- Filter theo status (pending/completed)
- Filter theo courseId (optional)
- Include thông tin User và Course

#### Method 2: Creator Confirm Payment
```javascript
async creatorConfirmPayment(req, res)
```
- Xác nhận thanh toán
- Kiểm tra creator có phải instructor không
- Cập nhật payment status = 'completed'
- Tạo enrollment tự động
- Tăng số lượng students của course

### 2. Routes

**File:** `api/src/routes/paymentRoutes.js`

```javascript
// Creator: Lấy danh sách thanh toán
GET /api/v1/payments/creator/payments?status=pending

// Creator: Xác nhận thanh toán
POST /api/v1/payments/creator/payments/:paymentId/confirm
Body: {
  transactionId: "optional",
  notes: "optional"
}
```

### 3. Authorization

- Yêu cầu authentication (JWT token)
- Kiểm tra creator có phải instructor của khóa học
- Chỉ creator mới xác nhận được thanh toán của khóa học mình

## 🎨 Frontend Implementation

### 1. Component

**File:** `cli/src/app/features/creator/payments/creator-payments.component.ts`

**Features:**
- Hiển thị danh sách thanh toán
- Lọc theo trạng thái (Tất cả/Chờ xác nhận/Đã xác nhận)
- Tìm kiếm theo tên, email, khóa học
- Pagination
- Modal xác nhận thanh toán
- Statistics cards

### 2. Service Methods

**File:** `cli/src/app/core/services/courses.service.ts`

```typescript
// Lấy danh sách thanh toán
getCreatorPayments(status?: string): Observable<any>

// Xác nhận thanh toán
creatorConfirmPayment(paymentId: number, data: any): Observable<any>
```

### 3. Routes

```typescript
{
  path: 'creator/payments',
  component: CreatorPaymentsComponent,
  canActivate: [AuthGuard]
}
```

### 4. Navigation

**Link trong Creator Profile:**
- Icon: 💳
- Label: "Quản lý thanh toán"
- Description: "Xác nhận thanh toán từ học viên"

## 🎯 UI Features

### 1. Statistics Dashboard

**4 Cards:**
- 📊 Tổng thanh toán
- ⏳ Chờ xác nhận (cần action)
- ✅ Đã xác nhận
- 💰 Tổng doanh thu

### 2. Filters & Search

**Filters:**
- Tất cả
- Chờ xác nhận
- Đã xác nhận

**Search:**
- Theo tên học viên
- Theo email
- Theo tên khóa học
- Theo mã giao dịch

### 3. Payments Table

**Columns:**
- Học viên (tên + email)
- Khóa học
- Số tiền
- Trạng thái
- Ngày tạo
- Thao tác

**Actions:**
- Nút "Xác nhận" cho payment pending
- Text "Đã xác nhận" cho payment completed

### 4. Confirm Modal

**Fields:**
- Thông tin thanh toán (readonly)
- Mã giao dịch (optional)
- Ghi chú (optional)
- Warning message

**Buttons:**
- Hủy
- Xác nhận

## 📱 Responsive Design

- **Desktop:** Full table view
- **Tablet:** Scrollable table
- **Mobile:** Stack layout

## 🔐 Security

### Authorization Checks:
1. User phải đăng nhập
2. User phải có role = 'creator'
3. Creator chỉ xem được thanh toán của khóa học mình
4. Creator chỉ xác nhận được thanh toán của khóa học mình

### Validation:
- Payment phải tồn tại
- Payment status phải là 'pending'
- Payment method phải là 'bank_transfer'
- Creator phải là instructor của course

## 🚀 Cách sử dụng

### Creator:

1. **Truy cập trang quản lý:**
   - Vào Creator Profile
   - Click "Quản lý thanh toán"
   - Hoặc: `/creator/payments`

2. **Xem danh sách thanh toán:**
   - Lọc "Chờ xác nhận" để xem thanh toán cần xử lý
   - Xem thông tin học viên và khóa học

3. **Xác nhận thanh toán:**
   - Click nút "Xác nhận"
   - Nhập mã giao dịch (nếu có)
   - Nhập ghi chú (nếu cần)
   - Click "Xác nhận"

4. **Kết quả:**
   - Thanh toán chuyển sang "Đã xác nhận"
   - Học viên có thể truy cập khóa học
   - Số lượng students tăng

### Học viên:

1. **Sau khi thanh toán:**
   - Chờ creator xác nhận
   - Nhận thông báo khi được xác nhận (future)

2. **Sau khi được xác nhận:**
   - Truy cập khóa học ngay lập tức
   - Bắt đầu học

## 📊 Database Changes

**Không có thay đổi schema**

Sử dụng các bảng hiện có:
- `course_payments` - Lưu thông tin thanh toán
- `course_enrollments` - Tạo sau khi xác nhận
- `courses` - Cập nhật số lượng students

## 🔮 Future Enhancements

### Phase 1 (Current):
- [x] Creator xem danh sách thanh toán
- [x] Creator xác nhận thanh toán
- [x] Tự động tạo enrollment
- [x] Statistics dashboard

### Phase 2:
- [ ] Real-time notifications
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Auto-confirm sau X giờ

### Phase 3:
- [ ] Bulk confirm
- [ ] Export to Excel
- [ ] Payment analytics
- [ ] Revenue reports

### Phase 4:
- [ ] Refund management
- [ ] Dispute resolution
- [ ] Payment history
- [ ] Transaction logs

## 🧪 Testing

### Test Cases:

**TC1: Creator xem danh sách thanh toán**
- Vào `/creator/payments`
- Kiểm tra hiển thị danh sách
- Kiểm tra statistics

**TC2: Lọc theo trạng thái**
- Chọn "Chờ xác nhận"
- Kiểm tra chỉ hiển thị pending
- Chọn "Đã xác nhận"
- Kiểm tra chỉ hiển thị completed

**TC3: Tìm kiếm**
- Nhập tên học viên
- Kiểm tra kết quả
- Nhập tên khóa học
- Kiểm tra kết quả

**TC4: Xác nhận thanh toán**
- Click "Xác nhận" trên payment pending
- Nhập thông tin
- Click "Xác nhận"
- Kiểm tra status chuyển sang completed
- Kiểm tra enrollment được tạo
- Kiểm tra học viên có thể truy cập khóa học

**TC5: Authorization**
- Creator A không thể xác nhận thanh toán của Creator B
- User thường không thể truy cập trang này

## 📝 API Examples

### Get Creator Payments

**Request:**
```http
GET /api/v1/payments/creator/payments?status=pending
Authorization: Bearer {creator_token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 5,
      "course_id": 10,
      "amount": 599000,
      "payment_method": "bank_transfer",
      "payment_status": "pending",
      "created_at": "2024-12-09T10:00:00.000Z",
      "User": {
        "id": 5,
        "name": "Nguyen Van A",
        "email": "student@example.com"
      },
      "Course": {
        "id": 10,
        "title": "Khóa học JavaScript",
        "price": 599000
      }
    }
  ]
}
```

### Confirm Payment

**Request:**
```http
POST /api/v1/payments/creator/payments/1/confirm
Authorization: Bearer {creator_token}
Content-Type: application/json

{
  "transactionId": "BANK_123456",
  "notes": "Đã nhận tiền qua Vietcombank"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Xác nhận thanh toán thành công",
  "data": {
    "payment": {
      "id": 1,
      "payment_status": "completed",
      "transaction_id": "BANK_123456",
      ...
    },
    "enrollment": {
      "id": 15,
      "user_id": 5,
      "course_id": 10,
      "status": "not-started",
      ...
    }
  }
}
```

## ⚠️ Important Notes

### For Creators:
1. Kiểm tra kỹ thông tin trước khi xác nhận
2. Đảm bảo đã nhận được tiền
3. Xác nhận càng sớm càng tốt
4. Liên hệ học viên nếu có vấn đề

### For Admins:
1. Monitor payment confirmations
2. Handle disputes
3. Support creators khi cần

### For Students:
1. Chuyển khoản đúng số tiền
2. Ghi đúng nội dung
3. Chờ creator xác nhận
4. Liên hệ support nếu quá lâu

## 📞 Support

**For Creators:**
- Email: creator-support@example.com
- Hotline: 1900-xxxx

**For Students:**
- Email: student-support@example.com
- Hotline: 1900-yyyy

---

**Date:** 09/12/2024
**Version:** 1.0.0
**Status:** ✅ **COMPLETED**
**Next:** Notification System
