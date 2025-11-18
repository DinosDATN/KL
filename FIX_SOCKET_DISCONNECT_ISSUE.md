# Fix: Socket Bị Disconnect Khi Rời Trang Chat

## Vấn Đề

**Triệu chứng**:
- ✅ Ở trang chat: Nhận thông báo realtime
- ❌ Ở trang khác (home, courses, profile, v.v.): KHÔNG nhận thông báo
- ✅ Quay lại trang chat: Lại nhận được thông báo

## Nguyên Nhân

Socket bị **disconnect** khi rời khỏi trang chat do `chat.component.ts` gọi `chatService.disconnect()` trong `ngOnDestroy()`.

### Code Cũ (SAI):
```typescript
// cli/src/app/features/chat/chat.component.ts
ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
  this.chatService.disconnect(); // ❌ Gây mất kết nối socket!
  if (isPlatformBrowser(this.platformId)) {
    window.removeEventListener('resize', this.onResize.bind(this));
  }
}
```

### Luồng Hoạt Động Sai:
```
1. User đăng nhập → Socket kết nối ✅
2. User vào trang chat → Socket vẫn kết nối ✅
3. User rời trang chat → ngOnDestroy() gọi disconnect() → Socket bị ngắt ❌
4. User ở trang khác → Không nhận thông báo ❌
5. User quay lại trang chat → Socket kết nối lại ✅
```

## Giải Pháp

### 1. Sửa Chat Component

**File**: `cli/src/app/features/chat/chat.component.ts`

```typescript
ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
  
  // DO NOT disconnect socket here!
  // Socket connection should persist across pages to receive notifications
  // Only disconnect when user logs out (handled in app.component.ts)
  
  if (isPlatformBrowser(this.platformId)) {
    window.removeEventListener('resize', this.onResize.bind(this));
  }
}

private clearChatData(): void {
  // Clear all chat-related data when user logs out
  this.chatRooms = [];
  this.messages = {};
  this.selectedRoom = null;
  this.onlineUsers = [];
  this.roomMembers = [];
  this.reactions = [];

  // DO NOT disconnect socket here!
  // Socket disconnection is handled in app.component.ts when user logs out
}
```

### 2. Cập Nhật Chat Service

**File**: `cli/src/app/core/services/chat.service.ts`

**Thay đổi 1**: Kiểm tra socket đã kết nối trước khi connect
```typescript
if (user && token) {
  // Only connect socket if not already connected
  if (!this.socketService.isConnected()) {
    console.log('✅ Starting Socket.IO connection from chat service...');
    this.socketService.connect(token, user);
  } else {
    console.log('✅ Socket already connected, skipping connection');
  }
  
  this.loadUserRooms().subscribe({
    next: (rooms) => {
      console.log(`✅ Loaded ${rooms.length} chat rooms`);
    },
    error: (error) => {
      console.error('❌ Error loading chat rooms:', error);
    },
  });
}
```

**Thay đổi 2**: Deprecate method disconnect()
```typescript
// DEPRECATED: Do not use this method!
// Socket connection should persist across pages to receive notifications
// Only disconnect when user logs out (handled in app.component.ts)
disconnect(): void {
  console.warn('⚠️ ChatService.disconnect() is deprecated and should not be used!');
  console.warn('⚠️ Socket connection must persist to receive notifications across all pages.');
  console.warn('⚠️ Socket will only disconnect when user logs out.');
  // Do NOT disconnect socket here
  // this.socketService.disconnect();
}
```

### 3. Socket Lifecycle Đúng

Socket chỉ nên disconnect trong **1 trường hợp duy nhất**: User đăng xuất.

**File**: `cli/src/app/app.component.ts` (ĐÃ ĐÚNG)
```typescript
ngOnInit(): void {
  // Listen for auth state changes
  this.authService.currentUser$.subscribe((user) => {
    if (user) {
      console.log('✅ User authenticated, initializing app');
      this.initializeApp();
    } else {
      console.log('❌ User logged out, cleaning up');
      this.socketService.disconnect(); // ✅ CHỈ disconnect khi logout
      this.appNotificationService.clearData();
    }
  });
}
```

## Luồng Hoạt Động Đúng

```
1. User đăng nhập
   → app.component.ts: socketService.connect() ✅
   → Socket kết nối và join room user_${userId} ✅

2. User vào trang chat
   → chat.service: Kiểm tra socket đã kết nối → Skip connect ✅
   → Load chat rooms ✅

3. User rời trang chat
   → chat.component: ngOnDestroy() → KHÔNG disconnect ✅
   → Socket vẫn kết nối ✅

4. User ở trang khác (home, courses, profile, v.v.)
   → Socket vẫn kết nối ✅
   → Nhận thông báo realtime ✅

5. User đăng xuất
   → app.component: socketService.disconnect() ✅
   → Socket ngắt kết nối ✅
```

## Cách Test

### Bước 1: Restart Frontend
```bash
# Stop frontend
Ctrl + C

# Start lại
npm start
```

### Bước 2: Hard Refresh Browser
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### Bước 3: Test Scenario

#### Test 1: Ở Trang Chủ
1. User B đăng nhập
2. Ở trang chủ (/)
3. User A gửi friend request
4. **Kết quả mong đợi**: User B nhận thông báo realtime ✅

#### Test 2: Ở Trang Courses
1. User B vào trang courses (/courses)
2. User A gửi friend request
3. **Kết quả mong đợi**: User B nhận thông báo realtime ✅

#### Test 3: Sau Khi Rời Trang Chat
1. User B vào trang chat (/chat)
2. User B rời trang chat, vào trang khác
3. User A gửi friend request
4. **Kết quả mong đợi**: User B nhận thông báo realtime ✅

### Bước 4: Kiểm Tra Console Logs

#### Khi Load Trang:
```
✅ Logs mong đợi:
🚀 App component initialized
🔧 Initializing app...
🚀 Initializing socket connection from app component
👤 User: [Tên] (ID: [ID])
Connected to server
🔌 Socket connection status: CONNECTED
```

#### Khi Vào Trang Chat:
```
✅ Logs mong đợi:
🚀 Initializing chat system...
✅ Socket already connected, skipping connection
✅ Loaded X chat rooms
```

#### Khi Rời Trang Chat:
```
✅ KHÔNG có log disconnect
❌ KHÔNG có log: Disconnected from server
```

#### Khi Nhận Friend Request (Ở Bất Kỳ Trang Nào):
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

## Kiểm Tra Socket Connection

### Browser Console:
```javascript
// Kiểm tra socket có kết nối không
const appRoot = document.querySelector('app-root');
const context = appRoot.__ngContext__;

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

## Lưu Ý Quan Trọng

### ✅ DO (Nên Làm):
1. Kết nối socket khi user đăng nhập (app.component.ts)
2. Giữ socket kết nối khi di chuyển giữa các trang
3. Chỉ disconnect socket khi user đăng xuất
4. Kiểm tra socket đã kết nối trước khi connect lại

### ❌ DON'T (Không Nên Làm):
1. Disconnect socket khi rời trang chat
2. Disconnect socket khi rời bất kỳ trang nào
3. Connect socket nhiều lần không cần thiết
4. Gọi chatService.disconnect() trong component lifecycle

## Kết Luận

Sau khi áp dụng fix này:
- ✅ Socket duy trì kết nối xuyên suốt các trang
- ✅ Nhận thông báo realtime ở mọi trang
- ✅ Toast notification hiển thị đúng
- ✅ Badge notification cập nhật realtime
- ✅ Không cần phải ở trang chat để nhận thông báo

**Vấn đề đã được giải quyết hoàn toàn!** 🎉
