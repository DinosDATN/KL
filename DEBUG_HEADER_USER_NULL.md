# Debug: Header User Null Issue

## Vấn Đề

Header component log ra `user = null` nhưng frontend vẫn hiển thị thông tin user đầy đủ.

## Nguyên Nhân Có Thể

### 1. **Multiple Subscriptions**
```typescript
// Có thể có nhiều subscriptions đang chạy
this.authService.currentUser$.subscribe(...); // ← Subscription 1
// Somewhere else
this.authService.currentUser$.subscribe(...); // ← Subscription 2
```

### 2. **SSR vs Client Hydration**
```
SSR: user = null (không có localStorage)
Client: user = User object (có localStorage)
```

### 3. **Timing Issue**
```
t1: authInitialized$ emit true
t2: switchMap sang currentUser$
t3: currentUser$ emit null (giá trị ban đầu)
t4: Header log "user = null"
t5: AuthService verify session
t6: currentUser$ emit User object
t7: Header log "user = User" (nhưng bạn không thấy log này?)
```

### 4. **BehaviorSubject Initial Value**
```typescript
// AuthService constructor
private currentUserSubject = new BehaviorSubject<User | null>(null);
//                                                            ↑
//                                                    Initial value = null
```

## Debug Steps

### 1. Thêm Detailed Logging

**Header Component:**
```typescript
.subscribe((user) => {
  console.log('[Header] User subscription fired:', {
    user: user,
    userName: user?.name,
    isNull: user === null,
    timestamp: new Date().toISOString(),
    authLoaded: this.authLoaded
  });
  
  this.currentUser = user;
  this.isAuthenticated = !!user;
  this.authLoaded = true;
  this.updateUserMenuItems();
});
```

**AuthService:**
```typescript
// Constructor
console.log('[Auth] AuthService constructor called');

// initializeAuthState
console.log('[Auth] Initializing auth state:', {
  hasUserInStorage: !!user,
  userName: user?.name
});

// After verify
console.log('[Auth] Session verified, updating currentUser$:', user.name);
```

### 2. Check Console Output

Mở DevTools Console và reload page. Bạn sẽ thấy:

```
[Auth] AuthService constructor called
[Auth] Browser detected, scheduling auth initialization
[Auth] Initializing auth state: { hasUserInStorage: true, userName: "Duy Khang" }
[Header] User subscription fired: { user: null, isNull: true, timestamp: "...", authLoaded: false }
[Auth] Session verified, updating currentUser$: Duy Khang
[Header] User subscription fired: { user: {...}, userName: "Duy Khang", isNull: false, timestamp: "...", authLoaded: true }
```

### 3. Possible Scenarios

#### Scenario A: Normal Flow (Expected)
```
1. [Auth] Constructor called
2. [Header] User = null (BehaviorSubject initial value)
3. [Auth] Session verified
4. [Header] User = User object
```

**Kết quả:** Bạn thấy 2 logs, log đầu `user = null`, log sau `user = User`

#### Scenario B: Only Null Log (Your Issue)
```
1. [Auth] Constructor called
2. [Header] User = null (BehaviorSubject initial value)
3. [Auth] Session verify fails hoặc không chạy
4. No second log
```

**Kết quả:** Chỉ thấy 1 log `user = null`

#### Scenario C: Template Uses Different Data
```
1. Header component: user = null
2. Template binds to different property
3. UI shows user data from elsewhere
```

### 4. Check Template Bindings

**Kiểm tra template có đang bind đúng property không:**

```html
<!-- header.component.html -->
<span>{{ currentUser?.name }}</span>
<!-- ↑ Có đang dùng đúng currentUser không? -->

<!-- Có thể đang dùng property khác? -->
<span>{{ user?.name }}</span>
<span>{{ authService.getCurrentUser()?.name }}</span>
```

### 5. Check Multiple Component Instances

**Có thể có nhiều HeaderComponent instances:**

```typescript
// Thêm vào constructor
constructor(...) {
  console.log('[Header] Component instance created:', Math.random());
  // ...
}
```

### 6. Check AuthService State

**Thêm vào header component:**

```typescript
.subscribe((user) => {
  console.log('[Header] Debug info:', {
    subscriptionUser: user,
    currentUserProperty: this.currentUser,
    authServiceGetCurrentUser: this.authService.getCurrentUser(),
    isAuthenticatedSubject: this.authService.isAuthenticated$.value,
    authInitialized: this.authService.authInitialized$.value
  });
});
```

## Debugging Commands

### 1. Check Console Logs
```bash
1. Open DevTools → Console
2. Reload page
3. Look for logs starting with [Auth] and [Header]
4. Count how many times each log appears
```

### 2. Check Network Tab
```bash
1. Open DevTools → Network
2. Reload page
3. Look for:
   - GET /auth/profile (should return 200 with user data)
   - Any 401 errors
```

### 3. Check Application Tab
```bash
1. Open DevTools → Application → Local Storage
2. Look for 'auth_user' key
3. Check if it contains valid user data
```

### 4. Check Elements Tab
```bash
1. Open DevTools → Elements
2. Find header element
3. Check if user name is actually displayed
4. Check if there are multiple header elements
```

## Possible Solutions

### Solution 1: Template Issue
```html
<!-- ❌ Wrong property -->
<span>{{ user?.name }}</span>

<!-- ✅ Correct property -->
<span>{{ currentUser?.name }}</span>
```

### Solution 2: Multiple Subscriptions
```typescript
// ❌ Multiple subscriptions
ngOnInit() {
  this.authService.currentUser$.subscribe(...); // Subscription 1
}

constructor() {
  this.authService.currentUser$.subscribe(...); // Subscription 2
}

// ✅ Single subscription
constructor() {
  this.authService.currentUser$.subscribe(...); // Only one
}
```

### Solution 3: Check Subscription Timing
```typescript
// Add delay to see if second emission happens
.subscribe((user) => {
  setTimeout(() => {
    console.log('[Header] Delayed check:', {
      user: this.currentUser,
      authService: this.authService.getCurrentUser()
    });
  }, 1000);
});
```

### Solution 4: Force Refresh
```typescript
// Manually trigger auth check
ngOnInit() {
  // Force check after component init
  setTimeout(() => {
    this.authService.checkSession().subscribe();
  }, 100);
}
```

## Expected vs Actual

### Expected Behavior:
```
1. Page load
2. Header shows skeleton
3. AuthService verifies session
4. Header shows user info
5. Console shows 2 logs: null → User
```

### Your Actual Behavior:
```
1. Page load
2. Header shows user info (somehow)
3. Console shows 1 log: null
4. No second log with User
```

## Next Steps

1. **Add detailed logging** (already done above)
2. **Reload page and check console**
3. **Count number of logs**
4. **Check if second log appears after delay**
5. **Verify template bindings**
6. **Check for multiple component instances**

## Hypothesis

**Most likely cause:** Template đang bind vào property khác hoặc có caching mechanism nào đó.

**Test:** Thay đổi `currentUser` property name thành `headerUser` và update template để xem UI có break không.

```typescript
// header.component.ts
this.headerUser = user; // Instead of this.currentUser

// header.component.html
<span>{{ headerUser?.name }}</span> <!-- Instead of currentUser -->
```

Nếu UI vẫn hiển thị user name thì chứng tỏ template đang bind vào source khác!