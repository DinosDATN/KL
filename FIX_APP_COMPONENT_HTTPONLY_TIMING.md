# Sửa Timing Issue với HttpOnly Cookies trong App Component

## Vấn Đề

Khi sử dụng HttpOnly Cookies cho authentication, có vấn đề về timing trong `app.component.ts`:

### Timeline Cũ (CÓ VẤN ĐỀ):

```
t0: App load
t1: AppComponent.ngOnInit() 
    → Subscribe currentUser$ ngay lập tức
t2: currentUser$ emit giá trị ban đầu = null (từ BehaviorSubject)
    → AppComponent nhận null → Không làm gì
t3: AuthService.constructor 
    → setTimeout(0) → initializeAuthState()
t4: initializeAuthState() 
    → Đọc localStorage → Có user data
    → Gọi getProfile() API (verify HttpOnly cookie)
t5: API response thành công
    → currentUser$ emit user
t6: AppComponent nhận user → initializeApp()
```

**Vấn đề:**
- AppComponent subscribe `currentUser$` quá sớm
- Nhận giá trị `null` ban đầu trước khi AuthService verify session
- Phải đợi AuthService verify xong mới có user
- Có thể miss timing nếu logic phức tạp hơn

### Vấn Đề Với Logout Detection:

**Code cũ:**
```typescript
this.authService.currentUser$.subscribe((user) => {
  if (user) {
    this.initializeApp();
  } else {
    // ❌ VẤN ĐỀ: Chạy ngay cả khi app mới load (user = null ban đầu)
    this.cleanup();
  }
});
```

**Vấn đề:**
- Khi app load lần đầu, `currentUser$` emit `null`
- Block `else` chạy → Gọi `cleanup()` không cần thiết
- Disconnect socket, clear notifications khi chưa có gì để cleanup

## Giải Pháp

### 1. Đợi Auth Initialized Trước

**Sử dụng `authInitialized$` để đảm bảo AuthService đã verify session:**

```typescript
this.authService.authInitialized$
  .pipe(
    takeUntil(this.destroy$),
    filter(initialized => initialized === true), // Đợi initialized
    take(1), // Chỉ lấy 1 lần
    switchMap(() => this.authService.currentUser$) // Sau đó mới subscribe currentUser$
  )
  .subscribe((user) => {
    if (user) {
      console.log('✅ User authenticated (after auth initialized)');
      this.initializeApp();
    } else {
      console.log('ℹ️ No user after auth initialized');
    }
  });
```

**Timeline Mới:**

```
t0: App load
t1: AppComponent.ngOnInit()
    → Subscribe authInitialized$ (đợi)
t2: AuthService.constructor
    → setTimeout(0) → initializeAuthState()
t3: initializeAuthState()
    → Đọc localStorage → Có user data
    → Gọi getProfile() API (verify HttpOnly cookie)
t4: API response thành công
    → Update currentUser$
    → authInitialized$ emit true ← TRIGGER!
t5: AppComponent nhận signal authInitialized = true
    → switchMap sang currentUser$
    → Nhận user
    → initializeApp() ✅
```

**Lợi ích:**
- ✅ Đảm bảo AuthService đã verify session với server (qua HttpOnly cookie)
- ✅ Không nhận giá trị `null` ban đầu
- ✅ Chỉ init app khi đã có kết quả xác thực rõ ràng
- ✅ Timing chính xác với HttpOnly cookie flow

### 2. Tách Riêng Logout Detection

**Sử dụng `pairwise()` để detect logout:**

```typescript
this.authService.currentUser$
  .pipe(
    takeUntil(this.destroy$),
    pairwise() // Lấy [previous, current] value
  )
  .subscribe(([prevUser, currentUser]) => {
    // Chỉ cleanup khi user logout (từ có user → không có user)
    if (prevUser && !currentUser) {
      console.log('❌ User logged out, cleaning up');
      this.isAppInitialized = false;
      this.socketService.disconnect();
      this.appNotificationService.clearData();
    }
  });
```

**Lợi ích:**
- ✅ Chỉ cleanup khi thực sự logout (prevUser có, currentUser null)
- ✅ Không cleanup khi app mới load (chưa có prevUser)
- ✅ Logic rõ ràng, dễ hiểu

## So Sánh Code

### Trước (CÓ VẤN ĐỀ):

```typescript
ngOnInit(): void {
  // ❌ Subscribe ngay, nhận null ban đầu
  this.authService.currentUser$.subscribe((user) => {
    if (user) {
      this.initializeApp();
    } else {
      // ❌ Chạy cả khi app mới load
      this.cleanup();
    }
  });
}
```

**Vấn đề:**
- Subscribe quá sớm, trước khi AuthService verify session
- Cleanup chạy không cần thiết khi app load
- Không đảm bảo HttpOnly cookie đã được verify

### Sau (ĐÚNG):

```typescript
ngOnInit(): void {
  // ✅ Đợi auth initialized, sau đó mới subscribe currentUser$
  this.authService.authInitialized$
    .pipe(
      takeUntil(this.destroy$),
      filter(initialized => initialized === true),
      take(1),
      switchMap(() => this.authService.currentUser$)
    )
    .subscribe((user) => {
      if (user) {
        this.initializeApp();
      }
    });

  // ✅ Riêng biệt: Detect logout
  this.authService.currentUser$
    .pipe(
      takeUntil(this.destroy$),
      pairwise()
    )
    .subscribe(([prevUser, currentUser]) => {
      if (prevUser && !currentUser) {
        this.cleanup();
      }
    });
}
```

