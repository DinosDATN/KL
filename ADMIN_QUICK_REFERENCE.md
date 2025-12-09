# 🚀 Admin Quick Reference - Duyệt Tài khoản Ngân hàng

## ⚡ Truy cập nhanh

**URL:** `http://localhost:4200/admin/bank-accounts`

**Menu:** Admin → Payments & Transactions → Bank Accounts

## 📋 Checklist duyệt tài khoản (30 giây)

### ✅ Kiểm tra nhanh:
1. [ ] Tên ngân hàng có trong danh sách 20 ngân hàng phổ biến?
2. [ ] Số tài khoản có đúng định dạng (10-16 số)?
3. [ ] Tên chủ TK viết HOA, KHÔNG DẤU?
4. [ ] Tên chủ TK có khớp với tên creator?
5. [ ] Creator có uy tín (kiểm tra profile)?

### ✅ Nếu TẤT CẢ đều OK:
→ Click **"✓ Duyệt"** → Xác nhận

### ❌ Nếu có vấn đề:
→ Liên hệ creator yêu cầu sửa → Chưa duyệt

## 🎯 Các trường hợp thường gặp

### Case 1: Tên chủ TK có dấu
**Ví dụ:** "Nguyễn Văn A" ❌
**Yêu cầu:** "NGUYEN VAN A" ✅
**Action:** Từ chối, yêu cầu sửa

### Case 2: Tên chủ TK viết thường
**Ví dụ:** "nguyen van a" ❌
**Yêu cầu:** "NGUYEN VAN A" ✅
**Action:** Từ chối, yêu cầu sửa

### Case 3: Số tài khoản sai định dạng
**Ví dụ:** "123-456-789" ❌
**Yêu cầu:** "123456789" ✅
**Action:** Từ chối, yêu cầu sửa

### Case 4: Tên không khớp
**Creator:** "Nguyen Van A"
**Chủ TK:** "TRAN THI B" ❌
**Action:** Liên hệ xác minh

### Case 5: Thông tin đầy đủ và chính xác
**Action:** Duyệt ngay ✅

## 🔍 Bộ lọc nhanh

### Xem tài khoản chờ duyệt:
1. Chọn filter: **"Chờ xác thực"**
2. Danh sách chỉ hiển thị tài khoản chưa duyệt

### Tìm kiếm theo creator:
1. Nhập tên hoặc email vào search box
2. Kết quả hiển thị real-time

### Xem tài khoản đã duyệt:
1. Chọn filter: **"Đã xác thực"**
2. Danh sách chỉ hiển thị tài khoản đã duyệt

## 📊 Thống kê nhanh

**Tổng số tài khoản:** Tất cả tài khoản trong hệ thống
**Đã xác thực:** Số tài khoản đã duyệt
**Chờ xác thực:** Số tài khoản cần duyệt (ưu tiên xử lý)
**Đang hoạt động:** Số tài khoản active

## 🎯 Mục tiêu SLA

- **Thời gian duyệt:** < 24 giờ
- **Tỷ lệ duyệt:** > 90%
- **Thời gian phản hồi:** < 2 giờ (nếu có vấn đề)

## 🏦 Danh sách 20 ngân hàng hỗ trợ

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

## ⚠️ Red Flags (Cảnh báo)

### Từ chối ngay nếu:
- ❌ Tên chủ TK hoàn toàn khác với tên creator
- ❌ Số tài khoản có ký tự đặc biệt
- ❌ Ngân hàng không có trong danh sách
- ❌ Thông tin rõ ràng là giả mạo
- ❌ Creator có lịch sử vi phạm

### Liên hệ xác minh nếu:
- ⚠️ Tên chủ TK hơi khác tên creator
- ⚠️ Thông tin không rõ ràng
- ⚠️ Creator mới, chưa có uy tín
- ⚠️ Số tài khoản có định dạng lạ

## 📞 Liên hệ Creator

### Template email:
```
Subject: Yêu cầu cập nhật thông tin tài khoản ngân hàng

Xin chào [Tên Creator],

Chúng tôi đã nhận được thông tin tài khoản ngân hàng của bạn.
Tuy nhiên, có một số vấn đề cần điều chỉnh:

[Liệt kê vấn đề]

Vui lòng cập nhật lại thông tin tại:
http://localhost:4200/profile/bank-account

Trân trọng,
Admin Team
```

## 🔄 Quy trình xử lý hàng ngày

### Buổi sáng (9:00 AM):
1. Vào `/admin/bank-accounts`
2. Chọn filter "Chờ xác thực"
3. Duyệt tất cả tài khoản hợp lệ
4. Gửi email cho tài khoản có vấn đề

### Buổi chiều (2:00 PM):
1. Kiểm tra lại tài khoản đã được sửa
2. Duyệt nếu đã OK
3. Cập nhật statistics

### Cuối ngày (5:00 PM):
1. Kiểm tra tổng số tài khoản chờ duyệt
2. Ưu tiên xử lý nếu > 10 tài khoản
3. Báo cáo cho team lead

## 📈 Metrics cần theo dõi

### Hàng ngày:
- Số tài khoản mới
- Số tài khoản đã duyệt
- Số tài khoản từ chối
- Thời gian duyệt trung bình

### Hàng tuần:
- Tỷ lệ duyệt
- Số lượng khiếu nại
- Feedback từ creator

### Hàng tháng:
- Tổng số tài khoản active
- Tỷ lệ tài khoản được sử dụng
- Số giao dịch thành công

## 🎓 Tips & Tricks

### Tip 1: Duyệt hàng loạt
- Mở nhiều tab
- Duyệt song song
- Tiết kiệm thời gian

### Tip 2: Sử dụng keyboard shortcuts
- Tab: Di chuyển giữa các nút
- Enter: Xác nhận
- Esc: Hủy

### Tip 3: Bookmark trang
- Thêm vào bookmark bar
- Truy cập nhanh hơn

### Tip 4: Sử dụng search
- Tìm nhanh theo tên
- Tìm theo email
- Tìm theo ngân hàng

## ❓ FAQ

**Q: Tôi có thể hủy duyệt tài khoản đã duyệt không?**
A: Có, click nút "✗ Hủy" trên tài khoản đã duyệt.

**Q: Tài khoản đã duyệt có thể sửa không?**
A: Creator có thể sửa, nhưng sẽ reset về trạng thái "Chờ xác thực".

**Q: Nếu creator xóa tài khoản thì sao?**
A: Tài khoản sẽ bị soft delete (is_active = false).

**Q: Có thể duyệt tài khoản qua API không?**
A: Có, sử dụng PATCH endpoint với admin token.

**Q: Làm sao biết tài khoản đã được sử dụng?**
A: Xem trong payment history (future feature).

## 🚨 Emergency Contacts

**Tech Support:** tech@example.com
**Team Lead:** lead@example.com
**Hotline:** 1900-xxxx

## 📝 Notes

- Luôn kiểm tra kỹ trước khi duyệt
- Liên hệ creator nếu có nghi ngờ
- Ghi chú lý do từ chối (future feature)
- Báo cáo các trường hợp bất thường

---

**Last Updated:** 09/12/2024
**Version:** 1.0.0
**For:** Admin Team
