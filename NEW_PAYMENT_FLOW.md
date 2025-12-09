# 🔄 Flow Thanh toán Mới - Xác nhận 2 bước

## Tổng quan

Flow thanh toán mới yêu cầu 2 bước xác nhận:
1. **Học viên xác nhận** đã chuyển khoản
2. **Creator xác nhận** đã nhận tiền

Chỉ sau khi cả 2 bên xác nhận, enrollment mới được tạo và học viên có thể truy cập khóa học.

## 🎯 Lý do thay đổi

### Vấn đề cũ:
- ❌ Payment được tạo ngay khi click "Thanh toán"
- ❌ Có thể bị spam payment records
- ❌ Khó quản lý thanh toán thật/giả
- ❌ Database bị rác

### Giải pháp mới:
- ✅ Payment chỉ được tạo khi học viên xác nhận đã chuyển khoản
- ✅ Creator kiểm tra và xác nhận đã nhận tiền
- ✅ Enrollment chỉ được tạo sau khi creator xác nhận
- ✅ Database sạch, chỉ có thanh toán thật

## 📊 Flow mới (Chi tiết)

### Bước 1: Học viên chọn thanh toán

```
1. Học viên vào trang khóa học
2. Click "Đăng ký" / "Mua khóa học"
3. Chọn phương thức "Chuyển khoản ngân hàng"
4. Click "Thanh toán"
```

**Backend:**
- ✅ Kiểm tra khóa học
- ✅ Tính toán giá (áp dụng coupon nếu có)
- ✅ Lấy thông tin tài khoản ngân hàng của creator
- ❌ KHÔNG tạo payment record
- ✅ Trả về thông tin chuyển khoản

**Response:**
```json
{
  "success": true,
  "data": {
    "courseId": 1,
    "userId": 5,
    "amount": 599000,
    "originalAmount": 699000,
    "discountAmount": 100000,
    "couponCode": "SALE100K",
    "bankInfo": {
      "bankName": "Techcombank",
      "accountNumber": "19036512345678",
      "accountName": "NGUYEN VAN A",
      "amount": 599000,
      "content": "KHOAHOC 1 USER 5",
      "qrCode": "https://..."
    },
    "note": "Sau khi chuyển khoản, click 'Đã chuyển khoản'"
  }
}
```

### Bước 2: Học viên xem thông tin và chuyển khoản

```
1. Trang hiển thị thông tin chuyển khoản
2. QR code bên trái, thông tin bên phải
3. Học viên quét QR hoặc chuyển khoản thủ công
4. Học viên click "Đã chuyển khoản"
```

**Backend:**
- ✅ Kiểm tra khóa học còn tồn tại
- ✅ Kiểm tra chưa có payment pending
- ✅ Kiểm tra chưa đăng ký khóa học
- ✅ TẠO payment record với status = 'pending'
- ✅ Lưu coupon usage (nếu có)
- ❌ KHÔNG tạo enrollment
- ✅ TODO: Gửi notification cho creator

**API:**
```http
POST /api/v1/payments/courses/:courseId/confirm-bank-transfer
Body: {
  "amount": 599000,
  "originalAmount": 699000,
  "discountAmount": 100000,
  "couponCode": "SALE100K"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã ghi nhận thanh toán của bạn. Vui lòng chờ giảng viên xác nhận.",
  "data": {
    "paymentId": 123,
    "status": "pending"
  }
}
```

### Bước 3: Creator nhận thông báo

```
1. Creator nhận notification (future)
2. Creator vào trang "Quản lý thanh toán"
3. Xem danh sách thanh toán chờ xác nhận
```

**Trang Creator Payments:**
- Hiển thị danh sách payments với status = 'pending'
- Thông tin: Học viên, Khóa học, Số tiền, Ngày tạo
- Nút "Xác nhận" cho mỗi payment

### Bước 4: Creator kiểm tra và xác nhận

```
1. Creator kiểm tra tài khoản ngân hàng
2. Xác nhận đã nhận được tiền
3. Click "Xác nhận" trên payment
4. Nhập mã giao dịch (optional)
5. Nhập ghi chú (optional)
6. Click "Xác nhận" trong modal
```

**Backend:**
- ✅ Kiểm tra creator có phải instructor không
- ✅ Kiểm tra payment status = 'pending'
- ✅ Cập nhật payment status = 'completed'
- ✅ TẠO enrollment
- ✅ Tăng số lượng students
- ✅ TODO: Gửi notification cho học viên

