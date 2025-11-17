# Triển Khai UI Notification trong Header

## Tổng Quan
Đã tích hợp hệ thống notification vào header với các tính năng:
- ✅ Hiển thị số lượng thông báo chưa đọc (badge)
- ✅ Toast notification khi có thông báo mới
- ✅ Notification panel với danh sách thông báo
- ✅ Đánh dấu đã đọc/chưa đọc
- ✅ Xóa thông báo
- ✅ Click vào thông báo để navigate đến trang liên quan
- ✅ Icon và màu sắc theo loại thông báo
- ✅ Hiển thị thời gian relative (vừa xong, 5 phút trước, etc.)

## Các Tính Năng

### 1. Notification Bell Icon
- Hiển thị icon chuông ở header (chỉ khi đã đăng nhập)
- Badge màu đỏ hiển thị số lượng thông báo chưa đọc
- Badge hiển thị "99+" nếu có hơn 99 thông báo

### 2. Toast Notification
- Tự động hiển thị toast khi có thông báo mới
- Toast hiển thị title và message của thông báo
- Tự động ẩn sau 5 giây

### 3. Notification Panel
- Click vào bell icon để mở/đóng panel
- Hiển thị danh sách thông báo mới nhất
- Scroll được nếu có nhiều thông báo
- Mỗi thông báo có:
  - Icon theo loại (user-plus, user-check, users, etc.)
  - Màu sắc theo loại (blue, green, purple, etc.)
  - Title và message
  - Thời gian relative
  - Nút xóa (hiện khi hover)
  - Background khác biệt cho thông báo chưa đọc

### 4. Tương Tác
- **Click vào thông báo**: Đánh dấu đã đọc và navigate đến trang liên quan
- **Click "Đánh dấu tất cả đã đọc"**: Đánh dấu tất cả thông báo đã đọc
- **Click nút X**: Xóa thông báo
- **Click bên ngoài panel**: Đóng panel

## Icon và Màu Sắc Theo Loại

| Loại Thông Báo | Icon | Màu Sắc | Background |
|----------------|------|---------|------------|
| friend_request | user-plus | Blue | Blue-100 |
| friend_accepted | user-check | Green | Green-100 |
| friend_declined | user-x | Red | Red-100 |
| room_invite | users | Purple | Purple-100 |
| room_created | message-circle | Indigo | Indigo-100 |
| message | mail | Yellow | Yellow-100 |
| system | info | Gray | Gray-100 |
| achievement | award | Orange | Orange-100 |
| contest | trophy | Pink | Pink-100 |

## Navigation Logic

Khi click vào thông báo, sẽ navigate đến:

```typescript
switch (notification.type) {
  case 'friend_request':
  case 'friend_accepted':
    // Navigate to chat page, friends tab
    this.router.navigate(['/chat'], { queryParams: { tab: 'friends' } });
    break;
    
  case 'room_invite':
  case 'room_created':
    // Navigate to chat page, specific room
    this.router.navigate(['/chat'], { queryParams: { room: notification.data.room_id } });
    break;
    
  default:
    // Do nothing
    break;
}
```

## Thời Gian Hiển Thị

Hàm `getTimeAgo()` chuyển đổi timestamp thành text dễ đọc:

- < 60 giây: "Vừa xong"
- < 60 phút: "X phút trước"
- < 24 giờ: "X giờ trước"
- < 7 ngày: "X ngày trước"
- >= 7 ngày: Hiển thị ngày tháng (dd/mm/yyyy)

## Luồng Hoạt Động

### Khi User Đăng Nhập
1. `app.component.ts` khởi tạo socket connection
2. `app.component.ts` load notifications và unread count
3. Header component subscribe vào `appNotificationService.notifications$` và `unreadCount$`
4. Header hiển thị badge với số lượng chưa đọc

### Khi Có Thông Báo Mới
1. Backend tạo notification trong database
2. Backend emit socket event đến user
3. `AppNotificationService` nhận socket event
4. Service tự động reload notifications từ API
5. Service update unread count
6. Header component nhận update qua subscription
7. Header hiển thị toast notification (nếu unread count tăng)
8. Badge cập nhật số lượng mới

### Khi User Click Vào Notification Bell
1. Toggle `isNotificationOpen`
2. Hiển thị notification panel
3. User có thể:
   - Click vào thông báo → Mark as read + Navigate
   - Click "Đánh dấu tất cả đã đọc" → Mark all as read
   - Click nút X → Delete notification
   - Click bên ngoài → Close panel

## Code Structure

### Header Component
```typescript
// State
notifications: AppNotification[] = [];
unreadCount = 0;
isNotificationOpen = false;
previousUnreadCount = 0;

// Subscriptions
private notificationSubscription?: Subscription;
private unreadCountSubscription?: Subscription;

// Methods
subscribeToNotifications()      // Subscribe to service observables
unsubscribeFromNotifications()  // Cleanup subscriptions
toggleNotification()            // Open/close panel
markAllAsRead()                 // Mark all as read
markAsRead(notification)        // Mark single as read
removeNotification(id)          // Delete notification
onNotificationClick(notification) // Handle click
getNotificationIcon(type)       // Get icon name
getNotificationColor(type)      // Get color class
getTimeAgo(dateString)          // Format time
```

