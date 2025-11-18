# 🧪 Hướng Dẫn Test Tính Năng Làm Bài Tập Trong Contest

## 📋 Checklist Test

### ✅ Bước 1: Chuẩn Bị
- [ ] API server đang chạy (`cd api && npm start`)
- [ ] Frontend đang chạy (`cd cli && npm start`)
- [ ] Database có dữ liệu contest và problems
- [ ] Có tài khoản user để test

### ✅ Bước 2: Test Xem Danh Sách Bài Tập (Không Cần Đăng Nhập)

#### Test 2.1: User Chưa Đăng Nhập
1. Mở trình duyệt ở chế độ incognito
2. Truy cập: `http://localhost:4200/contests`
3. Click vào một cuộc thi bất kỳ
4. Kiểm tra:
   - [ ] Danh sách bài tập hiển thị
   - [ ] Mỗi bài tập hiển thị: tên, độ khó, điểm số
   - [ ] Hiển thị nút "Xem chi tiết" (màu xanh dương)
   - [ ] KHÔNG hiển thị nút "Làm bài tập"

#### Test 2.2: Click "Xem Chi Tiết"
1. Click nút "Xem chi tiết" ở một bài tập
2. Kiểm tra:
   - [ ] Navigate đến `/problems/:id`
   - [ ] KHÔNG có banner "Chế độ thi đấu"
   - [ ] Có thể xem đề bài
   - [ ] Có thể xem examples

### ✅ Bước 3: Test Đăng Nhập Và Đăng Ký

#### Test 3.1: Đăng Nhập
1. Click "Đăng nhập"
2. Đăng nhập với tài khoản test
3. Kiểm tra:
   - [ ] Đăng nhập thành công
   - [ ] Hiển thị tên user ở header

#### Test 3.2: Xem Contest Chưa Đăng Ký
1. Truy cập một cuộc thi active
2. Kiểm tra:
   - [ ] Hiển thị nút "Tham gia cuộc thi"
   - [ ] Danh sách bài tập hiển thị
   - [ ] Vẫn hiển thị nút "Xem chi tiết" (chưa có "Làm bài tập")

#### Test 3.3: Đăng Ký Cuộc Thi
1. Click nút "Tham gia cuộc thi"
2. Kiểm tra:
   - [ ] Hiển thị notification thành công
   - [ ] Nút chuyển thành "Hủy tham gia"
   - [ ] Số người tham gia tăng lên 1

### ✅ Bước 4: Test Nút "Làm Bài Tập"

#### Test 4.1: Contest Active + Đã Đăng Ký
1. Đảm bảo đã đăng ký cuộc thi active
2. Xem danh sách bài tập
3. Kiểm tra:
   - [ ] Hiển thị nút "Làm bài tập" (màu xanh lá) ✨
   - [ ] Icon play hiển thị
   - [ ] Text "Làm bài tập"

#### Test 4.2: Contest Upcoming
1. Đăng ký cuộc thi upcoming
2. Xem danh sách bài tập
3. Kiểm tra:
   - [ ] Hiển thị nút "Xem chi tiết" (không phải "Làm bài tập")
   - [ ] Không thể làm bài vì contest chưa bắt đầu

#### Test 4.3: Contest Completed
1. Xem cuộc thi đã kết thúc
2. Kiểm tra:
   - [ ] Hiển thị nút "Xem chi tiết"
   - [ ] Không thể làm bài vì contest đã kết thúc

### ✅ Bước 5: Test Làm Bài Tập Trong Contest

#### Test 5.1: Click "Làm Bài Tập"
1. Trong cuộc thi active đã đăng ký
2. Click nút "Làm bài tập" ở một bài
3. Kiểm tra:
   - [ ] Navigate đến `/problems/:id?contest_id=X&contest_problem_id=Y`
   - [ ] URL có query params `contest_id` và `contest_problem_id`

#### Test 5.2: Contest Mode Banner
1. Sau khi navigate
2. Kiểm tra:
   - [ ] Hiển thị banner màu tím-xanh ở đầu trang ✨
   - [ ] Icon trophy hiển thị
   - [ ] Text "Chế độ thi đấu"
   - [ ] Text "Bạn đang làm bài trong cuộc thi"
   - [ ] Nút "Quay lại cuộc thi"

#### Test 5.3: Click "Quay Lại Cuộc Thi"
1. Click nút "Quay lại cuộc thi" trong banner
2. Kiểm tra:
   - [ ] Navigate về `/contests/:id`
   - [ ] Hiển thị trang chi tiết cuộc thi

### ✅ Bước 6: Test Submit Code Trong Contest

#### Test 6.1: Viết Code
1. Trong problem detail (contest mode)
2. Chọn ngôn ngữ (Python, JavaScript, etc.)
3. Viết code đơn giản
4. Kiểm tra:
   - [ ] Code editor hoạt động bình thường
   - [ ] Có thể chọn ngôn ngữ
   - [ ] Có thể viết code

#### Test 6.2: Run Code
1. Click nút "Run"
2. Kiểm tra:
   - [ ] Code được execute
   - [ ] Hiển thị kết quả
   - [ ] Không submit vào contest (chỉ test local)

#### Test 6.3: Submit Code
1. Click nút "Submit"
2. Mở DevTools Network tab
3. Kiểm tra:
   - [ ] Gọi API: `POST /api/v1/contests/:contest_id/problems/:problem_id/submit` ✨
   - [ ] Request body có `sourceCode` và `language`
   - [ ] Response có `submission` và `execution_result`

