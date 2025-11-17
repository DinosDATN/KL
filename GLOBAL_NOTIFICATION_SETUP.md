# Hệ Thống Thông Báo Toàn Cục (Global Notifications)

## Tổng Quan
Hệ thống thông báo toàn cục cho phép người dùng nhận thông báo real-time ở bất kỳ trang nào trong ứng dụng, không chỉ riêng trang chat. Thông báo được lưu vào database và có thể xem lại sau.

## Các Tính Năng

### 1. Thông Báo Real-time
- Nhận thông báo ngay lập tức qua Socket.IO
- Không cần phải ở trang chat
- Hoạt động ở mọi trang trong ứng dụng

### 2. Lưu Trữ Thông Báo
- Tất cả thông báo được lưu vào database
- Có thể xem lại thông báo cũ
- Đánh dấu đã đọc/chưa đọc
- Xóa thông báo không cần thiết

### 3. Các Loại Thông Báo
- `friend_request`: Lời mời kết bạn mới
- `friend_accepted`: Chấp nhận lời mời kết bạn
- `friend_declined`: Từ chối lời mời kết bạn
- `room_invite`: Được thêm vào nhóm chat
- `room_created`: Nhóm chat mới được tạo
- `message`: Tin nhắn mới
- `system`: Thông báo hệ thống
- `achievement`: Đạt thành tích mới
- `contest`: Thông báo về cuộc thi

## Cấu Trúc Database

### Bảng `notifications`
```sql
CREATE TABLE notifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  type ENUM(...) NOT NULL DEFAULT 'system',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSON NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Cột `data` (JSON)
Lưu trữ thông tin bổ sung:
```json
{
  "friendship_id": 123,
  "requester_id": 456,
  "room_id": 789,
  "inviter_id": 101
}
```

## API Endpoints

### GET `/api/v1/notifications`
Lấy danh sách thông báo
- Query params: `page`, `limit`, `unreadOnly`
- Response: Danh sách thông báo với pagination

### GET `/api/v1/notifications/unread-count`
Lấy số lượng thông báo chưa đọc
- Response: `{ count: number }`

### PUT `/api/v1/notifications/:notificationId/read`
Đánh dấu thông báo đã đọc

### PUT `/api/v1/notifications/read-all`
Đánh dấu tất cả thông báo đã đọc

### DELETE `/api/v1/notifications/:notificationId`
Xóa một thông báo

### DELETE `/api/v1/notifications/read/all`
Xóa tất cả thông báo đã đọc

## Cách Sử Dụng

### Backend

#### 1. Tạo Thông Báo
```javascript
const { Notification } = require('../models');

// Tạo thông báo mới
await Notification.createNotification(
  userId,           // ID người nhận
  'friend_request', // Loại thông báo
  'Lời mời kết bạn mới', // Tiêu đề
  'John Doe đã gửi lời mời kết bạn', // Nội dung
  { friendship_id: 123, requester_id: 456 } // Data bổ sung (optional)
);
```

#### 2. Emit Socket Event
```javascript
// Sau khi tạo notification trong DB, emit socket event
req.io.to(`user_${userId}`).emit('friend_request_received', {
  friendship: friendshipData,
  requester: requesterData,
  timestamp: new Date().toISOString()
});
```

### Frontend

#### 1. Inject Service
```typescript
import { AppNotificationService } from './core/services/app-notification.service';

constructor(private appNotificationService: AppNotificationService) {}
```

#### 2. Subscribe to Notifications
```typescript
// Lấy danh sách thông báo
this.appNotificationService.notifications$.subscribe(notifications => {
  console.log('Notifications:', notifications);
});

// Lấy số lượng chưa đọc
this.appNotificationService.unreadCount$.subscribe(count => {
  console.log('Unread count:', count);
});
```

#### 3. Load Notifications
```typescript
// Load thông báo
this.appNotificationService.loadNotifications().subscribe();

// Load số lượng chưa đọc
this.appNotificationService.loadUnreadCount().subscribe();
```

#### 4. Đánh Dấu Đã Đọc
```typescript
// Đánh dấu một thông báo đã đọc
this.appNotificationService.markAsRead(notificationId).subscribe();

// Đánh dấu tất cả đã đọc
this.appNotificationService.markAllAsRead().subscribe();
```

#### 5. Xóa Thông Báo
```typescript
// Xóa một thông báo
this.appNotificationService.deleteNotification(notificationId).subscribe();

