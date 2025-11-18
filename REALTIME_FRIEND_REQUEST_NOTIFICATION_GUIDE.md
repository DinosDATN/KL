# Hướng Dẫn Test Thông Báo Friend Request Realtime

## Tổng Quan

Hệ thống đã được cấu hình để người dùng nhận thông báo friend request realtime ở bất kỳ trang nào trong website, không chỉ riêng trang chat.

## Cách Hoạt Động

### 1. **Kết Nối Socket Toàn Cục**
- Socket.IO được kết nối ngay khi user đăng nhập (trong `app.component.ts`)
- User tự động join vào room `user_${userId}` để nhận thông báo cá nhân
- Kết nối được duy trì khi user di chuyển giữa các trang

### 2. **Luồng Thông Báo**
```
User A gửi friend request → Backend tạo notification → 
Backend emit socket event → User B nhận event realtime → 
Frontend reload notifications → Header badge cập nhật
```

### 3. **Các Component Liên Quan**

#### Frontend:
- **app.component.ts**: Khởi tạo socket connection khi app load
- **socket.service.ts**: Quản lý socket connection và emit/listen events
- **app-notification.service.ts**: Lắng nghe socket events và cập nhật notifications
- **header.component.ts**: Hiển thị notification badge và dropdown

#### Backend:
- **friendshipController.js**: Emit socket event khi có friend request mới
- **chatHandler.js**: Xử lý socket connection và join user vào personal room

## Cách Test

### Bước 1: Chuẩn Bị
1. Mở 2 trình duyệt khác nhau (hoặc 2 cửa sổ incognito)
2. Đăng nhập 2 tài khoản khác nhau:
   - Trình duyệt 1: User A (người gửi)
   - Trình duyệt 2: User B (người nhận)

### Bước 2: Kiểm Tra Console Logs

#### Trình duyệt User B (người nhận):
Mở Developer Console (F12) và kiểm tra các log sau:

```
✅ Khi load trang:
🚀 App component initialized
🔧 Initializing app...
🚀 Initializing socket connection from app component
👤 User: [Tên User B] (ID: [ID])
🔌 Socket connection status: CONNECTED
🔧 AppNotificationService: Initializing socket listeners
✅ AppNotificationService: Socket listeners initialized successfully
```

```
✅ Khi socket kết nối:
Connected to server
✅ User [Tên User B] (Socket ID: [ID]) joined personal notification room: user_[ID]
📊 Total sockets in room user_[ID]: 1
✅ Verified: Socket [ID] is in room user_[ID]
```

### Bước 3: Gửi Friend Request

#### Trình duyệt User A:
1. Vào trang Chat hoặc trang có chức năng gửi friend request
2. Gửi friend request đến User B

#### Console Backend (Terminal):
```
📬 Emitting friend_request_received to room: user_[ID của User B]
📊 Friendship ID: [ID], Requester: [Tên User A]
📊 Sockets in room user_[ID của User B]: 1
✅ Friend request notification sent to user [ID của User B]
```

#### Console Trình duyệt User B:
```
📬 Friend request received notification: {...}
📬 AppNotificationService: Friend request received {...}
🔄 Reloading notifications and unread count...
✅ Updated unread count: 1
✅ Reloaded 1 notifications
🔔 Showing toast notification: Lời mời kết bạn mới
```

#### UI Trình duyệt User B:
```
┌─────────────────────────────────────────┐
│ 🔔 Lời mời kết bạn mới                  │
│ [Tên User A] đã gửi lời mời kết bạn    │
│ cho bạn                                  │
└─────────────────────────────────────────┘
   ↑ Toast notification (tự động đóng sau 5s)

Header:
  🔔 (1) ← Badge đỏ hiển thị số thông báo
```

### Bước 4: Kiểm Tra UI

#### Trên Header của User B:
1. **Toast Notification**: Xuất hiện toast thông báo ở góc màn hình với:
   - Icon 🔔
   - Tiêu đề: "Lời mời kết bạn mới"
   - Nội dung: "[Tên User A] đã gửi lời mời kết bạn cho bạn"
   - Tự động đóng sau 5 giây
2. **Notification Badge**: Số thông báo chưa đọc sẽ xuất hiện (màu đỏ) trên icon notification
3. **Click vào icon notification**: Dropdown hiển thị thông báo mới với đầy đủ thông tin

### Bước 5: Test Ở Các Trang Khác Nhau

User B có thể ở bất kỳ trang nào:
- ✅ Trang chủ (/)
- ✅ Trang khóa học (/courses)
- ✅ Trang bài tập (/problems)
- ✅ Trang profile (/profile)
- ✅ Trang settings (/settings)
- ✅ Bất kỳ trang nào khác

**Kết quả mong đợi**: User B vẫn nhận được thông báo realtime ngay lập tức.

## Troubleshooting

### Vấn Đề 1: User B không nhận được thông báo

