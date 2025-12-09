# Tính năng Quản lý Tài khoản Ngân hàng cho Creator

## Tổng quan
Tính năng này cho phép creator cập nhật thông tin tài khoản ngân hàng của họ. Khi học viên thanh toán cho khóa học, hệ thống sẽ hiển thị thông tin tài khoản ngân hàng của creator đó thay vì sử dụng tài khoản mặc định.

## Các thành phần đã tạo

### Backend

1. **Model**: `api/src/models/CreatorBankAccount.js`
   - Quản lý thông tin tài khoản ngân hàng
   - Các trường: bank_name, account_number, account_name, branch, is_verified, is_active

2. **Controller**: `api/src/controllers/creatorBankAccountController.js`
   - `getMyBankAccount()` - Lấy thông tin tài khoản của creator
   - `upsertBankAccount()` - Tạo/cập nhật tài khoản
   - `deleteBankAccount()` - Xóa tài khoản (soft delete)
   - `getBankAccountByCourse()` - Lấy thông tin tài khoản theo courseId
   - `getAllBankAccounts()` - Admin: Xem tất cả tài khoản
   - `verifyBankAccount()` - Admin: Xác thực tài khoản

3. **Routes**: `api/src/routes/creatorBankAccountRoutes.js`
   - `GET /api/v1/creator-bank-accounts/my-bank-account` - Lấy tài khoản của mình
   - `POST /api/v1/creator-bank-accounts/my-bank-account` - Tạo/cập nhật
   - `DELETE /api/v1/creator-bank-accounts/my-bank-account` - Xóa
   - `GET /api/v1/creator-bank-accounts/courses/:courseId/bank-account` - Lấy theo course
   - `GET /api/v1/creator-bank-accounts/admin/bank-accounts` - Admin: Danh sách
   - `PATCH /api/v1/creator-bank-accounts/admin/bank-accounts/:accountId/verify` - Admin: Xác thực

4. **Migration**: `api/migrations/create_creator_bank_accounts_table.sql`
   - Script tạo bảng `creator_bank_accounts`

5. **Cập nhật Payment Controller**: `api/src/controllers/paymentController.js`
   - Logic thanh toán đã được cập nhật để sử dụng tài khoản của creator
   - Nếu creator chưa có tài khoản hoặc chưa được xác thực, sử dụng tài khoản mặc định

### Frontend

1. **Service**: `cli/src/app/core/services/creator-bank-account.service.ts`
   - Service để gọi API quản lý tài khoản ngân hàng

2. **Component**: `cli/src/app/features/profile/bank-account/`
   - `bank-account.component.ts` - Logic component
   - `bank-account.component.html` - Template
   - `bank-account.component.css` - Styles

3. **Route**: Đã thêm vào `cli/src/app/app.routes.ts`
   - Path: `/profile/bank-account`

## Cách sử dụng

### 1. Chạy Migration

```bash
cd api
node run-migration.js
```

Hoặc chạy SQL trực tiếp:
```bash
mysql -u root -p lfysdb < migrations/create_creator_bank_accounts_table.sql
```

### 2. Khởi động Backend

```bash
cd api
npm start
```

### 3. Khởi động Frontend

```bash
cd cli
npm start
```

### 4. Truy cập tính năng

1. Đăng nhập với tài khoản **creator**
2. Vào menu Profile → Bank Account (hoặc truy cập `/profile/bank-account`)
3. Điền thông tin tài khoản ngân hàng:
   - Chọn ngân hàng
   - Nhập số tài khoản
   - Nhập tên chủ tài khoản (viết hoa, không dấu)
   - Chi nhánh (tùy chọn)
   - Ghi chú (tùy chọn)
4. Nhấn "Lưu"

### 5. Admin xác thực tài khoản

Admin cần xác thực tài khoản ngân hàng trước khi nó được sử dụng:
- Gọi API: `PATCH /api/v1/creator-bank-accounts/admin/bank-accounts/:accountId/verify`
- Body: `{ "is_verified": true }`

### 6. Kiểm tra thanh toán

