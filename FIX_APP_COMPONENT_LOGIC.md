# Sửa Logic App Component

## Vấn Đề

Logic trong `app.component.ts` có nhiều vấn đề:

### 1. Duplicate Initialization

**Code cũ:**
```typescript
// Subscribe 1: authInitialized$
this.authService.authInitialized$.subscribe((initialized) => {
  if (initialized) {
    this.initializeApp(); // ← Gọi lần 1
  }
});

// Subscribe 2: currentUser$
this.authService.currentUser$.subscribe((user) => {
  if (user) {
    this.initializeApp(); // ← Gọi lần 2 (DUPLICATE!)
  }
});
```

**Vấn đề:**
- Khi user đăng nhập, cả 2 observables đều emit
- `initializeApp()` được gọi **2 lần**
- Socket connect 2 lần
- Load notifications 2 lần
- Lãng phí resources

### 2. Memory Leak

**Code cũ:**
```typescript
this.authService.currentUser$.subscribe(...); // ← Không unsubscribe!
this.socketService.isConnected$.subscribe(...); // ← Không unsubscribe!
```

**Vấn đề:**
- Subscriptions không được cleanup khi component destroy
- Gây memory leak
- Subscriptions vẫn chạy ngầm sau khi component bị destroy

### 3. Không Có Protection Chống Duplicate

**Code cũ:**
```typescript
private initializeApp(): void {
  // Không kiểm tra đã init chưa
  this.socketService.connect('', user);
  this.loadNotifications();
}
```

**Vấn đề:**
- Nếu `currentUser$` emit nhiều lần, `initializeApp()` sẽ chạy nhiều lần
- Socket có thể bị reconnect không cần thiết
- Notifications load nhiều lần

## Giải Pháp

### 1. Loại Bỏ Duplicate Subscription

**Lý do:**
- Guards đã xử lý việc đợi `authInitialized$`
- Chỉ cần listen `currentUser$` là đủ
- `currentUser$` sẽ emit khi user login/logout

**Code mới:**
```typescript
ngOnInit(): void {
  // ✅ Chỉ cần 1 subscription
  this.authService.currentUser$
    .pipe(takeUntil(this.destroy$))
    .subscribe((user) => {
      if (user) {
        this.initializeApp();
      } else {
        this.cleanup();
      }
    });
}
```

### 2. Thêm Proper Cleanup

**Code mới:**
```typescript
export class AppComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Tất cả subscriptions dùng takeUntil
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(...);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**Lợi ích:**
- Tất cả subscriptions tự động unsubscribe khi component destroy
- Không còn memory leak
- Clean code pattern

### 3. Thêm Flag Chống Duplicate

**Code mới:**
```typescript
export class AppComponent implements OnInit, OnDestroy {
  private isAppInitialized = false;

