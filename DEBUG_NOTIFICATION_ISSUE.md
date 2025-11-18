# Debug: Thông Báo Không Cập Nhật Realtime

## Vấn Đề
Thông báo không cập nhật realtime sau khi thay đổi code.

## Các Thay Đổi Đã Thực Hiện

### 1. Sửa Socket Disconnect Khi Rời Trang Chat ⭐ QUAN TRỌNG
**File**: `cli/src/app/features/chat/chat.component.ts`

**Vấn đề cũ**: Socket bị disconnect khi rời khỏi trang chat.
```typescript
ngOnDestroy(): void {
  this.chatService.disconnect(); // ❌ Gây mất kết nối socket
}
```

**Giải pháp mới**: KHÔNG disconnect socket khi rời trang chat.
```typescript
ngOnDestroy(): void {
  // DO NOT disconnect socket here!
  // Socket connection should persist across pages to receive notifications
  // Only disconnect when user logs out (handled in app.component.ts)
}
```

**Lý do**: Socket cần duy trì kết nối để nhận thông báo ở tất cả các trang, không chỉ trang chat.

### 2. Cập Nhật Chat Service
**File**: `cli/src/app/core/services/chat.service.ts`

**Thay đổi 1**: Kiểm tra socket đã kết nối trước khi connect lại
```typescript
if (!this.socketService.isConnected()) {
  console.log('✅ Starting Socket.IO connection from chat service...');
  this.socketService.connect(token, user);
} else {
  console.log('✅ Socket already connected, skipping connection');
}
```

**Thay đổi 2**: Deprecate method disconnect()
```typescript
disconnect(): void {
  console.warn('⚠️ ChatService.disconnect() is deprecated!');
  // Do NOT disconnect socket here
}
```

### 3. Sửa Logic Toast Notification
**File**: `cli/src/app/shared/layout/header/header.component.ts`

**Vấn đề cũ**: Logic kiểm tra `previousUnreadCount >= 0` có thể gây nhầm lẫn.

**Giải pháp mới**:
```typescript
const isFirstLoad = this.previousUnreadCount === -1;

if (!isFirstLoad && count > this.previousUnreadCount) {
  // Show toast notification
  console.log(`📊 Unread count increased: ${this.previousUnreadCount} → ${count}`);
  // ... show toast
}
```

### 4. Sửa Thứ Tự Reload Notifications
**File**: `cli/src/app/core/services/app-notification.service.ts`

**Vấn đề cũ**: Reload unread count và notifications song song, có thể gây race condition.

**Giải pháp mới**: Reload notifications TRƯỚC, sau đó mới reload unread count.
```typescript
this.loadNotifications().subscribe({
  next: (notifications) => {
    console.log(`✅ Reloaded ${notifications.length} notifications`);
    // Then reload unread count to trigger toast
    this.loadUnreadCount().subscribe({
      next: (count) => console.log(`✅ Updated unread count: ${count}`)
    });
  }
});
```

**Lý do**: Khi unread count thay đổi, header component cần có notifications list đã được cập nhật để hiển thị toast đúng.

## Các Bước Debug

### Bước 1: Clear Cache và Restart

```bash
# 1. Stop frontend
Ctrl + C

# 2. Clear Angular cache
cd cli
rmdir /s /q .angular
rmdir /s /q node_modules\.cache

# 3. Restart frontend
npm start
```

### Bước 2: Hard Refresh Browser

1. Mở DevTools (F12)
2. Right-click vào nút Refresh
3. Chọn "Empty Cache and Hard Reload"
4. Hoặc: Ctrl + Shift + R (Windows) / Cmd + Shift + R (Mac)

### Bước 3: Kiểm Tra Console Logs

#### Khi Load Trang (User B):
```
✅ Logs mong đợi:
🚀 App component initialized
🔧 Initializing app...
🚀 Initializing socket connection from app component
👤 User: [Tên] (ID: [ID])
Connected to server
🔌 Socket connection status: CONNECTED
🔧 AppNotificationService: Initializing socket listeners
✅ AppNotificationService: Socket listeners initialized successfully
📬 Loading notifications
✅ Loaded X notifications
📊 Unread notifications: X
📊 First load: initializing unread count to X
```

