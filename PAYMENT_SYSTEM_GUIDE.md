# Hướng dẫn Hệ thống Thanh toán Khóa học

## Tổng quan

Hệ thống thanh toán đã được cải thiện với các tính năng sau:
- ✅ Thông báo rõ ràng khi khóa học có phí
- ✅ Tích hợp VNPay (cổng thanh toán trực tuyến)
- ✅ Chuyển khoản ngân hàng với QR Code
- ✅ Hỗ trợ mã giảm giá
- ✅ Xác nhận thanh toán tự động

## Cấu hình

### 1. Backend Configuration

Cập nhật file `.env` trong thư mục `api/`:

```env
# VNPay Configuration
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_TMN_CODE=YOUR_TMN_CODE
VNPAY_HASH_SECRET=YOUR_HASH_SECRET
VNPAY_RETURN_URL=http://localhost:4200/payment/vnpay-return
```

**Lưu ý**: 
- Để test VNPay, đăng ký tài khoản sandbox tại: https://sandbox.vnpayment.vn/
- Lấy `TMN_CODE` và `HASH_SECRET` từ tài khoản sandbox
- Trong production, thay `sandbox.vnpayment.vn` bằng `vnpayment.vn`

### 2. Cài đặt Dependencies

Backend cần thêm các package:

```bash
cd api
npm install moment
```

### 3. Cấu hình Ngân hàng

Cập nhật thông tin ngân hàng trong file `api/src/controllers/paymentController.js`:

```javascript
bankInfo: {
  bankName: 'Ngân hàng TMCP Á Châu (ACB)',
  accountNumber: '123456789',
  accountName: 'CONG TY TNHH GIAO DUC TRUC TUYEN',
  amount: finalAmount,
  content: `THANHTOAN ${payment.id} ${userId}`,
  qrCode: `https://img.vietqr.io/image/ACB-123456789-compact2.png?amount=${finalAmount}&addInfo=THANHTOAN%20${payment.id}%20${userId}`
}
```

## Luồng Thanh toán

### 1. Khóa học Miễn phí
```
User click "Đăng ký" → Đăng ký trực tiếp → Chuyển đến trang học
```

### 2. Khóa học Có phí

#### A. Thanh toán VNPay
```
User click "Đăng ký" 
  → Hiển thị thông báo xác nhận
  → Chuyển đến trang thanh toán
  → Chọn VNPay
  → Chuyển hướng đến VNPay
  → User thanh toán
  → VNPay callback
  → Xác nhận thanh toán
  → Tạo enrollment
  → Chuyển đến trang học
```

#### B. Chuyển khoản Ngân hàng
```
User click "Đăng ký"
  → Hiển thị thông báo xác nhận
  → Chuyển đến trang thanh toán
  → Chọn Chuyển khoản
  → Hiển thị thông tin TK + QR Code
  → User chuyển khoản
  → Admin xác nhận (hoặc tự động qua webhook)
  → Tạo enrollment
  → User có thể học
```

## API Endpoints

### Payment APIs

#### 1. Tạo Payment Intent
```http
POST /api/payment/courses/:courseId/payment-intent
Authorization: Bearer {token}

Body:
{
  "couponCode": "DISCOUNT10" // optional
}

Response:
{
  "success": true,
  "data": {
    "courseId": 1,
    "courseTitle": "Khóa học JavaScript",
    "originalAmount": 500000,
    "discountAmount": 50000,
    "finalAmount": 450000,
    "coupon": {...}
  }
}
```

#### 2. Xử lý Thanh toán
```http
POST /api/payment/courses/:courseId/process-payment
Authorization: Bearer {token}

Body:
{
  "paymentMethod": "vnpay", // vnpay | bank_transfer | momo | zalopay
  "couponCode": "DISCOUNT10" // optional
}

Response (VNPay):
{
  "success": true,
  "message": "Chuyển hướng đến VNPay",
  "data": {
    "paymentId": 123,
    "paymentUrl": "https://sandbox.vnpayment.vn/...",
    "orderId": "COURSE_123_1234567890"
  }
}

Response (Bank Transfer):
{
  "success": true,
  "message": "Vui lòng chuyển khoản theo thông tin bên dưới",
  "data": {
    "paymentId": 123,
    "paymentMethod": "bank_transfer",
    "bankInfo": {
      "bankName": "ACB",
      "accountNumber": "123456789",
      "accountName": "CONG TY...",
      "amount": 450000,
      "content": "THANHTOAN 123 456",
      "qrCode": "https://img.vietqr.io/..."
    }
  }
}
```

#### 3. VNPay Callback
```http
GET /api/payment/vnpay-return?vnp_Amount=...&vnp_ResponseCode=...
```

#### 4. Xác nhận Chuyển khoản (Admin)
```http
POST /api/payment/payments/:paymentId/confirm-bank-transfer
Authorization: Bearer {admin_token}

