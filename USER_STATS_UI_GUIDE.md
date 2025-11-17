# Hướng dẫn UI Hiển thị Thông tin Người dùng

## Tổng quan

Hệ thống hiển thị thông tin người dùng bao gồm:
- **Điểm thưởng (Reward Points)**: Điểm tích lũy từ các hoạt động
- **Level & XP**: Cấp độ và kinh nghiệm
- **Xếp hạng (Rank)**: Thứ hạng so với người dùng khác

## Vị trí hiển thị

### 1. Desktop (màn hình lớn ≥ 1024px)
Hiển thị ở **header phía bên phải**, trước nút theme toggle:
- Điểm thưởng (màu vàng)
- Level & XP với thanh progress (màu xanh)
- Xếp hạng (màu tím) - chỉ hiển thị nếu có

### 2. Mobile & Tablet
Hiển thị trong **User Dropdown Menu** khi click vào avatar:
- Thông tin đầy đủ với layout dọc
- Dễ đọc và tương tác trên màn hình nhỏ

## Files đã tạo/cập nhật

### Models
- `cli/src/app/core/models/user-stats.model.ts`
  - Interface `UserStats`
  - Interface `LevelProgress`

### Services  
- `cli/src/app/core/services/user-stats.service.ts`
  - Load user stats từ API
  - Tính toán level progress
  - Auto-refresh mỗi 30 giây

### Components
- `cli/src/app/shared/layout/header/header.component.ts`
  - Subscribe to user stats
  - Load stats khi authenticated
  - Clear stats khi logout

- `cli/src/app/shared/layout/header/header.component.html`
  - Desktop stats display
  - Mobile stats in dropdown


## Công thức tính Level

```typescript
// XP cần cho level N = N * 100
// Ví dụ:
// Level 1 -> 2: cần 100 XP
// Level 2 -> 3: cần 200 XP  
// Level 3 -> 4: cần 300 XP
```

## Màu sắc & Icons

### Điểm thưởng (Reward Points)
- **Icon**: `icon-award` (huy chương)
- **Màu**: Vàng/Amber gradient
- **Background**: `from-yellow-50 to-amber-50`
- **Border**: `border-yellow-200`

### Level & XP
- **Icon**: `icon-zap` (tia chớp)
- **Màu**: Xanh/Indigo gradient
- **Background**: `from-blue-50 to-indigo-50`
- **Progress bar**: `from-blue-500 to-indigo-500`

### Xếp hạng (Rank)
- **Icon**: `icon-trophy` (cúp)
- **Màu**: Tím/Pink gradient
- **Background**: `from-purple-50 to-pink-50`
- **Border**: `border-purple-200`

## API Endpoints sử dụng

### 1. Get User Profile (bao gồm stats)
```
GET /api/v1/users/profile
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "profile": { ... },
    "stats": {
      "id": 1,
      "user_id": 1,
      "xp": 350,
      "level": 3,
      "rank": 15,
      "reward_points": 175,
      "problems_solved": 12,
      ...
    }
  }
}
```

### 2. Get Reward Points
```
GET /api/v1/rewards/points
Authorization: Bearer <token>
```

## Cách test

1. **Đăng nhập vào hệ thống**
2. **Kiểm tra header**:
   - Desktop: Xem stats hiển thị bên phải header
   - Mobile: Click avatar và xem stats trong dropdown

3. **Test auto-update**:
   - Giải một bài tập
   - Chơi Sudoku
   - Đợi 30 giây hoặc refresh trang
   - Stats sẽ tự động cập nhật

## Responsive Design

### Desktop (≥ 1024px)
```html
<div class="hidden lg:flex items-center gap-3">
  <!-- Stats display -->
</div>
```

### Mobile/Tablet (< 1024px)
Stats được ẩn ở header, hiển thị trong user dropdown menu

## Dark Mode Support

Tất cả components đều hỗ trợ dark mode với:
- `dark:` prefix cho Tailwind classes
- Màu sắc tối ưu cho cả light và dark theme
- Contrast tốt cho khả năng đọc

## Animations

- **Progress bar**: `transition-all duration-300`
- **Hover effects**: Smooth transitions
- **Loading states**: Skeleton hoặc placeholder (có thể thêm sau)