#### Kiểm tra Console User B:
```javascript
// Kiểm tra socket có kết nối không
🔌 Socket connection status: CONNECTED  // Phải là CONNECTED

// Kiểm tra user có join room không
✅ Verified: Socket [ID] is in room user_[ID]  // Phải có dòng này
```

#### Kiểm tra Backend Console:
```javascript
// Kiểm tra có socket nào trong room không
📊 Sockets in room user_[ID]: 1  // Phải > 0

// Nếu = 0, có nghĩa là user chưa kết nối socket
⚠️ WARNING: No sockets in room user_[ID]. User may not be connected.
```

**Giải pháp**:
1. Refresh trang của User B
2. Kiểm tra token có hợp lệ không (localStorage → auth_token)
3. Kiểm tra backend có chạy không
4. Kiểm tra CORS settings

### Vấn Đề 2: Socket không kết nối

#### Console User B:
```javascript
❌ Socket.IO connection error: ...
🔐 Authentication failed - check JWT token
```

**Giải pháp**:
1. Đăng xuất và đăng nhập lại
2. Xóa localStorage và thử lại
3. Kiểm tra JWT token có expired không

### Vấn Đề 3: Notification không cập nhật UI

#### Console User B:
```javascript
// Có nhận event nhưng không reload
📬 AppNotificationService: Friend request received {...}
// Nhưng không có dòng này:
🔄 Reloading notifications and unread count...
```

**Giải pháp**:
1. Kiểm tra `app-notification.service.ts` có subscribe đúng không
2. Refresh trang
3. Kiểm tra API endpoint `/api/v1/notifications` có hoạt động không

## Debug Commands

### Kiểm tra Socket Connection (Browser Console):
```javascript
// Kiểm tra socket service
const socketService = document.querySelector('app-root').__ngContext__[8].socketService;
console.log('Socket connected:', socketService.isConnected());
console.log('Current user:', socketService.getCurrentUser());
```

### Kiểm tra Notifications (Browser Console):
```javascript
// Kiểm tra notification service
const notificationService = document.querySelector('app-root').__ngContext__[8].appNotificationService;
console.log('Notifications:', notificationService.getNotifications());
console.log('Unread count:', notificationService.getUnreadCount());
```

### Test Manual Socket Event (Browser Console):
```javascript
// Emit test event (chỉ để test)
const socketService = document.querySelector('app-root').__ngContext__[8].socketService;
socketService.emit('test_event', { message: 'Hello' });
```

## Các Cải Tiến Đã Thực Hiện

### 1. **App Component** (`cli/src/app/app.component.ts`)
- ✅ Thêm log chi tiết khi khởi tạo app
- ✅ Thêm timeout để đảm bảo socket kết nối trước khi load notifications
- ✅ Subscribe socket connection status để monitor

### 2. **App Notification Service** (`cli/src/app/core/services/app-notification.service.ts`)
- ✅ Thêm log chi tiết khi nhận socket events
- ✅ Thêm error handling khi reload notifications
- ✅ Log khi socket listeners được khởi tạo

### 3. **Header Component** (`cli/src/app/shared/layout/header/header.component.ts`)
- ✅ Hiển thị toast notification khi có thông báo mới
- ✅ Toast tự động đóng sau 5 giây
- ✅ Cải thiện logic để phát hiện thông báo mới chính xác
- ✅ Thêm icon 🔔 vào toast notification

### 4. **Friendship Controller** (`api/src/controllers/friendshipController.js`)
- ✅ Kiểm tra số lượng socket trong room trước khi emit
- ✅ Warning nếu không có socket nào trong room
- ✅ Log chi tiết khi emit event

### 5. **Chat Handler** (`api/src/socket/chatHandler.js`)
- ✅ Verify socket đã join room thành công
- ✅ Log số lượng socket trong room
- ✅ Error handling nếu join room thất bại

## Kết Luận

Hệ thống đã được cấu hình để:
1. ✅ Socket kết nối ngay khi user đăng nhập
2. ✅ User join vào personal room để nhận thông báo
3. ✅ Notification service lắng nghe socket events
4. ✅ Header cập nhật realtime khi có thông báo mới
5. ✅ Toast notification hiển thị ngay khi có thông báo mới
6. ✅ Hoạt động ở mọi trang trong website

### Trải Nghiệm Người Dùng:
Khi User A gửi friend request đến User B:
1. 🔔 **Toast notification** xuất hiện ngay lập tức ở góc màn hình
2. 🔴 **Badge đỏ** hiển thị số thông báo chưa đọc trên icon notification
3. 📬 **Dropdown notification** cập nhật với thông báo mới
4. ✅ **Hoạt động ở mọi trang** - không cần phải ở trang chat

Nếu vẫn gặp vấn đề, hãy kiểm tra console logs theo hướng dẫn troubleshooting ở trên.