**API:**
```http
POST /api/v1/payments/creator/payments/:paymentId/confirm
Body: {
  "transactionId": "BANK_123456",
  "notes": "Đã nhận tiền"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Xác nhận thanh toán thành công",
  "data": {
    "payment": { ... },
    "enrollment": { ... }
  }
}
```

### Bước 5: Học viên có thể truy cập khóa học

```
1. Học viên nhận notification (future)
2. Học viên vào trang khóa học
3. Có thể bắt đầu học ngay
```

## 📊 So sánh Flow cũ vs mới

### Flow cũ (1 bước):
```
Click "Thanh toán" 
  → Tạo payment ngay 
  → Hiển thị thông tin CK
  → Admin/Creator xác nhận
  → Tạo enrollment
```

**Vấn đề:**
- Payment được tạo ngay cả khi chưa chuyển khoản
- Database có nhiều payment rác
- Khó phân biệt thanh toán thật/giả

### Flow mới (2 bước):
```
Click "Thanh toán" 
  → Hiển thị thông tin CK (chưa tạo payment)
  → Học viên chuyển khoản
  → Click "Đã chuyển khoản"
  → TẠO payment với status = 'pending'
  → Creator xác nhận
  → Payment status = 'completed'
  → TẠO enrollment
```

**Lợi ích:**
- ✅ Payment chỉ được tạo khi học viên xác nhận đã CK
- ✅ Database sạch hơn
- ✅ Dễ quản lý
- ✅ Tracking tốt hơn

## 🔧 Thay đổi Code

### 1. Backend - Payment Controller

**File:** `api/src/controllers/paymentController.js`

#### Method: processPayment (Updated)

**Trước:**
```javascript
// Tạo payment ngay
const payment = await CoursePayment.create({...});

// Trả về thông tin với paymentId
return res.json({
  data: {
    paymentId: payment.id,
    bankInfo: {...}
  }
});
```

**Sau:**
```javascript
// KHÔNG tạo payment cho bank_transfer
let payment = null;

if (paymentMethod !== 'bank_transfer') {
  payment = await CoursePayment.create({...});
}

// Trả về thông tin KHÔNG có paymentId
return res.json({
  data: {
    courseId,
    userId,
    amount,
    bankInfo: {...}
  }
});
```

#### Method: confirmBankTransferByUser (New)

```javascript
async confirmBankTransferByUser(req, res) {
  // Kiểm tra chưa có payment pending
  // Kiểm tra chưa đăng ký
  // TẠO payment với status = 'pending'
  // Lưu coupon usage
  // TODO: Gửi notification cho creator
}
```

### 2. Backend - Routes

**File:** `api/src/routes/paymentRoutes.js`

```javascript
// New route
router.post('/courses/:courseId/confirm-bank-transfer', 
  paymentController.confirmBankTransferByUser
);
```

### 3. Frontend - Bank Transfer Info Component

**File:** `bank-transfer-info.component.ts`

**Thêm:**
- Properties: courseId, userId, amount, etc.
- Method: `confirmBankTransfer()`
- Loading state: `isConfirming`

**Button:**
```html
<button (click)="confirmBankTransfer()" [disabled]="isConfirming">
  <span *ngIf="!isConfirming">Đã chuyển khoản</span>
  <span *ngIf="isConfirming">Đang xử lý...</span>
</button>
```

### 4. Frontend - Course Payment Component

**File:** `course-payment.component.ts`

**Updated:**
```typescript
showBankTransferInfo(data: any): void {
  this.router.navigate(['/payment/bank-transfer', this.courseId], {
    state: { 
      courseId: data.courseId,
      userId: data.userId,
      amount: data.amount,
      // ... all payment data
      bankInfo: data.bankInfo
    }
  });
}
```

### 5. Frontend - Courses Service

**File:** `courses.service.ts`

**New method:**
```typescript
confirmBankTransferByUser(courseId: number, data: any): Observable<any> {
  return this.http.post(
    `${this.apiUrl}/payments/courses/${courseId}/confirm-bank-transfer`,
    data,
    { withCredentials: true }
  );
}
```

## 🎯 User Experience

### Học viên:

**Bước 1:** Click "Thanh toán"
- Không có gì xảy ra trong database
- Chỉ hiển thị thông tin chuyển khoản

**Bước 2:** Chuyển khoản qua ngân hàng
- Quét QR code hoặc chuyển thủ công
- Đợi giao dịch thành công

**Bước 3:** Click "Đã chuyển khoản"
- Payment record được tạo
- Nhận thông báo "Đã ghi nhận thanh toán"
- Chờ creator xác nhận

