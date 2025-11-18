# Fix: Toast Notification Trùng Lặp và Không Hiển Thị

## Vấn Đề

### Vấn Đề 1: 2 Toast Ở Trang Chat
Khi ở trang chat, có 2 toast notification hiển thị cùng lúc khi nhận friend request.

### Vấn Đề 2: Không Có Toast Ở Trang Khác
Khi ở các trang khác (home, courses, profile, v.v.), không có toast notification hiển thị.

## Nguyên Nhân

### Nguyên Nhân 1: Duplicate Toast
Có 2 service cùng hiển thị toast notification:

1. **friendship.service.ts** (chỉ active khi ở trang chat):
```typescript
this.socketService.friendRequestReceived$.subscribe((data) => {
  // ...
  this.notificationService.info(
    'Lời mời kết bạn mới',
    `${data.requester?.name} đã gửi lời mời kết bạn cho bạn`,
    5000
  ); // ❌ Toast thứ 1
});
```

2. **header.component.ts** (active ở tất cả các trang):
```typescript
this.unreadCountSubscription = this.appNotificationService.unreadCount$.subscribe((count) => {
  if (!isFirstLoad && count > this.previousUnreadCount) {
    this.notificationService.info(
      `🔔 ${latestNotification.title}`,
      latestNotification.message,
      5000
    ); // ❌ Toast thứ 2
  }
});
```

→ Kết quả: 2 toast cùng hiển thị ở trang chat

### Nguyên Nhân 2: Toast Component Không Được Render
Toast component chỉ được thêm vào 2 trang:
- `chat.component.html`: `<app-notification-toast></app-notification-toast>`
- `forum.component.html`: `<app-notification-toast></app-notification-toast>`

Các trang khác không có toast component → Không hiển thị toast dù service đã gọi.

## Giải Pháp

### Giải Pháp 1: Xóa Duplicate Toast Trong Friendship Service

**File**: `cli/src/app/core/services/friendship.service.ts`

**Trước**:
```typescript
this.socketService.friendRequestReceived$.subscribe((data) => {
  // ... update data
  
  // ❌ Hiển thị toast (trùng với header.component)
  this.notificationService.info(
    'Lời mời kết bạn mới',
    `${data.requester?.name} đã gửi lời mời kết bạn cho bạn`,
    5000
  );
});
```

**Sau**:
```typescript
this.socketService.friendRequestReceived$.subscribe((data) => {
  // ... update data
  
  // ✅ Không hiển thị toast, để header.component xử lý
  console.log('ℹ️ Toast notification will be shown by header component');
});
```

Áp dụng tương tự cho:
- `friendRequestAccepted$`
- `friendRequestDeclined$`

### Giải Pháp 2: Di Chuyển Toast Component Vào Main Layout

**File**: `cli/src/app/shared/layout/main-layout/main-layout.component.html`

**Thêm toast component vào cuối file**:
```html
<app-header *ngIf="!currentUrl.startsWith('/forum')"></app-header>
<div class="bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
  <main class="flex-1 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <div class="min-h-full">
      <router-outlet></router-outlet>
    </div>
  </main>
  <app-footer *ngIf="!currentUrl.startsWith('/chat') && !currentUrl.startsWith('/games')"></app-footer>
  <app-back-to-top></app-back-to-top>
</div>

<!-- ✅ Toast component - Global for all pages -->
<app-notification-toast></app-notification-toast>
```

**File**: `cli/src/app/shared/layout/main-layout/main-layout.component.ts`

**Thêm import**:
```typescript
import { NotificationToastComponent } from '../../components/notification-toast/notification-toast.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    BackToTopComponent,
    NotificationToastComponent, // ✅ Thêm import
  ],
  // ...
})
```

### Giải Pháp 3: Xóa Toast Component Khỏi Chat và Forum

**File**: `cli/src/app/features/chat/chat.component.html`
```html
<!-- ❌ Xóa dòng này -->
<!-- <app-notification-toast></app-notification-toast> -->
```

**File**: `cli/src/app/features/chat/chat.component.ts`
```typescript
// ❌ Xóa import
// import { NotificationToastComponent } from '../../shared/components/notification-toast/notification-toast.component';

@Component({
  imports: [
    // ... other imports
    // ❌ Xóa NotificationToastComponent khỏi imports
  ],
})
```