// Xóa tất cả thông báo đã đọc
this.appNotificationService.deleteAllRead().subscribe();
```

## Khởi Tạo

### 1. Chạy Migration
```bash
mysql -u root -p code_judge < api/sql-scripts/003-add-notification-type-and-data.sql
```

### 2. Restart Backend
```bash
cd api
npm start
```

### 3. Frontend Tự Động Khởi Tạo
Socket và notification service được khởi tạo tự động trong `app.component.ts` khi:
- User đăng nhập
- App được load và user đã đăng nhập trước đó

## Luồng Hoạt Động

### Ví Dụ: Gửi Lời Mời Kết Bạn

1. **User A gửi lời mời cho User B**
   ```
   Frontend A → API → Database (create friendship)
   ```

2. **Backend tạo notification**
   ```javascript
   await Notification.createNotification(
     userB_id,
     'friend_request',
     'Lời mời kết bạn mới',
     'User A đã gửi lời mời kết bạn'
   );
   ```

3. **Backend emit socket event**
   ```javascript
   io.to(`user_${userB_id}`).emit('friend_request_received', data);
   ```

4. **Frontend B nhận notification**
   - Socket listener trong `AppNotificationService` nhận event
   - Tự động load lại notifications từ API
   - Update unread count
   - Hiển thị toast notification (từ `FriendshipService`)

5. **User B có thể**
   - Xem thông báo trong notification panel
   - Đánh dấu đã đọc
   - Click vào thông báo để xem chi tiết
   - Xóa thông báo

## Lưu Ý Quan Trọng

### 1. Socket Connection
- Socket được khởi tạo trong `app.component.ts`
- Tự động connect khi user đăng nhập
- Tự động disconnect khi user đăng xuất
- Chỉ cho phép 1 connection per user (disconnect old socket khi có connection mới)

### 2. Duplicate Notifications
- Mỗi notification chỉ được tạo **1 lần** trong database
- Socket event chỉ emit **1 lần** đến user
- Frontend có 2 loại notification:
  - **Toast notification**: Hiển thị tạm thời (từ `NotificationService`)
  - **App notification**: Lưu trong database (từ `AppNotificationService`)

### 3. Performance
- Sử dụng pagination khi load notifications
- Index trên `user_id`, `is_read`, `created_at`
- Chỉ load unread count khi cần thiết

### 4. Security
- Tất cả API endpoints yêu cầu authentication
- User chỉ có thể xem/sửa/xóa notifications của mình
- Socket rooms được bảo vệ bằng JWT

## Testing

### Test Case 1: Nhận Thông Báo Ở Trang Khác
1. Đăng nhập User A và User B
2. User A ở trang Home
3. User B gửi lời mời kết bạn cho User A
4. **Kiểm tra**: User A nhận thông báo ngay lập tức ở trang Home

### Test Case 2: Xem Lại Thông Báo
1. User A nhận nhiều thông báo
2. Đóng trình duyệt
3. Mở lại và đăng nhập
4. **Kiểm tra**: Tất cả thông báo vẫn còn và hiển thị đúng

### Test Case 3: Đánh Dấu Đã Đọc
1. User A có 5 thông báo chưa đọc
2. Đánh dấu 2 thông báo đã đọc
3. **Kiểm tra**: Unread count giảm từ 5 xuống 3

## Files Đã Tạo/Sửa

### Backend
- ✅ `api/src/models/Notification.js` - Model mới
- ✅ `api/src/controllers/notificationController.js` - Controller mới
- ✅ `api/src/routes/notificationRoutes.js` - Routes mới
- ✅ `api/src/app.js` - Thêm notification routes
- ✅ `api/src/models/index.js` - Export Notification model
- ✅ `api/src/controllers/friendshipController.js` - Thêm tạo notifications
- ✅ `api/src/socket/chatHandler.js` - Thêm tạo notifications cho room invite
- ✅ `api/sql-scripts/003-add-notification-type-and-data.sql` - Migration script

### Frontend
- ✅ `cli/src/app/core/services/app-notification.service.ts` - Service mới
- ✅ `cli/src/app/app.component.ts` - Khởi tạo socket và notifications

## Tích Hợp UI (Bước Tiếp Theo)

Để hiển thị notifications trong UI, bạn cần:

1. **Tạo Notification Bell Icon** trong header/navbar
   - Hiển thị unread count badge
   - Click để mở notification panel

2. **Tạo Notification Panel Component**
   - Danh sách notifications
   - Mark as read button
   - Delete button
   - Load more (pagination)

3. **Tạo Notification Item Component**
   - Hiển thị icon theo type
   - Hiển thị title và message
   - Hiển thị thời gian
   - Click để navigate đến trang liên quan

Ví dụ code sẽ được cung cấp trong file riêng nếu cần.