**Bước 4:** Chờ creator xác nhận
- Nhận notification khi được xác nhận
- Có thể truy cập khóa học

### Creator:

**Bước 1:** Nhận notification
- "Có thanh toán mới cho khóa học X"

**Bước 2:** Vào trang quản lý thanh toán
- Xem danh sách thanh toán chờ xác nhận
- Lọc "Chờ xác nhận"

**Bước 3:** Kiểm tra tài khoản ngân hàng
- Xác nhận đã nhận được tiền
- Đối chiếu số tiền và nội dung

**Bước 4:** Xác nhận thanh toán
- Click "Xác nhận"
- Nhập mã giao dịch
- Click "Xác nhận" trong modal

**Bước 5:** Học viên có thể học
- Enrollment được tạo tự động
- Học viên nhận notification

## 🔐 Security & Validation

### Validation ở mỗi bước:

**Bước 1 (processPayment):**
- ✅ Khóa học tồn tại và published
- ✅ Khóa học không miễn phí
- ✅ Chưa đăng ký khóa học
- ✅ Coupon hợp lệ (nếu có)

**Bước 2 (confirmBankTransferByUser):**
- ✅ Khóa học tồn tại
- ✅ Chưa có payment pending
- ✅ Chưa đăng ký khóa học
- ✅ Amount hợp lệ

**Bước 3 (creatorConfirmPayment):**
- ✅ Payment tồn tại
- ✅ Creator là instructor của khóa học
- ✅ Payment status = 'pending'
- ✅ Payment method = 'bank_transfer'

## 📝 Database States

### State 1: Chưa có gì
```sql
-- Chưa có record nào
SELECT * FROM course_payments WHERE user_id = 5 AND course_id = 1;
-- Empty

SELECT * FROM course_enrollments WHERE user_id = 5 AND course_id = 1;
-- Empty
```

### State 2: Sau khi học viên xác nhận đã CK
```sql
-- Có payment với status = 'pending'
SELECT * FROM course_payments WHERE user_id = 5 AND course_id = 1;
-- id: 123, status: 'pending', payment_method: 'bank_transfer'

-- Chưa có enrollment
SELECT * FROM course_enrollments WHERE user_id = 5 AND course_id = 1;
-- Empty
```

### State 3: Sau khi creator xác nhận
```sql
-- Payment status = 'completed'
SELECT * FROM course_payments WHERE user_id = 5 AND course_id = 1;
-- id: 123, status: 'completed', transaction_id: 'BANK_123456'

-- Có enrollment
SELECT * FROM course_enrollments WHERE user_id = 5 AND course_id = 1;
-- id: 456, status: 'not-started', payment_id: 123
```

## 🎨 UI Changes

### 1. Bank Transfer Info Page

**Trước:**
```html
<button (click)="goBack()">Đã chuyển khoản</button>
```
- Click → Quay về trang khóa học
- Không làm gì cả

**Sau:**
```html
<button (click)="confirmBankTransfer()" [disabled]="isConfirming">
  <span *ngIf="!isConfirming">Đã chuyển khoản</span>
  <span *ngIf="isConfirming">Đang xử lý...</span>
</button>
```
- Click → Gọi API tạo payment
- Hiển thị loading state
- Hiển thị notification
- Redirect về trang khóa học

### 2. Creator Payments Page

**Features:**
- Danh sách payments với status = 'pending'
- Lọc theo trạng thái
- Tìm kiếm
- Nút "Xác nhận" cho mỗi payment
- Modal xác nhận với form

## 🔄 API Endpoints

### 1. Get Bank Transfer Info (No payment created)
```http
POST /api/v1/payments/courses/:courseId/process-payment
Body: { "paymentMethod": "bank_transfer" }

Response: {
  "data": {
    "courseId": 1,
    "userId": 5,
    "amount": 599000,
    "bankInfo": {...}
  }
}
```

### 2. User Confirms Bank Transfer (Create payment)
```http
POST /api/v1/payments/courses/:courseId/confirm-bank-transfer
Body: {
  "amount": 599000,
  "originalAmount": 699000,
  "discountAmount": 100000,
  "couponCode": "SALE100K"
}

Response: {
  "success": true,
  "message": "Đã ghi nhận thanh toán",
  "data": {
    "paymentId": 123,
    "status": "pending"
  }
}
```

### 3. Creator Gets Pending Payments
```http
GET /api/v1/payments/creator/payments?status=pending

Response: {
  "data": [
    {
      "id": 123,
      "user_id": 5,
      "course_id": 1,
      "amount": 599000,
      "payment_status": "pending",
      "User": {...},
      "Course": {...}
    }
  ]
}
```