#### Khi Nhận Friend Request (User B):
```
✅ Logs mong đợi:
📬 Friend request received notification: {...}
📬 AppNotificationService: Friend request received {...}
🔄 Reloading notifications and unread count...
✅ Reloaded X notifications
✅ Updated unread count: X
📊 Unread count increased: Y → X
🔔 Showing toast notification: Lời mời kết bạn mới
```

### Bước 4: Kiểm Tra Network Tab

1. Mở DevTools → Network tab
2. Filter: XHR
3. Khi nhận friend request, phải thấy 2 requests:
   - `GET /api/v1/notifications?page=1&limit=20`
   - `GET /api/v1/notifications/unread-count`

### Bước 5: Kiểm Tra Socket Connection

#### Browser Console (User B):
```javascript
// Kiểm tra socket service
const appRoot = document.querySelector('app-root');
const context = appRoot.__ngContext__;

// Find socket service
let socketService = null;
for (let i = 0; i < context.length; i++) {
  if (context[i] && context[i].socketService) {
    socketService = context[i].socketService;
    break;
  }
}

console.log('Socket connected:', socketService.isConnected());
console.log('Current user:', socketService.getCurrentUser());
```

**Kết quả mong đợi**:
```
Socket connected: true
Current user: { id: X, name: "...", ... }
```

### Bước 6: Test Manual Socket Event

#### Browser Console (User B):
```javascript
// Simulate friend request received event
const socketService = /* get from step 5 */;

// Manually trigger the observable
socketService.friendRequestReceivedSubject.next({
  friendship: { id: 999 },
  requester: { id: 1, name: "Test User" },
  timestamp: new Date().toISOString()
});
```

**Kết quả mong đợi**: Thấy logs reload notifications và toast hiển thị.

## Các Vấn Đề Thường Gặp

### Vấn Đề 0: Chỉ Nhận Thông Báo Khi Ở Trang Chat ⭐ PHỔ BIẾN

**Triệu chứng**:
- Ở trang chat: Nhận thông báo realtime ✅
- Ở trang khác: KHÔNG nhận thông báo ❌
- Khi quay lại trang chat: Lại nhận được ✅

**Nguyên nhân**: Socket bị disconnect khi rời khỏi trang chat.

**Giải pháp**:
1. Kiểm tra `chat.component.ts` → `ngOnDestroy`:
   ```typescript
   // ❌ SAI - Không được disconnect socket
   ngOnDestroy(): void {
     this.chatService.disconnect(); // Xóa dòng này!
   }
   
   // ✅ ĐÚNG - Giữ socket kết nối
   ngOnDestroy(): void {
     // DO NOT disconnect socket here!
   }
   ```

2. Restart frontend sau khi sửa
3. Hard refresh browser (Ctrl + Shift + R)
4. Test lại: Vào trang chat → Rời khỏi → Gửi friend request → Phải nhận được thông báo

### Vấn Đề 1: Socket Không Kết Nối

**Triệu chứng**:
```
❌ Socket.IO connection error: ...
🔐 Authentication failed - check JWT token
```

**Giải pháp**:
1. Đăng xuất và đăng nhập lại
2. Kiểm tra localStorage → auth_token
3. Kiểm tra backend có chạy không
4. Kiểm tra CORS settings

### Vấn Đề 2: Socket Kết Nối Nhưng Không Nhận Event

**Triệu chứng**:
- Socket connected: true
- Nhưng không thấy log "📬 Friend request received notification"

**Giải pháp**:
1. Kiểm tra backend console xem có emit event không:
   ```
   📬 Emitting friend_request_received to room: user_X
   📊 Sockets in room user_X: 1
   ✅ Friend request notification sent to user X
   ```

2. Nếu backend emit nhưng frontend không nhận:
   - Kiểm tra socket có join room `user_${userId}` không
   - Restart cả frontend và backend
   - Clear cache và hard refresh

