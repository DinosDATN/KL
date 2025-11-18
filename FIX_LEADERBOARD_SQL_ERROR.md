# 🔧 Sửa Lỗi SQL: Column 'score' is ambiguous

## ❌ Lỗi
```
SequelizeDatabaseError: Column 'score' in field list is ambiguous
```

## 🔍 Nguyên Nhân
Column `score` xuất hiện trong cả 2 bảng:
- `contest_submissions.score` - Điểm số của submission
- `contest_problems.score` - Điểm số tối đa của bài tập

Khi JOIN 2 bảng này, SQL không biết dùng column nào.

## ✅ Giải Pháp
Chỉ định rõ table name cho column `score`:

### Trước (Sai):
```javascript
[Contest.sequelize.fn('SUM', Contest.sequelize.col('score')), 'total_score']
```

### Sau (Đúng):
```javascript
[Contest.sequelize.fn('SUM', Contest.sequelize.col('ContestSubmission.score')), 'total_score']
```

## 📝 File Đã Sửa
`api/src/controllers/contestController.js` - Method `getContestLeaderboard`

### Các Thay Đổi:
1. `Contest.sequelize.col('score')` → `Contest.sequelize.col('ContestSubmission.score')`
2. `Contest.sequelize.col('submitted_at')` → `Contest.sequelize.col('ContestSubmission.submitted_at')`

## 🚀 Khởi Động Lại Server
```bash
# Dừng server (Ctrl+C)
cd api
npm start
```

## ✅ Kiểm Tra
```bash
# Test API
curl http://localhost:3000/api/v1/contests/1/leaderboard

# Hoặc test trên frontend
1. Truy cập /contests/1
2. Click "Bảng xếp hạng"
3. Kiểm tra leaderboard hiển thị
```

## 🎉 Kết Quả
Sau khi sửa và khởi động lại server, leaderboard sẽ hoạt động bình thường!