  private initializeApp(): void {
    // ✅ Kiểm tra đã init chưa
    if (this.isAppInitialized) {
      console.log('ℹ️ App already initialized, skipping');
      return;
    }

    // Initialize socket, notifications, etc.
    // ...

    // Mark as initialized
    this.isAppInitialized = true;
  }
}
```

**Lợi ích:**
- Đảm bảo `initializeApp()` chỉ chạy 1 lần
- Tránh duplicate socket connections
- Tránh load notifications nhiều lần

### 4. Reset Flag Khi Logout

**Code mới:**
```typescript
this.authService.currentUser$.subscribe((user) => {
  if (user) {
    this.initializeApp();
  } else {
    this.isAppInitialized = false; // ✅ Reset flag
    this.socketService.disconnect();
    this.appNotificationService.clearData();
  }
});
```

**Lợi ích:**
- Khi user logout rồi login lại, app sẽ init lại bình thường
- Flag được reset đúng lúc

## So Sánh Code

### Trước:

```typescript
export class AppComponent implements OnInit {
  ngOnInit(): void {
    // ❌ Duplicate subscriptions
    this.authService.authInitialized$.subscribe((initialized) => {
      if (initialized) {
        this.initializeApp(); // Gọi lần 1
      }
    });

    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.initializeApp(); // Gọi lần 2
      } else {
        this.cleanup();
      }
    });

    // ❌ Không unsubscribe
    this.socketService.isConnected$.subscribe(...);
  }

  private initializeApp(): void {
    // ❌ Không có protection
    if (user) {
      this.socketService.connect('', user);
      this.loadNotifications();
    }
  }

  // ❌ Không có ngOnDestroy
}
```

### Sau:

```typescript
export class AppComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private isAppInitialized = false;

  ngOnInit(): void {
    // ✅ Chỉ 1 subscription với proper cleanup
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (user) {
          this.initializeApp();
        } else {
          this.isAppInitialized = false;
          this.cleanup();
        }
      });

    this.socketService.isConnected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(...);
  }

  private initializeApp(): void {
    const user = this.authService.getCurrentUser();

    // ✅ Protection chống duplicate
    if (!user || this.isAppInitialized) {
      return;
    }

    // Initialize
    this.socketService.connect('', user);
    this.loadNotifications();
    
    this.isAppInitialized = true;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

## Timeline Hoạt Động

### Khi User Login:

```
1. User login thành công
2. AuthService update currentUser$ → emit user
3. AppComponent nhận user từ subscription
4. Gọi initializeApp()
5. Kiểm tra isAppInitialized = false → OK
6. Connect socket
7. Load notifications
8. Set isAppInitialized = true
9. ✅ Done (chỉ 1 lần)
```

### Khi User Logout:

```
1. User logout
2. AuthService update currentUser$ → emit null
3. AppComponent nhận null từ subscription
4. Set isAppInitialized = false
5. Disconnect socket
6. Clear notifications
7. ✅ Done
```

### Khi currentUser$ Emit Lại (không phải logout):

```
1. currentUser$ emit user (lần 2)
2. AppComponent nhận user
3. Gọi initializeApp()
4. Kiểm tra isAppInitialized = true → SKIP
5. ✅ Không làm gì (tránh duplicate)
```

## Lợi Ích

### Performance:
- ✅ Không còn duplicate initialization
- ✅ Socket chỉ connect 1 lần
- ✅ Notifications chỉ load 1 lần
- ✅ Tiết kiệm resources

### Memory:
- ✅ Không còn memory leak
- ✅ Subscriptions được cleanup đúng cách
- ✅ Không còn zombie subscriptions

### Maintainability:
- ✅ Code rõ ràng, dễ hiểu
- ✅ Logic đơn giản hơn
- ✅ Dễ debug và test

### Reliability:
- ✅ Không còn race conditions
- ✅ Behavior nhất quán
- ✅ Ít bugs hơn

## Testing

### Test 1: Login
1. Mở app (chưa login)
2. Login
3. Kiểm tra console:
   - ✅ Chỉ thấy "Initializing app" 1 lần
   - ✅ Socket connect 1 lần
   - ✅ Load notifications 1 lần

### Test 2: Logout
1. Đang login
2. Logout
3. Kiểm tra console:
   - ✅ "User logged out, cleaning up"
   - ✅ Socket disconnect
   - ✅ Notifications cleared

### Test 3: Reload Page
1. Đang login
2. Reload page (F5)
3. Kiểm tra console:
   - ✅ App init lại bình thường
   - ✅ Chỉ init 1 lần
   - ✅ Socket reconnect thành công

### Test 4: Login → Logout → Login
1. Login lần 1
2. Logout
3. Login lần 2
4. Kiểm tra:
   - ✅ Mỗi lần login chỉ init 1 lần
   - ✅ Flag được reset đúng
   - ✅ Không có duplicate

## Kết Luận

Logic mới:
- ✅ Đơn giản hơn (bỏ duplicate subscription)
- ✅ An toàn hơn (proper cleanup)
- ✅ Hiệu quả hơn (chống duplicate)
- ✅ Dễ maintain hơn (clear logic)

Đây là best practice cho Angular component lifecycle management.
