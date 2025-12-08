# Expected Console Output khi Reload Trang Chat

## Khi reload trang (F5), console phải hiển thị theo thứ tự sau:

### 1. Component Constructor
```
🏗️ Chat: Constructor called
```

### 2. Auth Initialization Check
```
🔐 Chat: Auth initialized status: false
🔐 Chat: Auth initialized status: true
✅ Chat: Auth initialized, now subscribing to currentUser$
```

### 3. Current User Update
```
👤 Chat: Current user changed: [Tên User]
🔄 Chat: User changed, initializing chat...
```

### 4. Chat Initialization
```
🚀 Chat: Initializing chat system...
📊 Chat: chatInitialized flag: false
📊 Chat: Current rooms count: 0
✅ Chat: First time initialization, setting up subscriptions...
🔄 Chat: Calling chatService.initializeChat()...
```

### 5. ChatService Initialization
```
🚀 ChatService: Initializing chat system...
👤 ChatService: Current user: [Tên User]
🔑 ChatService: Token available: true
🔐 ChatService: User authenticated: true
📦 ChatService: Current rooms in state: 0
✅ ChatService: Socket already connected, skipping connection
🔄 ChatService: Loading rooms from API...
```

### 6. API Call
```
📡 ChatService: Loading user rooms from API...
```

### 7. API Response
```
✅ ChatService: Received rooms from API: X
📦 ChatService: Updating roomsSubject with X rooms
🚪 ChatService: Joining room via socket: [room_id] [room_name]
... (repeat for each room)
```

### 8. Component Receives Update
```
✅ ChatService: Loaded X chat rooms from API
📦 ChatService: Rooms in state after load: X
📦 Chat: Received rooms update: X
👥 Loaded Y users from rooms data
```

### 9. Auto-select First Room (if any)
```
🏠 Room selected: [room_name]
✅ Loaded Z messages for room [room_id]
```

---

## Nếu KHÔNG thấy output trên, kiểm tra:

### Trường hợp 1: Dừng ở "Auth initialized status: false"
**Vấn đề**: AuthService không emit `authInitialized$` = true
**Kiểm tra**: 
- Local Storage có `auth_user` không?
- AuthService có lỗi gì không?

### Trường hợp 2: Thấy "Current user changed: null"
**Vấn đề**: User không được load từ localStorage
**Kiểm tra**:
- Local Storage > `auth_user` có data không?
- Token có hợp lệ không?
- AuthService.initializeAuthState() có chạy không?

### Trường hợp 3: Thấy "Cannot initialize - user is null"
**Vấn đề**: Timing issue - `authService.getCurrentUser()` trả về null
**Giải pháp**: Đã được sửa trong code mới

### Trường hợp 4: Không thấy "Loading rooms from API"
**Vấn đề**: `chatService.initializeChat()` không được gọi
**Kiểm tra**:
- `initializeChat()` có được gọi không?
- User và token có hợp lệ không?

### Trường hợp 5: Thấy API call nhưng không thấy "Received rooms update"
**Vấn đề**: `roomsSubject.next()` không emit hoặc subscription không hoạt động
**Kiểm tra**:
- `rooms$` observable có được subscribe không?
- `roomsSubject.next()` có được gọi không?

---

## Test Script

Mở Console (F12) và chạy:

```javascript
// Check current user
console.log('Current User:', localStorage.getItem('auth_user'));

// Check if ChatService exists
console.log('ChatService rooms:', window['ng']?.getComponent(document.querySelector('app-chat'))?.chatService?.roomsSubject?.value);

// Force reload rooms
const chatComponent = window['ng']?.getComponent(document.querySelector('app-chat'));
if (chatComponent) {
  chatComponent.onReloadRooms();
}
```

---

## Debugging Steps

1. **Mở Console trước khi reload**
2. **Reload trang (F5)**
3. **Đọc console log từ đầu đến cuối**
4. **Tìm dòng log cuối cùng trước khi dừng**
5. **So sánh với Expected Output ở trên**
6. **Xác định vấn đề dựa trên dòng log bị thiếu**

---

## Quick Fix

Nếu vẫn không load được, thử:

1. **Hard Reload**: Ctrl+Shift+R
2. **Clear Cache**: Ctrl+Shift+Delete
3. **Incognito Mode**: Ctrl+Shift+N
4. **Manual Reload**: Click button reload ở sidebar
5. **Re-login**: Đăng xuất và đăng nhập lại