**Lợi ích:**
- ✅ Đợi AuthService verify session với server
- ✅ Đảm bảo HttpOnly cookie được check
- ✅ Cleanup chỉ chạy khi thực sự logout
- ✅ Logic rõ ràng, tách biệt concerns

## Flow Chi Tiết

### Scenario 1: User Đã Login (Có HttpOnly Cookie)

```
1. App load
2. AppComponent subscribe authInitialized$ (đợi)
3. AuthService.initializeAuthState()
   - Đọc localStorage → Có user data
   - Gọi API /auth/profile (HttpOnly cookie tự động gửi)
4. API response 200 OK với user data
   - AuthService update currentUser$ = user
   - AuthService emit authInitialized$ = true
5. AppComponent nhận authInitialized = true
   - switchMap sang currentUser$
   - Nhận user
   - Gọi initializeApp()
   - Connect socket
   - Load notifications
6. ✅ App ready
```

### Scenario 2: User Chưa Login (Không Có Cookie)

```
1. App load
2. AppComponent subscribe authInitialized$ (đợi)
3. AuthService.initializeAuthState()
   - Đọc localStorage → Không có user data
   - Không gọi API
   - Emit authInitialized$ = true
4. AppComponent nhận authInitialized = true
   - switchMap sang currentUser$
   - Nhận null
   - Không làm gì (không init app)
5. ✅ App ready (guest mode)
```

### Scenario 3: User Logout

```
1. User đang login, app đã init
2. User click logout
3. AuthService.logout()
   - Gọi API /auth/logout
   - Clear localStorage
   - Update currentUser$ = null
4. AppComponent nhận qua pairwise:
   - prevUser = user (có)
   - currentUser = null (không có)
   - Điều kiện match → Cleanup
5. Disconnect socket
6. Clear notifications
7. Reset isAppInitialized = false
8. ✅ Cleanup complete
```

### Scenario 4: HttpOnly Cookie Expired

```
1. App load
2. AppComponent subscribe authInitialized$ (đợi)
3. AuthService.initializeAuthState()
   - Đọc localStorage → Có user data (cũ)
   - Gọi API /auth/profile (HttpOnly cookie expired)
4. API response 401 Unauthorized
   - AuthService clear auth data
   - Update currentUser$ = null
   - Emit authInitialized$ = true
5. AppComponent nhận authInitialized = true
   - switchMap sang currentUser$
   - Nhận null
   - Không init app
6. ✅ App ready (guest mode, user cần login lại)
```

## Tại Sao Cần Đợi authInitialized$?

### Với HttpOnly Cookies:

1. **Token không ở client**: Frontend không có token, chỉ có user data trong localStorage
2. **Phải verify với server**: Cần gọi API để verify HttpOnly cookie còn valid không
3. **Async operation**: Việc verify là async, mất thời gian
4. **Race condition**: Nếu không đợi, có thể init app với user data cũ nhưng cookie đã expired

### authInitialized$ Đảm Bảo:

- ✅ AuthService đã check localStorage
- ✅ Nếu có user data, đã verify với server qua HttpOnly cookie
- ✅ currentUser$ đã có giá trị chính xác (user hoặc null)
- ✅ An toàn để init app hoặc hiển thị guest mode

## Testing

### Test 1: Login → Reload Page

```bash
1. Login vào app
2. Reload page (F5)
3. Kiểm tra console:
   ✅ "Auth initialized"
   ✅ "User authenticated (after auth initialized)"
   ✅ "Initializing app" (chỉ 1 lần)
   ✅ Socket connect
   ✅ Notifications load
```

### Test 2: Chưa Login → Load Page

```bash
1. Chưa login
2. Load page
3. Kiểm tra console:
   ✅ "Auth initialized"
   ✅ "No user after auth initialized"
   ✅ Không có "Initializing app"
   ✅ Không có socket connect
```

### Test 3: Login → Logout

```bash
1. Đang login
2. Click logout
3. Kiểm tra console:
   ✅ "User logged out, cleaning up"
   ✅ Socket disconnect
   ✅ Notifications cleared
   ✅ isAppInitialized = false
```

### Test 4: Cookie Expired → Reload

```bash
1. Login
2. Xóa HttpOnly cookie (DevTools)
3. Reload page
4. Kiểm tra console:
   ✅ "Session verification failed"
   ✅ "No user after auth initialized"
   ✅ Không init app
   ✅ User cần login lại
```

## Kết Luận

**Logic mới đảm bảo:**

1. ✅ **Timing chính xác**: Đợi AuthService verify HttpOnly cookie trước
2. ✅ **Không có race condition**: authInitialized$ đảm bảo sync
3. ✅ **Cleanup đúng lúc**: Chỉ cleanup khi thực sự logout
4. ✅ **HttpOnly cookie compatible**: Hoạt động hoàn hảo với cookie-based auth
5. ✅ **No memory leak**: Proper cleanup với takeUntil
6. ✅ **No duplicate init**: Flag chống duplicate vẫn hoạt động

**Đây là best practice cho HttpOnly cookie authentication trong Angular!**
