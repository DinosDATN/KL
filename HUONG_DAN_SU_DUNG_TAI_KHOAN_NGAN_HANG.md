# Hướng dẫn sử dụng tính năng Tài khoản Ngân hàng cho Creator

## 🎯 Mục đích
Tính năng này cho phép creator cập nhật thông tin tài khoản ngân hàng để nhận thanh toán trực tiếp từ học viên khi họ đăng ký khóa học.

## 📋 Yêu cầu
- Tài khoản phải có role **Creator**
- Đã đăng nhập vào hệ thống

## 🚀 Cách sử dụng

### Bước 1: Truy cập trang quản lý tài khoản ngân hàng

Có 3 cách để truy cập:

**Cách 1:** Từ Creator Profile
1. Vào menu Profile (góc trên bên phải)
2. Chọn "Creator Profile" hoặc "Profile"
3. Trong phần "Quản lý nội dung", click vào **"Tài khoản ngân hàng"**

**Cách 2:** Truy cập trực tiếp
- Vào URL: `http://localhost:4200/profile/bank-account`

**Cách 3:** Từ menu Settings
- Vào Profile → Settings → Bank Account (nếu có)

### Bước 2: Thêm thông tin tài khoản ngân hàng

1. **Chọn ngân hàng** từ danh sách dropdown (20 ngân hàng phổ biến tại VN)
2. **Nhập số tài khoản** (ví dụ: 19036512345678)
3. **Nhập tên chủ tài khoản** (viết HOA, KHÔNG DẤU)
   - Ví dụ: NGUYEN VAN A
4. **Nhập chi nhánh** (tùy chọn)
   - Ví dụ: Chi nhánh Hà Nội
5. **Ghi chú** (tùy chọn)
6. Click **"Lưu"**

### Bước 3: Chờ xác thực

- Sau khi lưu, tài khoản sẽ có trạng thái **"Chờ xác thực"**
- Admin sẽ kiểm tra và xác thực thông tin
- Bạn sẽ nhận được thông báo khi tài khoản được xác thực

### Bước 4: Sử dụng

Sau khi được xác thực:
- Khi học viên thanh toán khóa học của bạn
- Họ sẽ thấy thông tin tài khoản ngân hàng của bạn
- Thanh toán sẽ được chuyển trực tiếp vào tài khoản của bạn

## 📝 Lưu ý quan trọng

### ✅ Nên làm
- Cung cấp thông tin chính xác 100%
- Kiểm tra kỹ số tài khoản trước khi lưu
- Tên chủ tài khoản phải viết HOA, KHÔNG DẤU (theo chuẩn ngân hàng)
- Cập nhật thông tin khi có thay đổi

### ❌ Không nên
- Nhập sai thông tin tài khoản
- Sử dụng tài khoản của người khác
- Thay đổi thông tin quá thường xuyên (mỗi lần thay đổi cần xác thực lại)

## 🔒 Bảo mật

- Số tài khoản được **mask** khi hiển thị (chỉ hiện 4 số cuối)
- Chỉ bạn và admin mới có thể xem thông tin đầy đủ
- Thông tin được mã hóa khi lưu trữ

## 🎓 Ví dụ thực tế

### Ví dụ 1: Thêm tài khoản Techcombank
```
Ngân hàng: Techcombank
Số tài khoản: 19036512345678
Tên chủ tài khoản: NGUYEN VAN A
Chi nhánh: Chi nhánh Hà Nội
Ghi chú: Tài khoản chính để nhận thanh toán
```

### Ví dụ 2: Thêm tài khoản Vietcombank
```
Ngân hàng: Vietcombank
Số tài khoản: 0123456789
Tên chủ tài khoản: TRAN THI B
Chi nhánh: Chi nhánh TP.HCM
Ghi chú: 
```

## 🔄 Quy trình thanh toán

```
1. Học viên chọn khóa học của bạn
   ↓
2. Chọn phương thức "Chuyển khoản ngân hàng"
   ↓
3. Hệ thống hiển thị thông tin tài khoản của bạn
   ↓
4. Học viên chuyển khoản
   ↓
5. Admin xác nhận thanh toán
   ↓
6. Học viên được cấp quyền truy cập khóa học
```

## ⚙️ Quản lý tài khoản

### Xem thông tin
- Vào trang quản lý tài khoản ngân hàng
- Thông tin sẽ hiển thị ở chế độ xem (số tài khoản bị mask)

### Chỉnh sửa
1. Click nút **"Chỉnh sửa"**
2. Cập nhật thông tin cần thay đổi
3. Click **"Cập nhật"**
4. Trạng thái xác thực sẽ reset về "Chờ xác thực"

### Xóa
1. Click nút **"Xóa"**
2. Xác nhận xóa
3. Tài khoản sẽ bị vô hiệu hóa (soft delete)
4. Học viên sẽ thanh toán vào tài khoản mặc định của hệ thống

## 🏦 Danh sách ngân hàng hỗ trợ

1. Vietcombank
2. BIDV
3. VietinBank
4. Agribank
5. Techcombank
6. MB Bank
7. ACB
8. VPBank
9. TPBank
10. Sacombank
11. HDBank
12. SHB
13. VIB
14. MSB
15. OCB
16. SeABank
17. LienVietPostBank
18. BacABank
19. PVcomBank
20. NCB

## ❓ Câu hỏi thường gặp

### Q: Tại sao tài khoản của tôi chưa được xác thực?
**A:** Admin cần kiểm tra thông tin trước khi xác thực. Thời gian xử lý thường từ 1-3 ngày làm việc.

### Q: Tôi có thể có nhiều tài khoản ngân hàng không?
**A:** Hiện tại mỗi creator chỉ có thể có 1 tài khoản ngân hàng active.

### Q: Nếu tôi chưa có tài khoản ngân hàng thì sao?
**A:** Học viên sẽ thanh toán vào tài khoản mặc định của hệ thống. Bạn sẽ nhận được thanh toán sau khi hệ thống xử lý.

### Q: Tôi có thể thay đổi tài khoản ngân hàng không?
**A:** Có, bạn có thể cập nhật bất cứ lúc nào. Tuy nhiên, mỗi lần cập nhật cần được admin xác thực lại.

### Q: Làm sao để biết tài khoản đã được xác thực?
**A:** Trạng thái sẽ hiển thị "Đã xác thực" với dấu tích xanh ✓

### Q: Tôi có thể xem lịch sử thanh toán không?
**A:** Tính năng này đang được phát triển và sẽ có trong phiên bản tiếp theo.

## 📞 Hỗ trợ

Nếu bạn gặp vấn đề hoặc có câu hỏi:
- Liên hệ Admin qua email: admin@example.com
- Hoặc tạo ticket hỗ trợ trong hệ thống

## 🎉 Lợi ích

✅ Nhận thanh toán trực tiếp, nhanh chóng
✅ Không qua trung gian
✅ Minh bạch trong giao dịch
✅ Quản lý dễ dàng
✅ Bảo mật thông tin

---

**Chúc bạn thành công với việc tạo và bán khóa học! 🚀**