Áp dụng tương tự cho `forum.component`.

## Kết Quả

### Trước Fix:
```
Trang Chat:
  - Friend request received → 2 toast hiển thị ❌
  - Toast từ friendship.service
  - Toast từ header.component

Trang Khác (Home, Courses, Profile, v.v.):
  - Friend request received → Không có toast ❌
  - Toast component không được render
```

### Sau Fix:
```
Tất Cả Các Trang:
  - Friend request received → 1 toast hiển thị ✅
  - Toast từ header.component (thông qua app-notification.service)
  - Toast component được render trong main-layout
  - Hoạt động nhất quán ở mọi trang
```

## Luồng Hoạt Động Đúng

```
1. User A gửi friend request đến User B
   ↓
2. Backend emit socket event: friend_request_received
   ↓
3. Frontend (User B) nhận socket event
   ↓
4. app-notification.service reload notifications và unread count
   ↓
5. header.component phát hiện unread count tăng
   ↓
6. header.component hiển thị toast notification
   ↓
7. Toast component (trong main-layout) render toast
   ↓
8. User B thấy 1 toast duy nhất ✅
```

## Kiến Trúc Toast Notification

```
┌─────────────────────────────────────────────────────┐
│ Main Layout (Tất cả các trang)                      │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │ Header Component                            │    │
│  │  - Subscribe unreadCount$                   │    │
│  │  - Phát hiện count tăng                     │    │
│  │  - Gọi notificationService.info()           │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │ Router Outlet (Nội dung trang)              │    │
│  │  - Home / Courses / Chat / Profile / ...    │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │ Notification Toast Component                │    │
│  │  - Subscribe notifications$                 │    │
│  │  - Render toast ở góc màn hình              │    │
│  │  - Tự động đóng sau 5 giây                  │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Lợi Ích

### 1. Không Còn Duplicate Toast
- ✅ Chỉ 1 toast hiển thị cho mỗi notification
- ✅ Trải nghiệm người dùng tốt hơn
- ✅ Không gây nhầm lẫn

### 2. Toast Hoạt Động Ở Mọi Trang
- ✅ Home, Courses, Profile, Chat, Forum, v.v.
- ✅ Nhất quán trên toàn bộ ứng dụng
- ✅ Không bỏ lỡ thông báo quan trọng

### 3. Kiến Trúc Rõ Ràng
- ✅ Toast component ở main-layout (global)
- ✅ Header component quản lý logic hiển thị toast
- ✅ Các service khác không cần quan tâm đến toast

### 4. Dễ Bảo Trì
- ✅ Chỉ 1 nơi quản lý toast notification
- ✅ Dễ thêm/sửa logic toast
- ✅ Không cần thêm toast component vào từng trang

## Test

### Test 1: Trang Chat
1. User B ở trang chat
2. User A gửi friend request
3. **Kết quả mong đợi**: 1 toast hiển thị ✅

### Test 2: Trang Home
1. User B ở trang home
2. User A gửi friend request
3. **Kết quả mong đợi**: 1 toast hiển thị ✅

### Test 3: Trang Courses
1. User B ở trang courses
2. User A gửi friend request
3. **Kết quả mong đợi**: 1 toast hiển thị ✅

### Test 4: Trang Profile
1. User B ở trang profile
2. User A gửi friend request
3. **Kết quả mong đợi**: 1 toast hiển thị ✅

## Lưu Ý

### ✅ DO (Nên Làm):
1. Hiển thị toast từ header.component (global)
2. Đặt toast component trong main-layout
3. Để các service khác chỉ cập nhật data, không hiển thị toast

### ❌ DON'T (Không Nên Làm):
1. Hiển thị toast từ nhiều service khác nhau
2. Thêm toast component vào từng trang riêng lẻ
3. Duplicate logic hiển thị toast

## Kết Luận

Sau khi áp dụng fix này:
- ✅ Không còn duplicate toast
- ✅ Toast hiển thị ở tất cả các trang
- ✅ Kiến trúc rõ ràng và dễ bảo trì
- ✅ Trải nghiệm người dùng nhất quán

**Vấn đề đã được giải quyết hoàn toàn!** 🎉
