# Debug Chat Reload Issue - Hướng dẫn kiểm tra

## Vấn đề
Khi reload trang chat, tất cả nhóm không hiển thị được, mặc dù khi mới tạo nhóm hoặc mới truy cập vào web thì nó load được.

## Các thay đổi đã thực hiện

### 1. Thêm logging vào ChatComponent
- Thêm console.log để theo dõi lifecycle của component
- Theo dõi khi auth initialized
- Theo dõi khi currentUser thay đổi
- Theo dõi khi initializeChat được gọi

### 2. Thêm logging vào ChatService
- Theo dõi khi loadUserRooms được gọi
- Theo dõi response từ API
- Theo dõi khi roomsSubject được update
- Theo dõi số lượng rooms trong state

### 3. Sửa logic subscribe trong ChatComponent
- Thay đổi từ `getRoomsForCurrentUser()` sang `rooms$` observable
- Đảm bảo subscribe vào observable đúng cách

## Cách kiểm tra

### Bước 1: Kiểm tra API Backend
```bash
cd api
node test-chat-rooms.js
```

Kết quả mong đợi:
- API trả về danh sách rooms thành công
- Mỗi lần gọi API đều trả về cùng số lượng rooms

### Bước 2: Kiểm tra Frontend Console
1. Mở trình duyệt và vào trang chat
2. Mở Developer Tools (F12) và xem tab Console
3. Tìm các log sau:

**Khi trang load lần đầu:**
```
🏗️ Chat: Constructor called
🔐 Chat: Auth initialized status: true
🔄 Chat: Switching to currentUser$ observable
👤 Chat: Current user changed: [tên user]
🚀 Chat: Initializing chat system...
📦 Current rooms in state: 0
🔄 Loading rooms from API...
📡 ChatService: Loading user rooms from API...
✅ ChatService: Received rooms from API: [số lượng]
📦 ChatService: Updating roomsSubject with [số lượng] rooms
📦 Chat: Received rooms update: [số lượng]
```

**Khi reload trang (Ctrl+R hoặc F5):**
- Các log trên phải xuất hiện lại
- Số lượng rooms phải giống nhau

### Bước 3: Kiểm tra Network Tab
1. Mở Developer Tools > Network tab
2. Filter: XHR
3. Reload trang
4. Tìm request đến `/api/v1/chat/rooms`
5. Kiểm tra:
   - Status code: 200
   - Response có chứa danh sách rooms
   - Headers có Authorization token

### Bước 4: Kiểm tra Application Tab
1. Mở Developer Tools > Application tab
2. Xem Local Storage
3. Kiểm tra:
   - `auth_user` có tồn tại
   - Token có hợp lệ

## Các nguyên nhân có thể

### 1. Token hết hạn
- Kiểm tra token trong localStorage
- Kiểm tra response từ API có lỗi 401 không

### 2. Socket connection issue
- Kiểm tra socket có connect thành công không
- Xem console có lỗi socket không

### 3. Observable không emit
- Kiểm tra roomsSubject có được update không
- Kiểm tra component có subscribe đúng không

### 4. Timing issue
- Auth chưa initialized khi component subscribe
- API call chưa hoàn thành khi component render

### 5. State không được clear
- Rooms cũ vẫn còn trong state
- Component không re-render khi có data mới

## Giải pháp đã áp dụng

### 1. Sửa subscribe logic
```typescript
// Trước (có thể gây vấn đề)
this.chatService.getRoomsForCurrentUser()
  .pipe(takeUntil(this.destroy$))
  .subscribe((rooms) => {
    this.chatRooms = rooms;
  });

// Sau (đúng cách)
this.chatService.rooms$
  .pipe(takeUntil(this.destroy$))
  .subscribe((rooms) => {
    this.chatRooms = rooms;
  });
```

### 2. Thêm logging chi tiết
- Giúp debug dễ dàng hơn
- Theo dõi flow của data

### 3. Đảm bảo API luôn được gọi
- Mỗi lần initializeChat được gọi, API sẽ được gọi lại
- Không cache data cũ

## Các bước tiếp theo nếu vẫn lỗi

### 1. Kiểm tra AuthService
```typescript
// Xem authInitialized$ có emit đúng không
this.authService.authInitialized$.subscribe(val => {
  console.log('Auth initialized:', val);
});
```

### 2. Kiểm tra BehaviorSubject
```typescript
// Xem roomsSubject có giá trị gì
console.log('Current rooms:', this.roomsSubject.value);
```

### 3. Force reload rooms
```typescript
// Thêm button để force reload
forceReloadRooms() {
  this.chatService.loadUserRooms().subscribe();
}
```

### 4. Kiểm tra SSR/Hydration
- Có thể có vấn đề với Server-Side Rendering
- Thử disable SSR để test

## Liên hệ
Nếu vẫn gặp vấn đề, cung cấp:
1. Console logs đầy đủ
2. Network tab screenshots
3. Mô tả chi tiết các bước tái hiện lỗi
