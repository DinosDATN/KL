# Hướng dẫn Nhanh - Hệ thống Thanh toán

## Cài đặt Nhanh

### 1. Backend Setup

```bash
cd api
npm install moment
```

Cập nhật `.env`:
```env
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_TMN_CODE=YOUR_TMN_CODE
VNPAY_HASH_SECRET=YOUR_HASH_SECRET
VNPAY_RETURN_URL=http://localhost:4200/payment/vnpay-return
```

### 2. Database Setup

```bash
mysql -u root -p lfys_main < api/sql-scripts/008-payment-test-data.sql
```

### 3. Khởi động Server

```bash
# Backend
cd api
npm start

# Frontend
cd cli
npm start
```

## Test Nhanh

### 1. Test Khóa học Có phí

1. Truy cập: http://localhost:4200/courses
2. Chọn khóa học có giá (ví dụ: "Khóa học Test Thanh toán")
3. Click "Đăng ký khóa học"
4. Xác nhận thanh toán

### 2. Test VNPay

1. Chọn phương thức "VNPay"
2. Click "Thanh toán"
3. Sử dụng thông tin test:
   - Ngân hàng: NCB
   - Số thẻ: 9704198526191432198
   - Tên: NGUYEN VAN A
   - Ngày: 07/15
   - OTP: 123456

### 3. Test Chuyển khoản

1. Chọn phương thức "Chuyển khoản ngân hàng"
2. Click "Thanh toán"
3. Xem thông tin tài khoản và QR Code
4. Admin xác nhận thanh toán (xem bên dưới)

### 4. Test Mã giảm giá

Các mã có sẵn:
- `WELCOME10` - Giảm 10%
- `SAVE50K` - Giảm 50,000đ (đơn từ 200,000đ)
- `PREMIUM20` - Giảm 20% (đơn từ 300,000đ)
- `SPECIAL30` - Giảm 30% (đơn từ 500,000đ)
- `VIP100K` - Giảm 100,000đ (đơn từ 1,000,000đ)

## Admin - Xác nhận Chuyển khoản

```bash
curl -X POST http://localhost:3000/api/payment/payments/PAYMENT_ID/confirm-bank-transfer \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "BANK_TXN_123",
    "notes": "Đã xác nhận chuyển khoản"
  }'
```

## Các Tính năng Chính

✅ **Thông báo rõ ràng**: Hiển thị giá và xác nhận trước khi thanh toán
✅ **VNPay**: Thanh toán trực tuyến qua cổng VNPay
✅ **Chuyển khoản**: Hiển thị thông tin TK + QR Code
✅ **Mã giảm giá**: Hỗ trợ coupon giảm % hoặc giảm cố định
✅ **Tự động enrollment**: Sau thanh toán thành công tự động đăng ký khóa học

## Cấu trúc File Mới

```
api/
├── src/
│   ├── services/
│   │   └── vnpayService.js          # VNPay integration
│   └── controllers/
│       └── paymentController.js     # Updated với VNPay & Bank Transfer
├── sql-scripts/
│   └── 008-payment-test-data.sql    # Test data
└── .env.example                      # Environment variables

cli/src/app/features/courses/
├── bank-transfer-info/               # Trang thông tin chuyển khoản
│   ├── bank-transfer-info.component.ts
│   ├── bank-transfer-info.component.html
│   └── bank-transfer-info.component.css
├── vnpay-return/                     # Trang xử lý VNPay callback
│   ├── vnpay-return.component.ts
│   ├── vnpay-return.component.html
│   └── vnpay-return.component.css
├── course-detail/                    # Updated với thông báo thanh toán
└── course-payment/                   # Updated với VNPay & Bank Transfer
```

## Troubleshooting

**VNPay không hoạt động?**
- Kiểm tra TMN_CODE và HASH_SECRET
- Đảm bảo RETURN_URL đúng
- Kiểm tra route `/payment/vnpay-return` đã được cấu hình

**QR Code không hiển thị?**
- Kiểm tra URL VietQR API
- Đảm bảo thông tin tài khoản đầy đủ

**Mã giảm giá không áp dụng?**
- Kiểm tra mã còn hiệu lực
- Đảm bảo đơn hàng đủ điều kiện (min_purchase_amount)
- Kiểm tra số lần sử dụng (max_uses)

## Liên hệ

Nếu cần hỗ trợ, xem file `PAYMENT_SYSTEM_GUIDE.md` để biết chi tiết.
