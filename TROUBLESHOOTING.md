# Hướng dẫn Khắc phục Lỗi

## Lỗi: "User not found" khi load stats

### Nguyên nhân
1. Endpoint sai: Đã sửa từ `/profile` thành `/profile/me`
2. User chưa có record trong bảng `user_stats`

### Giải pháp

#### 1. Chạy migration để tạo user_stats cho users hiện tại
```bash
mysql -u root -p lfysdb < api/sql-scripts/005-create-missing-user-stats.sql
```

#### 2. Khởi động lại server
```bash
cd api
npm start
```

#### 3. Refresh trình duyệt
- Xóa cache (Ctrl+Shift+R hoặc Cmd+Shift+R)
- Đăng nhập lại nếu cần

### Kiểm tra

#### Backend
```bash
# Test API endpoint
curl -X GET http://localhost:3000/api/v1/users/profile/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response mong đợi:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "profile": { ... },
    "stats": {
      "id": 1,
      "user_id": 1,
      "xp": 0,
      "level": 1,
      "rank": 0,
      "reward_points": 0,
      ...
    }
  }
}
```

#### Frontend
1. Mở Developer Tools (F12)
2. Vào tab Console
3. Kiểm tra logs:
   - ✅ "User stats loaded" = Thành công
   - ❌ "Error loading user stats" = Còn lỗi

#### Database
```sql
-- Kiểm tra user có stats chưa
SELECT u.id, u.name, us.id as stats_id, us.reward_points, us.level
FROM users u
LEFT JOIN user_stats us ON u.id = us.user_id
WHERE u.id = YOUR_USER_ID;
```

## Lỗi: Stats không hiển thị trong header

### Nguyên nhân
1. User chưa đăng nhập
2. Stats chưa load xong
3. Component chưa subscribe đúng

### Giải pháp

#### 1. Kiểm tra authentication
```typescript
// Trong console
console.log('Is authenticated:', this.isAuthenticated);
console.log('User stats:', this.userStats);
```

#### 2. Kiểm tra service
```typescript
// Trong console
console.log('Stats service:', this.userStatsService.getUserStats());
```

#### 3. Force reload stats
```typescript
// Trong console (nếu đang ở header component)
this.userStatsService.loadUserStats().subscribe();
```

## Lỗi: "reward_points column not found"

### Nguyên nhân
Chưa chạy migration để thêm cột `reward_points`

### Giải pháp
```bash
mysql -u root -p lfysdb < api/sql-scripts/004-add-reward-points-system.sql
```

## Lỗi: Progress bar không hiển thị đúng

### Nguyên nhân
Level progress calculation có vấn đề

### Giải pháp
Kiểm tra công thức trong service:
```typescript
// XP needed for level N = N * 100
const xpForCurrentLevel = (currentLevel - 1) * 100;
const xpForNextLevel = currentLevel * 100;
```

## Lỗi: Dark mode không hoạt động

### Nguyên nhân
Tailwind dark mode chưa được cấu hình

### Giải pháp
Kiểm tra `tailwind.config.js`:
```javascript
module.exports = {
  darkMode: 'class', // hoặc 'media'
  // ...
}
```

## Lỗi: Icons không hiển thị

### Nguyên nhân
Icon library chưa được import

### Giải pháp
Kiểm tra file CSS global có import icons:
```css
/* Ví dụ với Feather Icons */
@import 'feather-icons/dist/feather.css';
```

## Tips Debug

### 1. Bật logging trong service
```typescript
loadUserStats(): Observable<any> {
  console.log('🔄 Loading user stats...');
  return this.http.get<any>(`${this.apiUrl}/profile/me`).pipe(
    tap(response => {
      console.log('✅ Stats loaded:', response);
      // ...
    }),
    catchError(error => {
      console.error('❌ Error:', error);
      // ...
    })
  );
}
```

### 2. Kiểm tra Network tab
- Mở Developer Tools > Network
- Filter: XHR
- Tìm request `/profile/me`
- Kiểm tra Status Code và Response

### 3. Kiểm tra Redux/State (nếu dùng)
```typescript
// Trong console
console.log('Current state:', this.userStatsService.userStats$.value);
```

## Liên hệ hỗ trợ

Nếu vẫn gặp lỗi, cung cấp thông tin:
1. Error message đầy đủ
2. Screenshot console
3. Network request/response
4. Database query results
