# Sửa Lỗi Thông Báo Trùng Lặp Khi Gửi/Chấp Nhận Lời Mời Kết Bạn

## Vấn Đề
Khi A gửi lời mời kết bạn cho B, B nhận được **2 thông báo giống nhau**.
Tương tự, khi B chấp nhận lời mời, A cũng nhận được **2 thông báo giống nhau**.

## Nguyên Nhân
1. **BehaviorSubject emit giá trị ban đầu**: `BehaviorSubject` được khởi tạo với giá trị `null` và emit ngay khi subscribe, có thể gây ra duplicate events.
2. **Có thể có nhiều socket connections**: User có thể có nhiều socket connections (nhiều tab, reconnect không đúng cách).

## Giải Pháp Đã Áp Dụng

### 1. Thay đổi từ BehaviorSubject sang Subject
**File**: `cli/src/app/core/services/socket.service.ts`

Thay đổi các friend request observables từ `BehaviorSubject` sang `Subject` để tránh emit giá trị ban đầu:

```typescript
// Trước
private friendRequestReceivedSubject = new BehaviorSubject<{...} | null>(null);

// Sau
private friendRequestReceivedSubject = new Subject<{...}>();
```

### 2. Thêm Logging Chi Tiết
**Files**: 
- `cli/src/app/core/services/friendship.service.ts`
- `api/src/controllers/friendshipController.js`
- `api/src/socket/chatHandler.js`

Thêm các log để debug:
- Số lượng socket trong room
- Khi nào notification được hiển thị
- Khi nào socket event được emit

### 3. Xử Lý Multiple Socket Connections
**File**: `api/src/socket/chatHandler.js`

Thêm logic để disconnect socket cũ khi user connect lại:
```javascript
// Check if user already has an active connection
const existingConnection = activeUsers.get(socket.userId);
if (existingConnection) {
  // Disconnect old socket
  const oldSocket = io.sockets.sockets.get(existingConnection.socketId);
  if (oldSocket) {
    oldSocket.disconnect(true);
  }
}
```

### 4. Cập Nhật Logic Subscribe
**File**: `cli/src/app/core/services/friendship.service.ts`

Loại bỏ check `if (data && data.friendship)` vì `Subject` không emit giá trị null ban đầu.

## Cách Test

### Test Case 1: Gửi Lời Mời Kết Bạn
1. Đăng nhập với 2 tài khoản khác nhau (A và B) trên 2 trình duyệt/tab khác nhau
2. A gửi lời mời kết bạn cho B
3. **Kiểm tra**:
   - A nhận **1 thông báo**: "Đã gửi lời mời kết bạn tới [Tên B]"
   - B nhận **1 thông báo**: "[Tên A] đã gửi lời mời kết bạn cho bạn"

### Test Case 2: Chấp Nhận Lời Mời
1. B chấp nhận lời mời kết bạn từ A
2. **Kiểm tra**:
   - B nhận **1 thông báo**: "Bạn đã trở thành bạn bè với [Tên A]"
   - A nhận **1 thông báo**: "[Tên B] đã chấp nhận lời mời kết bạn của bạn"

### Test Case 3: Từ Chối Lời Mời
1. A gửi lời mời kết bạn cho B
2. B từ chối lời mời
3. **Kiểm tra**:
   - B nhận **1 thông báo**: "Đã từ chối lời mời kết bạn từ [Tên A]"
   - A nhận **1 thông báo**: "[Tên B] đã từ chối lời mời kết bạn của bạn"

## Debug Logs

Khi test, kiểm tra console logs:

### Frontend (Browser Console)
```
🔧 FriendshipService: Initializing socket listeners
📬 FriendshipService: Friend request received via socket
📊 Current pending requests count: X
✅ Added to pending requests
📊 Updated unread count: X
🔔 Showing notification for friend request received
```

### Backend (Server Console)
```
📬 Emitting friend_request_received to room: user_X
📊 Friendship ID: X, Requester: [Name]
✅ Friend request notification sent to user X
📊 Total sockets in room user_X: 1
```

## Lưu Ý

1. **Nếu vẫn thấy 2 thông báo**: Kiểm tra xem có bao nhiêu socket trong room `user_X` bằng cách xem log `Total sockets in room`.

2. **Nếu có nhiều hơn 1 socket**: User có thể đang mở nhiều tab. Giải pháp hiện tại sẽ disconnect socket cũ khi có connection mới.

3. **Nếu muốn cho phép nhiều tab**: Cần thay đổi logic để chỉ hiển thị notification 1 lần dù có nhiều socket connections.

## Files Đã Thay Đổi

1. `cli/src/app/core/services/socket.service.ts` - Đổi BehaviorSubject thành Subject
2. `cli/src/app/core/services/friendship.service.ts` - Thêm logging và cập nhật subscribe logic
3. `api/src/controllers/friendshipController.js` - Thêm logging chi tiết
4. `api/src/socket/chatHandler.js` - Xử lý multiple connections và thêm logging

## Rollback (Nếu Cần)

Nếu có vấn đề, có thể rollback bằng cách:
1. Đổi `Subject` về `BehaviorSubject` trong `socket.service.ts`
2. Thêm lại check `if (data && data.friendship)` trong `friendship.service.ts`
3. Xóa logic disconnect old socket trong `chatHandler.js`