#### Test 6.4: Xem Kết Quả
1. Sau khi submit
2. Kiểm tra:
   - [ ] Hiển thị notification với điểm số
   - [ ] Hiển thị execution result
   - [ ] Hiển thị test cases passed/failed
   - [ ] Hiển thị score (điểm số contest)

### ✅ Bước 7: Test Edge Cases

#### Test 7.1: Submit Khi Chưa Đăng Ký
1. Xóa registration trong database
2. Thử submit code
3. Kiểm tra:
   - [ ] API trả về lỗi 403
   - [ ] Hiển thị thông báo lỗi
   - [ ] Không lưu submission

#### Test 7.2: Submit Khi Contest Đã Kết Thúc
1. Đợi contest kết thúc (hoặc thay đổi end_time trong DB)
2. Thử submit code
3. Kiểm tra:
   - [ ] API trả về lỗi 400
   - [ ] Hiển thị thông báo "Contest is not currently active"

#### Test 7.3: Submit Code Sai
1. Viết code sai (syntax error hoặc logic error)
2. Submit
3. Kiểm tra:
   - [ ] Hiển thị status "error" hoặc "wrong"
   - [ ] Điểm số = 0
   - [ ] Hiển thị test cases failed

#### Test 7.4: Submit Code Đúng
1. Viết code đúng (pass all test cases)
2. Submit
3. Kiểm tra:
   - [ ] Hiển thị status "accepted"
   - [ ] Điểm số = full score (100, 150, etc.)
   - [ ] Hiển thị notification thành công

### ✅ Bước 8: Test Responsive (Mobile)

#### Test 8.1: Mobile View
1. Mở DevTools, chuyển sang mobile view
2. Truy cập contest detail
3. Kiểm tra:
   - [ ] Danh sách bài tập hiển thị tốt
   - [ ] Nút "Làm bài tập" hiển thị đầy đủ
   - [ ] Có thể click và navigate

#### Test 8.2: Mobile Problem Detail
1. Trong mobile view, làm bài tập
2. Kiểm tra:
   - [ ] Banner contest mode hiển thị tốt
   - [ ] Code editor responsive
   - [ ] Có thể submit code

### ✅ Bước 9: Test Browser Console

#### Test 9.1: Kiểm Tra Console Errors
1. Mở DevTools Console
2. Thực hiện toàn bộ flow
3. Kiểm tra:
   - [ ] Không có lỗi màu đỏ
   - [ ] Không có warning quan trọng

#### Test 9.2: Kiểm Tra Network Requests
1. Mở DevTools Network tab
2. Thực hiện flow làm bài
3. Kiểm tra:
   - [ ] Request `/contests/:id/problems` trả về 200
   - [ ] Request submit trả về 201
   - [ ] Không có request failed

### ✅ Bước 10: Test Multiple Users

#### Test 10.1: User A Làm Bài
1. User A đăng ký và làm bài
2. Submit code, nhận điểm

#### Test 10.2: User B Làm Bài
1. User B đăng ký cùng contest
2. Làm bài và submit
3. Kiểm tra:
   - [ ] Cả 2 users có submission riêng
   - [ ] Điểm số được tính riêng
   - [ ] Không ảnh hưởng lẫn nhau

## 📊 Kết Quả Mong Đợi

### ✅ Tất Cả Tests Pass
- Tổng số tests: ~40 test cases
- Tất cả phải PASS

### ❌ Nếu Có Test Fail
1. Ghi lại test case nào fail
2. Kiểm tra console errors
3. Kiểm tra network requests
4. Xem file `CONTEST_DEBUG_GUIDE.md`

## 🐛 Common Issues

### Issue 1: Nút "Làm Bài Tập" Không Hiển Thị
**Nguyên nhân:**
- User chưa đăng nhập
- User chưa đăng ký contest
- Contest không active

**Giải pháp:**
- Đảm bảo đã đăng nhập
- Đảm bảo đã đăng ký
- Kiểm tra contest status

### Issue 2: Submit Trả Về 401
**Nguyên nhân:**
- Token hết hạn
- Chưa đăng nhập

**Giải pháp:**
- Đăng nhập lại
- Kiểm tra token trong localStorage

### Issue 3: Submit Trả Về 403
**Nguyên nhân:**
- Chưa đăng ký contest
- Contest chưa active

**Giải pháp:**
- Đăng ký contest
- Kiểm tra contest status

### Issue 4: Banner Không Hiển Thị
**Nguyên nhân:**
- Query params không có trong URL
- Component không detect contest mode

**Giải pháp:**
- Kiểm tra URL có `contest_id` và `contest_problem_id`
- Kiểm tra method `checkContestMode()`

## 📝 Test Report Template

```
# Test Report - Contest Problem Solving Feature

Date: [DATE]
Tester: [NAME]
Environment: [Development/Staging/Production]

## Test Results

### Xem Danh Sách Bài Tập
- [ ] Pass / [ ] Fail
Notes: ___________

### Đăng Ký Contest
- [ ] Pass / [ ] Fail
Notes: ___________

### Nút "Làm Bài Tập"
- [ ] Pass / [ ] Fail
Notes: ___________

### Contest Mode Banner
- [ ] Pass / [ ] Fail
Notes: ___________

### Submit Code
- [ ] Pass / [ ] Fail
Notes: ___________

### Edge Cases
- [ ] Pass / [ ] Fail
Notes: ___________

## Overall Result
- [ ] All Tests Pass ✅
- [ ] Some Tests Fail ❌

## Issues Found
1. ___________
2. ___________

## Recommendations
1. ___________
2. ___________
```

## 🎉 Kết Luận

Sau khi hoàn thành tất cả test cases, tính năng sẽ sẵn sàng để deploy!