### Template Structure
```html
<!-- Notification Bell -->
<button (click)="toggleNotification()">
  <i class="icon-bell"></i>
  <span *ngIf="unreadCount > 0">{{ unreadCount }}</span>
</button>

<!-- Notification Panel -->
<div *ngIf="isNotificationOpen">
  <!-- Header with "Mark all as read" -->
  <div>...</div>
  
  <!-- Notification List -->
  <div *ngFor="let notification of notifications">
    <!-- Icon, Title, Message, Time, Delete button -->
  </div>
  
  <!-- Footer -->
  <div>...</div>
</div>
```

## Styling

### CSS Classes
- `.line-clamp-2`: Giới hạn text 2 dòng
- `.group`: Container cho hover effects
- `.group-hover:opacity-100`: Hiện delete button khi hover
- `.animate-fade-in`: Animation cho panel
- `.animate-pulse-badge`: Pulse animation cho badge (optional)

### Responsive
- Panel width: `w-96` (384px)
- Max height: `max-h-96` (384px) với scroll
- Mobile: Notification bell vẫn hiển thị đầy đủ

## Testing

### Test Case 1: Hiển Thị Badge
1. Đăng nhập
2. Có 5 thông báo chưa đọc
3. **Kiểm tra**: Badge hiển thị số "5"

### Test Case 2: Toast Notification
1. User A đang ở trang Home
2. User B gửi lời mời kết bạn
3. **Kiểm tra**: Toast hiển thị "Lời mời kết bạn mới" từ User B

### Test Case 3: Click Notification
1. Mở notification panel
2. Click vào thông báo "friend_request"
3. **Kiểm tra**: 
   - Thông báo được đánh dấu đã đọc
   - Navigate đến /chat?tab=friends
   - Badge giảm 1

### Test Case 4: Mark All As Read
1. Có 5 thông báo chưa đọc
2. Click "Đánh dấu tất cả đã đọc"
3. **Kiểm tra**:
   - Tất cả thông báo được đánh dấu đã đọc
   - Badge biến mất (unreadCount = 0)

### Test Case 5: Delete Notification
1. Hover vào thông báo
2. Click nút X
3. **Kiểm tra**:
   - Thông báo bị xóa khỏi danh sách
   - Badge giảm 1 (nếu thông báo chưa đọc)

## Customization

### Thay Đổi Màu Sắc
Sửa trong `getNotificationColor()`:
```typescript
const colorMap: { [key: string]: string } = {
  'friend_request': 'text-blue-500',  // Đổi thành màu khác
  // ...
};
```

### Thay Đổi Icon
Sửa trong `getNotificationIcon()`:
```typescript
const iconMap: { [key: string]: string } = {
  'friend_request': 'user-plus',  // Đổi thành icon khác
  // ...
};
```

### Thay Đổi Navigation
Sửa trong `onNotificationClick()`:
```typescript
switch (notification.type) {
  case 'friend_request':
    this.router.navigate(['/your-custom-route']);
    break;
}
```

### Thay Đổi Toast Duration
Sửa trong `subscribeToNotifications()`:
```typescript
this.notificationService.info(
  latestNotification.title,
  latestNotification.message,
  10000  // 10 giây thay vì 5 giây
);
```

## Troubleshooting

### Badge Không Hiển Thị
- Kiểm tra user đã đăng nhập chưa
- Kiểm tra `unreadCount > 0`
- Kiểm tra subscription đã được setup chưa

### Toast Không Hiển Thị
- Kiểm tra `NotificationService` đã được inject chưa
- Kiểm tra `previousUnreadCount` có được khởi tạo đúng không
- Kiểm tra logic trong `subscribeToNotifications()`

### Notification Không Load
- Kiểm tra API endpoint `/api/v1/notifications`
- Kiểm tra authentication token
- Kiểm tra console logs

### Click Notification Không Navigate
- Kiểm tra `notification.data` có đúng format không
- Kiểm tra routes đã được define chưa
- Kiểm tra console logs

## Files Đã Sửa

### Frontend
- ✅ `cli/src/app/shared/layout/header/header.component.ts`
  - Import AppNotificationService và NotificationService
  - Subscribe to notifications và unread count
  - Implement các methods xử lý notifications
  - Implement toast notification logic

- ✅ `cli/src/app/shared/layout/header/header.component.html`
  - Thêm notification bell với badge
  - Thêm notification panel
  - Thêm icon và styling cho từng loại notification

- ✅ `cli/src/app/shared/layout/header/header.component.css`
  - Thêm animation cho panel
  - Thêm styling cho notification items
  - Thêm hover effects

## Next Steps (Optional)

1. **Notification Settings**
   - Cho phép user bật/tắt từng loại notification
   - Cho phép user chọn notification sound 

2. **Notification Sound**
   - Phát âm thanh khi có notification mới
   - Cho phép user chọn âm thanh

3. **Desktop Notifications**
   - Sử dụng Web Notification API
   - Hiển thị notification ngay cả khi tab không active

4. **Notification History**
   - Trang riêng để xem tất cả notifications
   - Filter theo loại, ngày tháng
   - Search notifications

5. **Mark as Read on Scroll**
   - Tự động mark as read khi scroll qua notification

## Kết Luận

Hệ thống notification UI đã được tích hợp hoàn chỉnh vào header với đầy đủ tính năng:
- Real-time updates qua Socket.IO
- Toast notifications cho thông báo mới
- Badge hiển thị số lượng chưa đọc
- Notification panel với đầy đủ tương tác
- Navigation đến trang liên quan
- Responsive và accessible

User giờ có thể nhận và quản lý thông báo ở bất kỳ trang nào trong ứng dụng!