1. Học viên chọn khóa học của creator
2. Chọn phương thức thanh toán "Chuyển khoản ngân hàng"
3. Hệ thống sẽ hiển thị:
   - Thông tin tài khoản của creator (nếu đã xác thực)
   - Thông tin tài khoản mặc định (nếu chưa xác thực hoặc chưa có)

## Flow hoạt động

```
1. Creator tạo/cập nhật tài khoản ngân hàng
   ↓
2. Tài khoản có trạng thái: is_verified = false
   ↓
3. Admin xác thực tài khoản → is_verified = true
   ↓
4. Học viên thanh toán khóa học
   ↓
5. Hệ thống kiểm tra:
   - Có tài khoản của creator?
   - Đã được xác thực?
   ↓
6. Hiển thị thông tin tài khoản phù hợp
```

## Bảo mật

- Số tài khoản được mask khi hiển thị (chỉ hiện 4 số cuối)
- Chỉ creator mới có thể quản lý tài khoản của mình
- Admin có thể xem và xác thực tất cả tài khoản
- Tài khoản phải được xác thực trước khi sử dụng

## API Endpoints

### Creator APIs

```
GET    /api/v1/creator-bank-accounts/my-bank-account
POST   /api/v1/creator-bank-accounts/my-bank-account
PUT    /api/v1/creator-bank-accounts/my-bank-account
DELETE /api/v1/creator-bank-accounts/my-bank-account
```

### Public API

```
GET    /api/v1/creator-bank-accounts/courses/:courseId/bank-account
```

### Admin APIs

```
GET    /api/v1/creator-bank-accounts/admin/bank-accounts
PATCH  /api/v1/creator-bank-accounts/admin/bank-accounts/:accountId/verify
```

## Database Schema

```sql
CREATE TABLE creator_bank_accounts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL UNIQUE,
  bank_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  branch VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Danh sách ngân hàng hỗ trợ

- Vietcombank
- BIDV
- VietinBank
- Agribank
- Techcombank
- MB Bank
- ACB
- VPBank
- TPBank
- Sacombank
- HDBank
- SHB
- VIB
- MSB
- OCB
- SeABank
- LienVietPostBank
- BacABank
- PVcomBank
- NCB

## Lưu ý

1. Tài khoản ngân hàng phải được admin xác thực trước khi sử dụng
2. Trong thời gian chờ xác thực, học viên sẽ thanh toán vào tài khoản mặc định
3. Creator có thể cập nhật thông tin bất cứ lúc nào (sẽ reset trạng thái xác thực)
4. Mỗi creator chỉ có thể có 1 tài khoản ngân hàng active
5. Xóa tài khoản là soft delete (is_active = false)

## Testing

### Test Creator Flow
1. Đăng nhập với role creator
2. Truy cập `/profile/bank-account`
3. Thêm thông tin tài khoản ngân hàng
4. Kiểm tra hiển thị thông tin (số tài khoản bị mask)
5. Cập nhật thông tin
6. Xóa tài khoản

### Test Payment Flow
1. Tạo khóa học với creator đã có tài khoản ngân hàng
2. Đăng nhập với user khác
3. Chọn thanh toán khóa học
4. Chọn phương thức "Chuyển khoản ngân hàng"
5. Kiểm tra thông tin tài khoản hiển thị

### Test Admin Flow
1. Đăng nhập với role admin
2. Gọi API lấy danh sách tài khoản ngân hàng
3. Xác thực tài khoản
4. Kiểm tra trạng thái is_verified

## Troubleshooting

### Lỗi "Chỉ creator mới có thể quản lý tài khoản ngân hàng"
- Kiểm tra role của user phải là 'creator'

### Tài khoản không hiển thị khi thanh toán
- Kiểm tra is_verified = true
- Kiểm tra is_active = true
- Kiểm tra user_id khớp với instructor_id của course

### Migration lỗi
- Kiểm tra kết nối database
- Kiểm tra bảng users đã tồn tại
- Kiểm tra quyền tạo bảng

## Tính năng mở rộng (Future)

1. Hỗ trợ nhiều tài khoản ngân hàng cho 1 creator
2. Tự động xác thực qua API ngân hàng
3. Lịch sử giao dịch và báo cáo doanh thu
4. Tích hợp VietQR tự động
5. Webhook thông báo khi có thanh toán
6. Dashboard thống kê cho creator