### Vấn Đề 3: Nhận Event Nhưng Không Reload Notifications

**Triệu chứng**:
```
✅ Thấy log:
📬 AppNotificationService: Friend request received {...}
🔄 Reloading notifications and unread count...

❌ Nhưng không thấy:
✅ Reloaded X notifications
✅ Updated unread count: X
```

**Giải pháp**:
1. Kiểm tra API endpoint có hoạt động không:
   ```javascript
   // Browser console
   const token = localStorage.getItem('auth_token');
   fetch('http://localhost:3000/api/v1/notifications/unread-count', {
     headers: { 'Authorization': `Bearer ${token}` }
   }).then(r => r.json()).then(console.log);
   ```

2. Kiểm tra Network tab xem có request nào bị lỗi không

### Vấn Đề 4: Reload Notifications Nhưng Không Hiển Thị Toast

**Triệu chứng**:
```
✅ Thấy log:
✅ Reloaded X notifications
✅ Updated unread count: X

❌ Nhưng không thấy:
📊 Unread count increased: Y → X
🔔 Showing toast notification: ...
```

**Giải pháp**:
1. Kiểm tra `previousUnreadCount`:
   ```javascript
   // Browser console
   const header = document.querySelector('app-header');
   const component = header.__ngContext__.find(c => c.previousUnreadCount !== undefined);
   console.log('previousUnreadCount:', component.previousUnreadCount);
   console.log('unreadCount:', component.unreadCount);
   ```

2. Nếu `previousUnreadCount === -1`:
   - Đây là lần đầu load, không hiển thị toast (đúng)
   - Gửi friend request lần nữa để test

3. Nếu `previousUnreadCount >= 0` nhưng vẫn không hiển thị:
   - Kiểm tra `notifications` array có data không
   - Kiểm tra `notificationService` có hoạt động không

### Vấn Đề 5: Toast Hiển Thị Nhưng Không Có Nội Dung

**Triệu chứng**: Toast hiển thị nhưng trống hoặc undefined

**Giải pháp**:
1. Kiểm tra notifications array:
   ```javascript
   const header = document.querySelector('app-header');
   const component = header.__ngContext__.find(c => c.notifications);
   console.log('Notifications:', component.notifications);
   ```

2. Đảm bảo notifications được load TRƯỚC khi unread count thay đổi

## Quick Fix Script

Chạy script này trong browser console để reset và test lại:

```javascript
// Reset notification state
const appRoot = document.querySelector('app-root');
const context = appRoot.__ngContext__;

// Find services
let appNotificationService = null;
for (let i = 0; i < context.length; i++) {
  if (context[i] && context[i].appNotificationService) {
    appNotificationService = context[i].appNotificationService;
    break;
  }
}

if (appNotificationService) {
  console.log('🔄 Reloading notifications...');
  
  // Reload notifications
  appNotificationService.loadNotifications().subscribe({
    next: (notifications) => {
      console.log('✅ Loaded notifications:', notifications);
      
      // Reload unread count
      appNotificationService.loadUnreadCount().subscribe({
        next: (count) => {
          console.log('✅ Unread count:', count);
        }
      });
    }
  });
} else {
  console.error('❌ AppNotificationService not found');
}
```

## Kết Luận

Nếu sau khi thực hiện tất cả các bước trên mà vẫn không hoạt động:

1. **Restart toàn bộ hệ thống**:
   - Stop backend (Ctrl + C)
   - Stop frontend (Ctrl + C)
   - Start backend: `cd api && npm start`
   - Start frontend: `cd cli && npm start`

2. **Clear tất cả cache**:
   - Browser: Hard refresh (Ctrl + Shift + R)
   - Angular: Delete `.angular` folder
   - Node: Delete `node_modules/.cache`

3. **Kiểm tra lại code**:
   - Đảm bảo tất cả file đã được save
   - Đảm bảo không có lỗi compile
   - Chạy `npm run build` để kiểm tra

4. **Test với script**:
   - Sử dụng `test-realtime-notification.js`
   - Chạy `runAllTests()` trong console
   - Kiểm tra từng bước một
