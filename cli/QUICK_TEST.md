# Quick Test - Chat Reload Issue

## Bước 1: Mở Console
1. Mở trình duyệt
2. Nhấn F12
3. Chọn tab Console
4. Clear console (Ctrl+L hoặc click icon clear)

## Bước 2: Vào trang Chat
1. Đăng nhập (nếu chưa)
2. Vào `/chat`
3. Đợi trang load xong

## Bước 3: Reload trang
1. Nhấn F5
2. Đợi 2-3 giây
3. Đọc console log

## Bước 4: Kiểm tra kết quả

### ✅ THÀNH CÔNG nếu thấy:
```
🏗️ Chat: Constructor called
🔐 Chat: Auth initialized status: true
✅ Chat: Auth initialized, now subscribing to currentUser$
👤 Chat: Current user changed: [tên]
🔄 Chat: User changed, initializing chat...
🚀 Chat: Initializing chat system...
🔄 Chat: Calling chatService.initializeChat()...
🚀 ChatService: Initializing chat system...
👤 ChatService: Current user: [tên]
🔄 ChatService: Loading rooms from API...
📡 ChatService: Loading user rooms from API...
✅ ChatService: Received rooms from API: X
📦 Chat: Received rooms update: X
```

### ❌ THẤT BẠI nếu:
- Không thấy "Loading rooms from API"
- Thấy "Cannot initialize - user is null"
- Thấy "Current user changed: null"
- Không thấy "Received rooms update"

## Bước 5: Nếu thất bại

### Test 1: Check Local Storage
```javascript
// Paste vào console
console.log('Auth User:', localStorage.getItem('auth_user'));
```

Kết quả mong đợi: Phải có JSON object với user data

### Test 2: Check Current User
```javascript
// Paste vào console
const chatComponent = document.querySelector('app-chat');
if (chatComponent) {
  const component = window['ng']?.getComponent(chatComponent);
  console.log('Component currentUser:', component?.currentUser);
  console.log('Component chatRooms:', component?.chatRooms);
}
```

Kết quả mong đợi: 
- `currentUser` phải có data
- `chatRooms` phải là array (có thể empty)

### Test 3: Manual Reload
```javascript
// Paste vào console
const chatComponent = document.querySelector('app-chat');
if (chatComponent) {
  const component = window['ng']?.getComponent(chatComponent);
  component?.onReloadRooms();
}
```

Hoặc click button reload (icon refresh) ở sidebar

### Test 4: Check API
Mở Network tab > XHR > Reload trang

Phải thấy request đến `/api/v1/chat/rooms` với:
- Status: 200
- Response: Array of rooms

## Bước 6: Report Issue

Nếu vẫn lỗi, copy toàn bộ console log và gửi kèm:
1. Screenshot Network tab
2. Screenshot Application > Local Storage
3. Mô tả chi tiết các bước đã làm
