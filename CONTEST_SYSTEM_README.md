# Hệ Thống Contest - Tài Liệu Tổng Hợp

## Tổng Quan
Hệ thống Contest cho phép người dùng:
- Xem danh sách các cuộc thi
- Xem chi tiết cuộc thi và danh sách bài tập
- Đăng ký tham gia cuộc thi
- Nộp bài giải cho các bài tập trong cuộc thi
- Xem bảng xếp hạng

## Cấu Trúc Database

### Bảng `contests`
Lưu thông tin các cuộc thi
```sql
- id: BIGINT (Primary Key)
- title: VARCHAR(255)
- description: TEXT
- start_time: DATETIME
- end_time: DATETIME
- created_by: BIGINT (Foreign Key -> users.id)
- created_at: DATETIME
- updated_at: DATETIME
```

### Bảng `contest_problems`
Liên kết bài tập với cuộc thi
```sql
- id: BIGINT (Primary Key)
- contest_id: BIGINT (Foreign Key -> contests.id)
- problem_id: BIGINT (Foreign Key -> problems.id)
- score: INT (điểm số của bài tập)
- created_at: DATETIME
- updated_at: DATETIME
```

### Bảng `user_contests`
Lưu thông tin đăng ký tham gia cuộc thi
```sql
- id: BIGINT (Primary Key)
- contest_id: BIGINT (Foreign Key -> contests.id)
- user_id: BIGINT (Foreign Key -> users.id)
- joined_at: DATETIME
```

### Bảng `contest_submissions`
Lưu các lần nộp bài của người dùng
```sql
- id: BIGINT (Primary Key)
- user_id: BIGINT (Foreign Key -> users.id)
- contest_problem_id: BIGINT (Foreign Key -> contest_problems.id)
- code_id: BIGINT (Foreign Key -> submission_codes.id)
- language: VARCHAR(50)
- status: ENUM('accepted', 'wrong', 'error')
- score: INT
- submitted_at: DATETIME
```

## API Endpoints

### Public Endpoints (Không cần authentication)
```
GET  /api/contests/active          - Lấy danh sách cuộc thi đang diễn ra
GET  /api/contests/upcoming        - Lấy danh sách cuộc thi sắp tới
GET  /api/contests/past            - Lấy danh sách cuộc thi đã kết thúc
```

### Optional Auth Endpoints (Hoạt động với hoặc không có token)
```
GET  /api/contests                 - Lấy danh sách tất cả cuộc thi
GET  /api/contests/:id             - Lấy chi tiết cuộc thi
GET  /api/contests/:id/problems    - Lấy danh sách bài tập của cuộc thi ⭐
```

### Authenticated Endpoints (Yêu cầu đăng nhập)
```
POST   /api/contests/:id/register              - Đăng ký tham gia cuộc thi
DELETE /api/contests/:id/register              - Hủy đăng ký cuộc thi
POST   /api/contests/:id/problems/:pid/submit  - Nộp bài giải
GET    /api/contests/:id/submissions           - Lấy danh sách bài nộp của user
GET    /api/contests/:id/leaderboard           - Xem bảng xếp hạng
GET    /api/contests/:id/participants          - Xem danh sách người tham gia
```

### Admin/Creator Endpoints (Yêu cầu quyền admin hoặc creator)
```
POST   /api/contests                           - Tạo cuộc thi mới
PUT    /api/contests/:id                       - Cập nhật cuộc thi
DELETE /api/contests/:id                       - Xóa cuộc thi
POST   /api/contests/:id/problems              - Thêm bài tập vào cuộc thi
DELETE /api/contests/:id/problems/:pid         - Xóa bài tập khỏi cuộc thi
```

## Frontend Components

### Contests List (`/contests`)
- Hiển thị danh sách tất cả cuộc thi
- Lọc theo trạng thái (active, upcoming, completed)
- Tìm kiếm theo tên, mô tả
- Phân trang với "Load More"

**Files:**
- `cli/src/app/features/contests/contests/contests.component.ts`
- `cli/src/app/features/contests/contests/contests.component.html`

### Contest Detail (`/contests/:id`)
- Hiển thị thông tin chi tiết cuộc thi
- Hiển thị danh sách bài tập ⭐
- Nút đăng ký/hủy đăng ký
- Thống kê (số bài tập, số người tham gia, thời gian còn lại)

**Files:**
- `cli/src/app/features/contests/contest-detail/contest-detail.component.ts`
- `cli/src/app/features/contests/contest-detail/contest-detail.component.html`

### Contest Service
Xử lý tất cả API calls liên quan đến contest

**File:**
- `cli/src/app/core/services/contest.service.ts`

### Contest Model
Định nghĩa các interface và type

**File:**
- `cli/src/app/core/models/contest.model.ts`

## Luồng Hoạt Động

### 1. Xem Danh Sách Cuộc Thi
```
User -> Frontend -> API GET /contests
                 <- Response: List of contests
     <- Display contests list
```

### 2. Xem Chi Tiết Cuộc Thi
```
User -> Click contest
     -> Frontend -> API GET /contests/:id
                 <- Response: Contest details
                 -> API GET /contests/:id/problems ⭐
                 <- Response: List of problems
     <- Display contest detail with problems
```

