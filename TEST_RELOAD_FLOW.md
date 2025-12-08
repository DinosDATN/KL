# Test Chat Reload Flow

## Vấn đề đã sửa

Khi reload trang, chat không load được danh sách nhóm, nhưng khi nhấn nút "Tải lại danh sách nhóm" thì lại hoạt động.

## Nguyên nhân

1. **Timing issue**: Khi `ChatComponent` gọi `chatService.initializeChat()`, `authService.getCurrentUser()` có thể trả về `null` vì auth chưa hoàn tất việc load user từ localStorage.

2. **Multiple subscriptions**: `currentUser$` có thể emit nhiều lần (null -> user), gây ra việc `initializeChat()` được gọi nhiều lần hoặc không được gọi đúng lúc.

3. **Observable chain issue**: Việc sử dụng `switchMap` trong constructor có thể gây ra vấn đề với timing.

## Các thay đổi

### 1. Tách riêng subscription chain
**Trước**:
```typescript
this.authService.authInitialized$
  .pipe(
    filter(initialized => initialized === true),
    take(1),
    switchMap(() => this.authService.currentUser$),
    takeUntil(this.destroy$)
  )
  .subscribe((user) => {
    // Handle user
  });
```

**Sau**:
```typescript
this.authService.authInitialized$
  .pipe(
    filter(initialized => initialized === true),
    take(1)
  )
  .subscribe(() => {
    // Now subscribe to currentUser$ separately
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        // Handle user
      });
  });
```

### 2. Thêm logic kiểm tra user change
```typescript
const previousUser = this.currentUser;
this.currentUser = user;

if (user) {
  // Only initialize if user actually changed
  if (!previousUser || previousUser.id !== user.id) {
    this.initializeChat();
  }
} else {
  // Only clear if there was a previous user
  if (previousUser) {
    this.clearChatData();
  }
}
```

### 3. Thêm flag để tránh khởi tạo nhiều lần
```typescript
private chatInitialized = false;

private initializeChat(): void {
  if (this.chatInitialized) {
    console.log('⚠️ Chat: Already initialized, skipping...');
    return;
  }
  this.chatInitialized = true;
  // ... rest of initialization
}
```

### 4. Cải thiện logging trong ChatService
```typescript
if (!user) {
  console.error('❌ ChatService: Cannot initialize - user is null');
  console.log('💡 ChatService: This might be a timing issue.');
  return;
}
```

## Cách test

### Test 1: Reload trang
1. Đăng nhập vào hệ thống
2. Vào trang chat
3. Đợi danh sách nhóm load xong
4. Reload trang (Ctrl+R hoặc F5)
5. Kiểm tra console log

**Kết quả mong đợi**:
```
🏗️ Chat: Constructor called
🔐 Chat: Auth initialized status: true
✅ Chat: Auth initialized, now subscribing to currentUser$
👤 Chat: Current user changed: [tên user]
🔄 Chat: User changed, initializing chat...
🚀 Chat: Initializing chat system...
🚀 ChatService: Initializing chat system...
👤 ChatService: Current user: [tên user]
🔑 ChatService: Token available: true
🔄 ChatService: Loading rooms from API...
📡 ChatService: Loading user rooms from API...
✅ ChatService: Received rooms from API: X
📦 ChatService: Updating roomsSubject with X rooms
📦 Chat: Received rooms update: X
```

### Test 2: Hard reload
1. Ctrl+Shift+R (hard reload)
2. Kiểm tra console log
3. Danh sách nhóm phải hiển thị

### Test 3: Incognito mode
1. Mở Incognito window
2. Đăng nhập
3. Vào trang chat
4. Reload trang
5. Kiểm tra danh sách nhóm

### Test 4: Clear cache
1. Ctrl+Shift+Delete
2. Clear cache
3. Reload trang
4. Đăng nhập lại
5. Vào trang chat
6. Kiểm tra danh sách nhóm

## Debug nếu vẫn lỗi

### Kiểm tra console log

**Nếu thấy**:
```
❌ ChatService: Cannot initialize - user is null
💡 ChatService: This might be a timing issue.
```

**Nghĩa là**: `authService.getCurrentUser()` trả về `null` khi `chatService.initializeChat()` được gọi.

**Giải pháp**: Kiểm tra `AuthService` xem `currentUserSubject` có được set đúng không.

### Kiểm tra Network tab

1. Mở Developer Tools > Network
2. Filter: XHR
3. Reload trang
4. Tìm request `/api/v1/chat/rooms`

**Nếu không thấy request**:
- `chatService.initializeChat()` không được gọi
- Hoặc user/token là null

**Nếu thấy request nhưng status 401**:
- Token hết hạn
- Cần đăng nhập lại

**Nếu thấy request và status 200**:
- API hoạt động đúng
- Vấn đề là ở frontend (observable không emit)

### Kiểm tra Application tab

1. Mở Developer Tools > Application
2. Local Storage
3. Kiểm tra `auth_user`

**Nếu không có `auth_user`**:
- User chưa đăng nhập
- Hoặc localStorage bị clear

**Nếu có `auth_user`**:
- Parse JSON và kiểm tra data có hợp lệ không

## Workaround nếu vẫn lỗi

### Sử dụng button reload
Click vào button reload (icon refresh) ở sidebar để force reload danh sách nhóm.

### Thêm auto-retry
Nếu vấn đề vẫn tồn tại, có thể thêm logic auto-retry:

```typescript
private initializeChat(): void {
  // ... existing code ...
  
  // If rooms not loaded after 2 seconds, retry
  setTimeout(() => {
    if (this.chatRooms.length === 0) {
      console.log('⚠️ Chat: No rooms loaded, retrying...');
      this.chatService.loadUserRooms().subscribe();
    }
  }, 2000);
}
```

## Kết luận

Các thay đổi này đảm bảo:
1. ✅ Auth được khởi tạo hoàn toàn trước khi subscribe vào `currentUser$`
2. ✅ `initializeChat()` chỉ được gọi khi có user hợp lệ
3. ✅ Tránh khởi tạo nhiều lần
4. ✅ Logging chi tiết để debug
5. ✅ User có thể force reload nếu cần

Nếu vẫn gặp vấn đề, cung cấp:
- Console logs đầy đủ
- Network tab screenshots
- Mô tả chi tiết các bước tái hiện lỗi
