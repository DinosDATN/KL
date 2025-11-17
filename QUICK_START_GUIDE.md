# Quick Start Guide - Hệ thống Điểm thưởng

## 🚀 Cài đặt nhanh (5 phút)

### Bước 1: Setup Database
```bash
# Chạy migration chính
mysql -u root -p lfysdb < api/sql-scripts/004-add-reward-points-system.sql

# Tạo stats cho users hiện tại
mysql -u root -p lfysdb < quick-fix-stats.sql
```

### Bước 2: Khởi động Backend
```bash
cd api
npm start
```

### Bước 3: Khởi động Frontend
```bash
cd cli
npm start
```

### Bước 4: Test
1. Mở trình duyệt: http://localhost:4200
2. Đăng nhập
3. Kiểm tra header - bạn sẽ thấy:
   - 💰 Điểm thưởng
   - ⚡ Level & XP
   - 🏆 Xếp hạng (nếu có)

## ✅ Checklist

- [ ] Database migration đã chạy
- [ ] Tất cả users có user_stats record
- [ ] Backend đang chạy (port 3000)
- [ ] Frontend đang chạy (port 4200)
- [ ] Đã đăng nhập thành công
- [ ] Stats hiển thị trong header

## 🐛 Gặp lỗi?

### Lỗi: "User not found"
```bash
# Chạy quick fix
mysql -u root -p lfysdb < quick-fix-stats.sql
```

### Lỗi: Stats không hiển thị
1. Mở Developer Tools (F12)
2. Xem Console có lỗi gì
3. Kiểm tra Network tab
4. Xem file TROUBLESHOOTING.md

### Lỗi: "reward_points column not found"
```bash
# Chạy lại migration
mysql -u root -p lfysdb < api/sql-scripts/004-add-reward-points-system.sql
```

## 📊 Test tính năng

### 1. Test giải bài tập
```bash
# Giải một bài tập Easy
# Kiểm tra: +10 điểm thưởng
```

### 2. Test Sudoku
```bash
# Hoàn thành Sudoku Medium trong 5 phút
# Kiểm tra: +30 điểm (base) + bonus
```

### 3. Xem lịch sử
```bash
curl -X GET http://localhost:3000/api/v1/rewards/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📱 Responsive Test

### Desktop (≥1024px)
- Stats hiển thị trong header
- 3 badges ngang

### Mobile (<1024px)
- Stats ẩn trong header
- Hiển thị trong user dropdown menu
- Layout dọc

## 🎨 Customization

### Thay đổi điểm thưởng
```sql
-- Ví dụ: Tăng điểm cho bài Hard lên 100
UPDATE reward_config 
SET config_value = 100 
WHERE config_key = 'problem_hard';
```

### Thay đổi công thức level
Sửa trong `user-stats.service.ts`:
```typescript
// Hiện tại: Level N cần N * 100 XP
// Có thể đổi thành: N * 150, N^2 * 50, etc.
```

## 📚 Documentation

- `REWARD_POINTS_SYSTEM.md` - Chi tiết backend
- `USER_STATS_UI_GUIDE.md` - Chi tiết frontend
- `TROUBLESHOOTING.md` - Khắc phục lỗi
- `IMPLEMENTATION_SUMMARY.md` - Tổng quan

## 🔗 API Endpoints

### Public
- `GET /api/v1/rewards/config` - Cấu hình điểm

### Protected
- `GET /api/v1/users/profile/me` - Profile + Stats
- `GET /api/v1/rewards/points` - Điểm hiện tại
- `GET /api/v1/rewards/history` - Lịch sử
- `GET /api/v1/rewards/stats` - Thống kê

### Admin
- `PUT /api/v1/rewards/config` - Cập nhật cấu hình
- `POST /api/v1/rewards/manual` - Thêm điểm thủ công

## 💡 Tips

1. **Auto-refresh**: Stats tự động cập nhật mỗi 30 giây
2. **Cache**: Config được cache 5 phút
3. **Transaction**: Tất cả giao dịch điểm đều dùng DB transaction
4. **One-time reward**: Bài tập chỉ thưởng 1 lần
5. **Multiple rewards**: Sudoku thưởng mỗi lần chơi

## 🎯 Next Steps

1. Thêm trang leaderboard
2. Thêm shop đổi điểm
3. Thêm nhiệm vụ hàng ngày
4. Thêm achievements system
5. Thêm social features (share, compare)