### 3. Đăng Ký Cuộc Thi
```
User (logged in) -> Click "Tham gia"
                 -> Frontend -> API POST /contests/:id/register
                             <- Response: Success
                 <- Update UI (show "Hủy tham gia")
```

### 4. Nộp Bài Giải
```
User (registered) -> Write code
                  -> Click "Submit"
                  -> Frontend -> API POST /contests/:id/problems/:pid/submit
                              <- Response: Execution result + Score
                  <- Display result
```

## Quyền Truy Cập

### Người Dùng Chưa Đăng Nhập
- ✅ Xem danh sách cuộc thi
- ✅ Xem chi tiết cuộc thi
- ✅ Xem danh sách bài tập ⭐
- ❌ Đăng ký cuộc thi
- ❌ Nộp bài giải

### Người Dùng Đã Đăng Nhập (Chưa Đăng Ký)
- ✅ Xem danh sách cuộc thi
- ✅ Xem chi tiết cuộc thi
- ✅ Xem danh sách bài tập ⭐
- ✅ Đăng ký cuộc thi
- ❌ Nộp bài giải

### Người Dùng Đã Đăng Ký
- ✅ Xem danh sách cuộc thi
- ✅ Xem chi tiết cuộc thi
- ✅ Xem danh sách bài tập
- ✅ Hủy đăng ký (nếu chưa bắt đầu)
- ✅ Nộp bài giải (khi cuộc thi active)
- ✅ Xem bảng xếp hạng
- ✅ Xem lịch sử nộp bài

### Admin/Creator
- ✅ Tất cả quyền của người dùng
- ✅ Tạo cuộc thi mới
- ✅ Cập nhật cuộc thi (chưa bắt đầu)
- ✅ Xóa cuộc thi (chưa active)
- ✅ Thêm/xóa bài tập

## Trạng Thái Cuộc Thi

### Upcoming (Sắp Tới)
- `start_time > now`
- Có thể đăng ký/hủy đăng ký
- Không thể nộp bài

### Active (Đang Diễn Ra)
- `start_time <= now < end_time`
- Có thể đăng ký
- Không thể hủy đăng ký
- Có thể nộp bài

### Completed (Đã Kết Thúc)
- `end_time <= now`
- Không thể đăng ký/hủy đăng ký
- Không thể nộp bài
- Có thể xem kết quả

## Tính Điểm

### Điểm Bài Tập
- Mỗi bài tập có điểm số riêng (score)
- Nộp đúng: Nhận full điểm
- Nộp sai: 0 điểm
- Lỗi: 0 điểm

### Bảng Xếp Hạng
- Tổng điểm = Tổng điểm các bài đã AC
- Sắp xếp theo:
  1. Tổng điểm (cao -> thấp)
  2. Thời gian nộp bài cuối (sớm -> muộn)

## Files Quan Trọng

### Backend
```
api/src/controllers/contestController.js    - Controller xử lý logic
api/src/routes/contestRoutes.js            - Định nghĩa routes
api/src/models/Contest.js                  - Model Contest
api/src/models/ContestProblem.js           - Model ContestProblem
api/src/models/UserContest.js              - Model UserContest
api/src/models/ContestSubmission.js        - Model ContestSubmission
api/sql-scripts/001-6-contest-system.sql   - Schema database
api/sql-scripts/002-6-contest-system.sql   - Dữ liệu mẫu
```

### Frontend
```
cli/src/app/features/contests/                     - Thư mục chính
cli/src/app/features/contests/contests/            - List component
cli/src/app/features/contests/contest-detail/      - Detail component
cli/src/app/core/services/contest.service.ts       - Service
cli/src/app/core/models/contest.model.ts           - Models
```

## Lỗi Đã Sửa

### ⭐ Lỗi: Không Hiển Thị Bài Tập Khi Xem Chi Tiết Cuộc Thi
**Nguyên nhân:**
- Route yêu cầu authentication
- Controller kiểm tra registration trước khi cho xem bài tập

**Giải pháp:**
- Thay đổi route từ `authenticateToken` sang `optionalAuth`
- Xóa kiểm tra registration trong method `getContestProblems`

**Chi tiết:** Xem file `CONTEST_FIX_SUMMARY.md`

## Testing

### Chạy Test Tự Động
```bash
node test-contest-problems.js
```

### Test Thủ Công
1. Khởi động server: `cd api && npm start`
2. Khởi động frontend: `cd cli && npm start`
3. Truy cập: `http://localhost:4200/contests`
4. Click vào một cuộc thi
5. Kiểm tra danh sách bài tập có hiển thị không

## Debug
Nếu gặp vấn đề, xem file `CONTEST_DEBUG_GUIDE.md`

## Tài Liệu Liên Quan
- `CONTEST_FIX_SUMMARY.md` - Chi tiết về fix lỗi hiển thị bài tập
- `CONTEST_DEBUG_GUIDE.md` - Hướng dẫn debug
- `test-contest-problems.js` - Script test API
