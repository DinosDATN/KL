# 🏆 Tính Năng: Bảng Xếp Hạng Cuộc Thi

## 🎯 Mô Tả
Hiển thị bảng xếp hạng (leaderboard) cho từng cuộc thi, cho phép người dùng xem thứ hạng và điểm số của tất cả người tham gia.

## ✅ Tính Năng Đã Thêm

### 1. Nút "Bảng Xếp Hạng" Trong Contest Detail
**File:** `cli/src/app/features/contests/contest-detail/contest-detail.component.html`

**Vị trí:** Ở header của contest, bên cạnh nút "Tham gia cuộc thi"

**Hiển thị:**
- 🟣 Nút màu tím với icon biểu đồ cột
- 📊 Text "Bảng xếp hạng"
- ✅ Hiển thị cho tất cả mọi người (không cần đăng nhập)

### 2. Trang Leaderboard
**Route:** `/contests/:id/leaderboard`

**Component:** `ContestLeaderboardComponent`

**Hiển thị:**
- 🎨 Header gradient tím-xanh đẹp mắt
- 📋 Bảng xếp hạng với thông tin đầy đủ
- 🥇🥈🥉 Icon huy chương cho top 3
- 👤 Avatar và thông tin người dùng
- 📊 Điểm số, số bài nộp, thời gian nộp cuối

### 3. Cách Tính Điểm
**Logic:**
- Điểm số = Tổng điểm các bài đã AC (Accepted)
- Xếp hạng theo:
  1. Điểm số (cao → thấp)
  2. Thời gian nộp bài cuối (sớm → muộn)
- Chỉ tính bài nộp có status = "accepted"

## 📋 Cấu Trúc Dữ Liệu

### ContestLeaderboardEntry
```typescript
interface ContestLeaderboardEntry {
  user_id: number;
  total_score: number;
  submission_count: number;
  last_submission: string;
  rank: number;
  User: {
    id: number;
    name: string;
    email: string;
    avatar_url: string;
  };
}
```

### API Response
```json
{
  "success": true,
  "data": [
    {
      "user_id": 1,
      "total_score": 450,
      "submission_count": 5,
      "last_submission": "2024-11-18T10:30:00Z",
      "rank": 1,
      "User": {
        "id": 1,
        "name": "Nguyễn Văn A",
        "email": "user@example.com",
        "avatar_url": "https://..."
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_items": 10,
    "items_per_page": 50
  }
}
```

## 🎨 UI/UX Design

### Header Section
```
┌─────────────────────────────────────────────────┐
│ 🏆 Bảng Xếp Hạng                                │
│    Weekly Coding Challenge                      │
│                                                  │
│ [Đang diễn ra] 10 người tham gia               │
└─────────────────────────────────────────────────┘
```

### Leaderboard Table
```
┌──────┬────────────────────┬────────┬─────────┬──────────────┐
│ Hạng │ Người tham gia     │ Điểm   │ Bài nộp │ Lần nộp cuối │
├──────┼────────────────────┼────────┼─────────┼──────────────┤
│ 🥇   │ 👤 Nguyễn Văn A    │  450   │    5    │ 18/11 10:30  │
│      │    user@email.com  │ điểm   │ bài nộp │              │
├──────┼────────────────────┼────────┼─────────┼──────────────┤
│ 🥈   │ 👤 Trần Thị B      │  380   │    4    │ 18/11 11:00  │
│      │    user2@email.com │ điểm   │ bài nộp │              │
├──────┼────────────────────┼────────┼─────────┼──────────────┤
│ 🥉   │ 👤 Lê Văn C        │  320   │    3    │ 18/11 09:45  │
│      │    user3@email.com │ điểm   │ bài nộp │              │
└──────┴────────────────────┴────────┴─────────┴──────────────┘
```

### Top 3 Styling
- 🥇 **Rank 1:** Màu vàng (gold), border vàng
- 🥈 **Rank 2:** Màu xám (silver), border xám
- 🥉 **Rank 3:** Màu cam (bronze), border cam
- **Rank 4+:** Màu xanh dương, border xám

## 🚀 Luồng Hoạt Động

### Bước 1: Xem Contest Detail
```
User -> /contests/:id
     -> Thấy nút "Bảng xếp hạng"
```

### Bước 2: Click Nút "Bảng Xếp Hạng"
```
User -> Click "Bảng xếp hạng"
     -> Navigate: /contests/:id/leaderboard
```

### Bước 3: Xem Leaderboard
```
Frontend -> API: GET /api/v1/contests/:id/leaderboard
         <- Response: Leaderboard data
         -> Hiển thị bảng xếp hạng
```

### Bước 4: Quay Lại Contest
```
User -> Click "Quay lại cuộc thi"
     -> Navigate: /contests/:id
```

## 📊 API Endpoint