### 4. Creator Confirms Payment (Create enrollment)
```http
POST /api/v1/payments/creator/payments/:paymentId/confirm
Body: {
  "transactionId": "BANK_123456",
  "notes": "Đã nhận tiền"
}

Response: {
  "success": true,
  "data": {
    "payment": { "status": "completed" },
    "enrollment": { "id": 456 }
  }
}
```

## ⚠️ Edge Cases

### Case 1: Học viên click "Đã CK" nhưng chưa chuyển
- Payment được tạo với status = 'pending'
- Creator kiểm tra không thấy tiền → Không xác nhận
- Payment vẫn ở trạng thái 'pending'
- Học viên không thể truy cập khóa học

### Case 2: Học viên click nhiều lần "Đã CK"
- Validation: Kiểm tra đã có payment pending chưa
- Nếu có → Trả về lỗi "Bạn đã có một thanh toán đang chờ xác nhận"
- Không tạo payment mới

### Case 3: Creator xác nhận nhầm
- Admin có thể hủy xác nhận (future)
- Hoặc refund (future)

### Case 4: Học viên chuyển sai số tiền
- Creator kiểm tra thấy sai → Liên hệ học viên
- Không xác nhận
- Học viên chuyển bù hoặc refund

## 📊 Benefits

### For System:
- ✅ Database sạch hơn
- ✅ Chỉ có thanh toán thật
- ✅ Dễ tracking và reporting
- ✅ Giảm spam

### For Creator:
- ✅ Kiểm soát thanh toán
- ✅ Xác nhận đã nhận tiền
- ✅ Tránh tranh chấp
- ✅ Quản lý dễ dàng

### For Student:
- ✅ Rõ ràng về quy trình
- ✅ Biết khi nào được truy cập
- ✅ Có notification
- ✅ Minh bạch

## 🧪 Testing

### Test Flow đầy đủ:

1. **Học viên chọn thanh toán**
   - Kiểm tra không tạo payment
   - Kiểm tra hiển thị thông tin CK

2. **Học viên click "Đã CK"**
   - Kiểm tra tạo payment với status = 'pending'
   - Kiểm tra không tạo enrollment
   - Kiểm tra notification

3. **Creator xem danh sách**
   - Kiểm tra hiển thị payment pending
   - Kiểm tra thông tin đầy đủ

4. **Creator xác nhận**
   - Kiểm tra payment status = 'completed'
   - Kiểm tra enrollment được tạo
   - Kiểm tra students tăng
   - Kiểm tra notification

5. **Học viên truy cập khóa học**
   - Kiểm tra có thể vào trang học
   - Kiểm tra có thể xem lessons

## 📞 Support Scenarios

### Học viên: "Tôi đã chuyển khoản nhưng chưa được học"
**Support:** Kiểm tra payment status
- Nếu 'pending' → Chờ creator xác nhận
- Nếu không có payment → Chưa click "Đã chuyển khoản"
- Liên hệ creator để xác nhận nhanh

### Creator: "Tôi đã nhận tiền nhưng không thấy trong danh sách"
**Support:** Kiểm tra
- Học viên đã click "Đã chuyển khoản" chưa?
- Nếu chưa → Yêu cầu học viên click
- Nếu rồi → Kiểm tra database

### Học viên: "Tôi click nhầm 'Đã CK' nhưng chưa chuyển"
**Support:** 
- Payment đã được tạo với status = 'pending'
- Creator sẽ không xác nhận nếu không thấy tiền
- Học viên cần chuyển khoản hoặc liên hệ hủy

## 🔮 Future Enhancements

- [ ] Auto-cancel payment sau 24h nếu không được xác nhận
- [ ] Reminder notification cho creator
- [ ] Reminder notification cho học viên
- [ ] Upload proof of payment (screenshot)
- [ ] Dispute resolution system
- [ ] Auto-verify với bank API

## ✅ Checklist

- [x] Backend: processPayment không tạo payment cho bank_transfer
- [x] Backend: confirmBankTransferByUser tạo payment
- [x] Backend: creatorConfirmPayment tạo enrollment
- [x] Frontend: Bank transfer info có button "Đã CK"
- [x] Frontend: Creator payments page
- [x] Routes: Đã thêm đầy đủ
- [ ] Notification system (future)
- [ ] Testing hoàn tất

---

**Date:** 09/12/2024
**Version:** 2.0.0
**Type:** Major Change
**Status:** ✅ **COMPLETED**
**Impact:** High - Better payment management
