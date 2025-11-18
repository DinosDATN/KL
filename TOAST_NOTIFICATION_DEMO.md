# Demo Toast Notification cho Friend Request

## Mô Tả

Khi có friend request mới, hệ thống sẽ hiển thị toast notification để thông báo cho người dùng ngay lập tức.

## Cách Hoạt Động

### 1. Logic Phát Hiện Thông Báo Mới

```typescript
// header.component.ts
private subscribeToNotifications(): void {
  this.unreadCountSubscription = this.appNotificationService.unreadCount$.subscribe(
    (count) => {
      // Phát hiện khi unread count tăng lên
      if (count > this.previousUnreadCount && this.previousUnreadCount >= 0) {
        // Lấy thông báo mới nhất
        const newNotifications = this.notifications.filter(n => !n.is_read);
        if (newNotifications.length > 0) {
          const latestNotification = newNotifications[0];
          
          // Hiển thị toast
          this.notificationService.info(
            `🔔 ${latestNotification.title}`,
            latestNotification.message,
            5000  // Tự động đóng sau 5 giây
          );
        }
      }
      
      this.previousUnreadCount = count;
      this.unreadCount = count;
    }
  );
}
```

### 2. Khởi Tạo previousUnreadCount

```typescript
// Khởi tạo với -1 để phân biệt "chưa load" và "không có thông báo"
private previousUnreadCount = -1;

// Khi user logout, reset về -1
private unsubscribeFromNotifications(): void {
  this.notifications = [];
  this.unreadCount = 0;
  this.previousUnreadCount = -1;
}
```

## Ví Dụ Thực Tế

### Scenario 1: User B chưa có thông báo nào

```
1. User B đăng nhập
   previousUnreadCount = -1 (chưa khởi tạo)
   unreadCount = 0

2. Load notifications lần đầu
   previousUnreadCount = 0 (khởi tạo)
   unreadCount = 0
   → Không hiển thị toast (vì là lần đầu load)

3. User A gửi friend request
   previousUnreadCount = 0
   unreadCount = 1
   → count (1) > previousUnreadCount (0) ✅
   → Hiển thị toast: "🔔 Lời mời kết bạn mới"
```

### Scenario 2: User B đã có 2 thông báo chưa đọc

```
1. User B đăng nhập
   previousUnreadCount = -1
   unreadCount = 0

2. Load notifications lần đầu
   previousUnreadCount = 2 (khởi tạo)
   unreadCount = 2
   → Không hiển thị toast (vì là lần đầu load)

3. User A gửi friend request
   previousUnreadCount = 2
   unreadCount = 3
   → count (3) > previousUnreadCount (2) ✅
   → Hiển thị toast: "🔔 Lời mời kết bạn mới"
```

### Scenario 3: User B đọc thông báo

```
1. User B có 3 thông báo chưa đọc
   previousUnreadCount = 3
   unreadCount = 3

2. User B đọc 1 thông báo
   previousUnreadCount = 3
   unreadCount = 2
   → count (2) < previousUnreadCount (3) ❌
   → Không hiển thị toast (vì đang giảm, không phải tăng)
```

## Các Loại Thông Báo Hỗ Trợ Toast

Toast notification sẽ hiển thị cho tất cả các loại thông báo:

| Loại | Tiêu đề | Icon |
|------|---------|------|
| `friend_request` | Lời mời kết bạn mới | 🔔 |
| `friend_accepted` | Lời mời được chấp nhận | 🔔 |
| `friend_declined` | Lời mời bị từ chối | 🔔 |
| `room_invite` | Lời mời vào phòng chat | 🔔 |
| `room_created` | Phòng chat mới | 🔔 |
| `message` | Tin nhắn mới | 🔔 |
| `system` | Thông báo hệ thống | 🔔 |
| `achievement` | Thành tựu mới | 🔔 |
| `contest` | Cuộc thi | 🔔 |

## Tùy Chỉnh Toast

### Thay đổi thời gian hiển thị