### Get Contest Leaderboard
```
GET /api/v1/contests/:id/leaderboard?page=1&limit=50

Response:
{
  "success": true,
  "data": [
    {
      "user_id": 1,
      "total_score": 450,
      "submission_count": 5,
      "last_submission": "2024-11-18T10:30:00Z",
      "rank": 1,
      "User": {
        "id": 1,
        "name": "Nguyễn Văn A",
        "email": "user@example.com",
        "avatar_url": "https://..."
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_items": 10,
    "items_per_page": 50
  }
}
```

## 🔐 Quyền Truy Cập

### Xem Bảng Xếp Hạng
- ✅ Mọi người (không cần đăng nhập)
- ✅ Không cần đăng ký cuộc thi
- ✅ Có thể xem ở mọi trạng thái contest (upcoming, active, completed)

### Lý Do
- Tăng tính minh bạch
- Khuyến khích cạnh tranh lành mạnh
- Cho phép người chưa tham gia xem trước

## 📁 Files Đã Thay Đổi

### Frontend Components
1. **`cli/src/app/features/contests/contest-detail/contest-detail.component.html`**
   - Thêm nút "Bảng xếp hạng"
   - Styling với màu tím

2. **`cli/src/app/features/contests/contest-detail/contest-detail.component.ts`**
   - Thêm method `onViewLeaderboard()`

3. **`cli/src/app/features/contests/components/contest-leaderboard/contest-leaderboard.component.ts`**
   - Implement đầy đủ logic leaderboard
   - Load contest info và leaderboard data
   - Styling cho top 3

4. **`cli/src/app/features/contests/components/contest-leaderboard/contest-leaderboard.component.html`**
   - Template đầy đủ với bảng xếp hạng
   - Header gradient đẹp mắt
   - Icon huy chương cho top 3
   - Info box giải thích cách tính điểm

5. **`cli/src/app/app.routes.ts`**
   - Thêm route `/contests/:id/leaderboard`

## 🧪 Testing

### Test Case 1: Xem Leaderboard
1. Truy cập `/contests/1`
2. Click nút "Bảng xếp hạng"
3. Kiểm tra:
   - [ ] Navigate đến `/contests/1/leaderboard`
   - [ ] Hiển thị header với tên contest
   - [ ] Hiển thị bảng xếp hạng

### Test Case 2: Top 3 Styling
1. Xem leaderboard có ít nhất 3 người
2. Kiểm tra:
   - [ ] Rank 1 có icon 🥇 và màu vàng
   - [ ] Rank 2 có icon 🥈 và màu xám
   - [ ] Rank 3 có icon 🥉 và màu cam
   - [ ] Rank 4+ có số thứ tự và màu xanh

### Test Case 3: Empty State
1. Xem leaderboard của contest chưa có submission
2. Kiểm tra:
   - [ ] Hiển thị empty state
   - [ ] Icon và text "Chưa có dữ liệu"
   - [ ] Nút "Quay lại cuộc thi"

### Test Case 4: User Info
1. Xem leaderboard
2. Kiểm tra mỗi entry hiển thị:
   - [ ] Avatar user
   - [ ] Tên user
   - [ ] Email user
   - [ ] Điểm số
   - [ ] Số bài nộp
   - [ ] Thời gian nộp cuối

### Test Case 5: Quay Lại
1. Trong leaderboard, click "Quay lại cuộc thi"
2. Kiểm tra:
   - [ ] Navigate về `/contests/:id`
   - [ ] Hiển thị trang contest detail

### Test Case 6: Responsive
1. Mở DevTools, chuyển sang mobile view
2. Kiểm tra:
   - [ ] Bảng xếp hạng responsive
   - [ ] Có thể scroll ngang nếu cần
   - [ ] Nút và text hiển thị tốt

## 💡 Tính Năng Tương Lai

### 1. Real-time Updates
Cập nhật leaderboard real-time khi có submission mới

### 2. Filter & Search
- Tìm kiếm user trong leaderboard
- Filter theo điểm số, số bài nộp

### 3. User Highlight
Highlight dòng của current user trong leaderboard

### 4. Problem-wise Breakdown
Xem chi tiết điểm số từng bài tập

### 5. Export Leaderboard
Export leaderboard ra CSV/PDF

### 6. Historical Leaderboard
Xem leaderboard tại các thời điểm khác nhau trong contest

## 🎉 Kết Luận

Tính năng bảng xếp hạng đã được implement hoàn chỉnh với:
- ✅ UI/UX đẹp mắt và trực quan
- ✅ Hiển thị đầy đủ thông tin
- ✅ Styling đặc biệt cho top 3
- ✅ Empty state và error handling
- ✅ Responsive design
- ✅ Navigation mượt mà

Người dùng giờ có thể xem bảng xếp hạng của cuộc thi để theo dõi thứ hạng và cạnh tranh!