Body:
{
  "transactionId": "ACB123456789",
  "notes": "Đã xác nhận chuyển khoản"
}
```

#### 5. Validate Coupon
```http
GET /api/payment/coupons/:code/validate?courseId=1&amount=500000
Authorization: Bearer {token}
```

#### 6. Lịch sử Thanh toán
```http
GET /api/payment/my-payments?status=completed
Authorization: Bearer {token}
```

## Frontend Components

### 1. Course Detail Component
- Hiển thị giá khóa học
- Nút "Đăng ký" với thông báo rõ ràng
- Xác nhận trước khi chuyển đến thanh toán

### 2. Course Payment Component
- Hiển thị thông tin khóa học
- Tính toán giá với mã giảm giá
- Chọn phương thức thanh toán
- Xử lý thanh toán

### 3. Bank Transfer Info Component
- Hiển thị thông tin tài khoản
- QR Code để quét
- Copy thông tin nhanh
- Hướng dẫn chi tiết

### 4. VNPay Return Component
- Xử lý callback từ VNPay
- Hiển thị kết quả thanh toán
- Tự động chuyển hướng

## Testing

### 1. Test VNPay (Sandbox)

Thông tin test card:
```
Ngân hàng: NCB
Số thẻ: 9704198526191432198
Tên chủ thẻ: NGUYEN VAN A
Ngày phát hành: 07/15
Mật khẩu OTP: 123456
```

### 2. Test Chuyển khoản

1. Tạo payment với phương thức `bank_transfer`
2. Kiểm tra thông tin hiển thị
3. Admin xác nhận thanh toán:
```bash
curl -X POST http://localhost:3000/api/payment/payments/123/confirm-bank-transfer \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "TEST123", "notes": "Test payment"}'
```

### 3. Test Mã giảm giá

```sql
-- Tạo mã giảm giá test
INSERT INTO course_coupons (code, description, discount_type, discount_value, valid_from, valid_to, max_uses, is_active)
VALUES ('TEST10', 'Giảm 10%', 'percentage', 10, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 100, 1);
```

## Troubleshooting

### 1. VNPay không redirect về

Kiểm tra:
- `VNPAY_RETURN_URL` trong `.env` đúng chưa
- Frontend route `/payment/vnpay-return` đã được cấu hình
- CORS settings cho phép redirect

### 2. Chuyển khoản không hiển thị QR

Kiểm tra:
- URL QR Code đúng format
- Thông tin tài khoản đầy đủ
- VietQR API hoạt động

### 3. Payment không được xác nhận

Kiểm tra:
- Database transaction đã commit
- Enrollment được tạo thành công
- Course students count được cập nhật

## Security Notes

1. **VNPay Hash Secret**: Không commit vào Git, lưu trong `.env`
2. **Payment Verification**: Luôn verify signature từ VNPay
3. **Amount Validation**: Kiểm tra số tiền trước khi xử lý
4. **Transaction Idempotency**: Tránh xử lý duplicate payment
5. **Admin Confirmation**: Chỉ admin mới được xác nhận chuyển khoản

## Production Checklist

- [ ] Cập nhật VNPay URL từ sandbox sang production
- [ ] Cập nhật TMN_CODE và HASH_SECRET production
- [ ] Cấu hình HTTPS cho return URL
- [ ] Setup webhook cho auto-confirm bank transfer
- [ ] Enable payment logging
- [ ] Setup monitoring và alerts
- [ ] Test toàn bộ flow trên production
- [ ] Chuẩn bị refund policy
- [ ] Setup customer support cho payment issues

## Support

Nếu có vấn đề, liên hệ:
- Email: support@example.com
- Hotline: 1900-xxxx
- VNPay Support: https://vnpay.vn/ho-tro

## Changelog

### Version 1.0.0 (2024-11-19)
- ✅ Thêm tích hợp VNPay
- ✅ Thêm chuyển khoản ngân hàng với QR Code
- ✅ Cải thiện UI/UX thanh toán
- ✅ Thêm xác nhận thanh toán cho admin
- ✅ Hỗ trợ mã giảm giá