```typescript
// Hiện tại: 5000ms (5 giây)
this.notificationService.info(
  `🔔 ${latestNotification.title}`,
  latestNotification.message,
  5000  // ← Thay đổi giá trị này
);

// Ví dụ:
// 3000 = 3 giây
// 7000 = 7 giây
// 0 = không tự động đóng (phải click để đóng)
```

### Thay đổi loại toast

```typescript
// Info (màu xanh dương)
this.notificationService.info(title, message, duration);

// Success (màu xanh lá)
this.notificationService.success(title, message, duration);

// Warning (màu vàng)
this.notificationService.warning(title, message, duration);

// Error (màu đỏ)
this.notificationService.error(title, message, duration);
```

### Thêm icon tùy chỉnh theo loại thông báo

```typescript
// Lấy icon phù hợp với loại thông báo
const getNotificationEmoji = (type: string): string => {
  const emojiMap: { [key: string]: string } = {
    'friend_request': '👋',
    'friend_accepted': '✅',
    'friend_declined': '❌',
    'room_invite': '🏠',
    'room_created': '💬',
    'message': '📧',
    'system': 'ℹ️',
    'achievement': '🏆',
    'contest': '🎯'
  };
  return emojiMap[type] || '🔔';
};

// Sử dụng
const emoji = getNotificationEmoji(latestNotification.type);
this.notificationService.info(
  `${emoji} ${latestNotification.title}`,
  latestNotification.message,
  5000
);
```

## Test Toast Notification

### Test trong Browser Console

```javascript
// 1. Lấy notification service
const header = document.querySelector('app-header');
const notificationService = header.__ngContext__.find(c => c.notificationService)?.notificationService;

// 2. Test hiển thị toast
notificationService.info(
  '🔔 Test Notification',
  'Đây là một thông báo test',
  5000
);

// 3. Test các loại toast khác
notificationService.success('✅ Success', 'Thành công!', 3000);
notificationService.warning('⚠️ Warning', 'Cảnh báo!', 3000);
notificationService.error('❌ Error', 'Lỗi!', 3000);
```

### Test với Script

```javascript
// Thêm vào test-realtime-notification.js
function testToastNotification() {
  console.log('🧪 Testing toast notification...');
  
  try {
    const appRoot = document.querySelector('app-root');
    const context = appRoot.__ngContext__;
    
    // Find notification service
    let notificationService = null;
    for (let i = 0; i < context.length; i++) {
      if (context[i] && context[i].notificationService) {
        notificationService = context[i].notificationService;
        break;
      }
    }
    
    if (notificationService) {
      notificationService.info(
        '🔔 Test Friend Request',
        'User A đã gửi lời mời kết bạn cho bạn',
        5000
      );
      console.log('✅ Toast notification displayed!');
    } else {
      console.error('❌ Notification service not found');
    }
  } catch (error) {
    console.error('❌ Error testing toast:', error);
  }
}

// Gọi hàm
testToastNotification();
```

## Lưu Ý

1. **Toast chỉ hiển thị khi có thông báo MỚI**
   - Không hiển thị khi load trang lần đầu
   - Chỉ hiển thị khi unread count tăng lên

2. **Toast tự động đóng sau 5 giây**
   - User có thể click để đóng sớm hơn
   - Có thể thay đổi thời gian trong code

3. **Toast hiển thị thông báo mới nhất**
   - Nếu có nhiều thông báo cùng lúc, chỉ hiển thị 1 toast
   - Toast hiển thị thông báo đầu tiên trong danh sách chưa đọc

4. **Toast hoạt động ở mọi trang**
   - Không cần phải ở trang chat
   - Không cần phải mở dropdown notification

## Kết Luận

Toast notification giúp người dùng:
- ✅ Nhận biết ngay lập tức khi có thông báo mới
- ✅ Không bỏ lỡ thông báo quan trọng
- ✅ Trải nghiệm tốt hơn khi sử dụng ứng dụng
- ✅ Không cần phải liên tục kiểm tra icon notification
