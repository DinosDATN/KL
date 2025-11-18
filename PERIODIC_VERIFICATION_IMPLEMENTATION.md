# Periodic Session Verification - Implementation Complete

## Tổng Quan

Đã implement periodic verification để tự động kiểm tra session mỗi 5 phút, giúp:
- ✅ Auto-detect khi cookie expired
- ✅ Auto-logout user khi session invalid
- ✅ Sync user data với server
- ✅ Better security và UX

## Implementation Details

### 1. Thêm Properties

```typescript
export class AuthService implements OnDestroy {
  private readonly VERIFICATION_INTERVAL = 5 * 60 * 1000; // 5 minutes
  
  // Periodic verification
  private verificationTimer?: any;
  private isVerifying = false;
}
```

### 2. Start Verification on Init

```typescript
constructor(private http: HttpClient) {
  if (typeof window === 'undefined') {
    this.authInitialized.next(true);
    return;
  }

  setTimeout(() => {
    this.initializeAuthState();
    this.startPeriodicVerification(); // ← Start timer
  }, 0);
}
```

### 3. Periodic Verification Method

```typescript
private startPeriodicVerification(): void {
  // Clear any existing timer
  this.stopPeriodicVerification();

  // Start new timer - verify every 5 minutes
  this.verificationTimer = setInterval(() => {
    this.verifySession();
  }, this.VERIFICATION_INTERVAL);

  if (environment.enableLogging) {
    console.log('[Auth] Periodic verification started (every 5 minutes)');
  }
}
```

### 4. Session Verification Logic

```typescript
private verifySession(): void {
  // Skip if not authenticated or already verifying
  if (!this.isAuthenticatedSubject.value || this.isVerifying) {
    return;
  }

  this.isVerifying = true;

  this.getProfile().subscribe({
    next: (response) => {
      // Update user data if changed
      const currentUser = this.currentUserSubject.value;
      const newUser = response.data.user;
      
      if (JSON.stringify(currentUser) !== JSON.stringify(newUser)) {
        if (environment.enableLogging) {
          console.log('[Auth] User data updated from server');
        }
        this.updateUserData(newUser);
      }
      
      this.isVerifying = false;
    },
    error: (error) => {
      this.isVerifying = false;
      
      // If 401, session expired - logout user
      if (error.status === 401) {
        if (environment.enableLogging) {
          console.warn('[Auth] Session expired during verification, logging out');
        }
        this.clearAuthData();
        this.stopPeriodicVerification();
      }
    }
  });
}
```

### 5. Stop Verification

```typescript
private stopPeriodicVerification(): void {
  if (this.verificationTimer) {
    clearInterval(this.verificationTimer);
    this.verificationTimer = undefined;
    
    if (environment.enableLogging) {
      console.log('[Auth] Periodic verification stopped');
    }
  }
}
```

### 6. Cleanup

```typescript
// Stop when user logs out
private clearAuthData(): void {
  this.stopPeriodicVerification(); // ← Stop timer
  // ... rest of cleanup
}

// Stop when service destroyed
ngOnDestroy(): void {
  this.stopPeriodicVerification();
}
```

### 7. Manual Check Method (Bonus)

```typescript
/**
 * Manually trigger session verification
 * Useful for checking session after user action
 */
public checkSession(): Observable<boolean> {
  return new Observable(observer => {
    if (!this.isAuthenticatedSubject.value) {
      observer.next(false);
      observer.complete();
      return;
    }

    this.getProfile().subscribe({
      next: () => {
        observer.next(true);
        observer.complete();
      },
      error: () => {
        this.clearAuthData();
        observer.next(false);
        observer.complete();
      }
    });
  });
}
```

## How It Works

### Timeline:

```
t0: User login
    → Start periodic verification timer

t0 + 5min: First verification
    → Call /auth/profile
    → If 200: Update user data
    → If 401: Auto logout

t0 + 10min: Second verification
    → Call /auth/profile
    → ...

t0 + 15min: Third verification
    → ...

User logout:
    → Stop verification timer
```

### Flow Diagram:

```
┌─────────────────────────────────────────┐
│         User Authenticated              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Start Periodic Verification Timer     │
│         (Every 5 minutes)                │
└──────────────┬──────────────────────────┘
               │
               ▼
       ┌───────────────┐
       │  Timer Fires  │
       └───────┬───────┘
               │
               ▼
       ┌───────────────┐
       │ verifySession │
       └───────┬───────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
   ┌────────┐    ┌────────┐
   │ 200 OK │    │ 401    │
   └────┬───┘    └────┬───┘
        │             │
        ▼             ▼
  ┌──────────┐  ┌──────────┐
  │  Update  │  │  Logout  │
  │   User   │  │   User   │
  └──────────┘  └──────────┘
```

## Benefits

### 1. Auto-Detect Cookie Expiration

**Scenario:**
```
User login at 9:00 AM
Cookie expires at 9:30 AM (30 min TTL)

Without periodic verification:
- User continues using app
- Next API call at 10:00 AM → 401 error
- Unexpected logout

With periodic verification:
- 9:05 AM: Verify → OK
- 9:10 AM: Verify → OK
- 9:15 AM: Verify → OK
- 9:20 AM: Verify → OK
- 9:25 AM: Verify → OK
- 9:30 AM: Verify → 401 → Auto logout
- User sees logout immediately, not on next action
```

### 2. Sync User Data

**Scenario:**
```
User updates profile in another tab/device
Admin changes user role

With periodic verification:
- Every 5 minutes, fetch latest user data
- UI updates automatically
- No need to refresh page
```

### 3. Better Security

**Scenario:**
```
Admin revokes user access
Admin bans user account

With periodic verification:
- Within 5 minutes, user is logged out
- No need to wait for next API call
```

### 4. Graceful Session Management

**Scenario:**
```
Backend extends session on activity
Backend implements sliding window

With periodic verification:
- Regular API calls keep session alive
- User stays logged in while active
- Auto logout when truly inactive
```

## Configuration

### Adjust Verification Interval:

```typescript
// auth.service.ts
private readonly VERIFICATION_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Change to:
private readonly VERIFICATION_INTERVAL = 10 * 60 * 1000; // 10 minutes
// or
private readonly VERIFICATION_INTERVAL = 2 * 60 * 1000; // 2 minutes
```

**Recommendations:**
- **5 minutes**: Good balance (default)
- **2-3 minutes**: High security apps
- **10 minutes**: Low traffic apps
- **1 minute**: Real-time critical apps (but more server load)

### Disable in Development:

```typescript
// environment.ts
export const environment = {
  production: false,
  enablePeriodicVerification: false, // ← Add this
  // ...
};

// auth.service.ts
private startPeriodicVerification(): void {
  if (!environment.enablePeriodicVerification) {
    return; // Skip in dev
  }
  // ... rest of code
}
```

## Usage Examples

### Manual Session Check:

```typescript
// In any component
export class MyComponent {
  constructor(private authService: AuthService) {}

  async checkIfStillLoggedIn() {
    const isValid = await firstValueFrom(this.authService.checkSession());
    
    if (isValid) {
      console.log('Session is valid');
    } else {
      console.log('Session expired, user logged out');
    }
  }
}
```

### Before Critical Action:

```typescript
// Before submitting important form
async submitForm() {
  // Check session first
  const isValid = await firstValueFrom(this.authService.checkSession());
  
  if (!isValid) {
    this.notificationService.error('Session expired', 'Please login again');
    return;
  }

  // Proceed with form submission
  this.api.submitForm(this.formData).subscribe(...);
}
```

## Testing

### Test 1: Normal Operation
```bash
1. Login
2. Wait 5 minutes
3. Check console:
   ✅ "[Auth] Periodic verification started"
   ✅ No errors
4. Check Network tab:
   ✅ GET /auth/profile every 5 minutes
```

### Test 2: Cookie Expiration
```bash
1. Login
2. Manually delete cookie in DevTools
3. Wait for next verification (max 5 min)
4. Check:
   ✅ "[Auth] Session expired during verification, logging out"
   ✅ User logged out automatically
   ✅ Redirected to login page
```

### Test 3: User Data Update
```bash
1. Login as user A
2. In another tab, update user profile
3. Wait for verification
4. Check:
   ✅ "[Auth] User data updated from server"
   ✅ UI shows updated data
```

### Test 4: Logout
```bash
1. Login
2. Logout
3. Check console:
   ✅ "[Auth] Periodic verification stopped"
4. Check:
   ✅ No more API calls
   ✅ Timer cleared
```

## Performance Impact

### Network:
- **1 API call every 5 minutes** = 12 calls/hour = 288 calls/day
- **Payload**: ~1KB per call
- **Total**: ~288KB/day per user
- **Impact**: Negligible

### Server:
- **Load**: Minimal (simple profile fetch)
- **Caching**: Can be cached for 1-2 minutes
- **Optimization**: Use lightweight endpoint

### Client:
- **Memory**: ~100 bytes (timer reference)
- **CPU**: Negligible (1 API call every 5 min)
- **Battery**: No noticeable impact

## Best Practices

### 1. ✅ Use Exponential Backoff on Error

```typescript
private retryCount = 0;
private maxRetries = 3;

private verifySession(): void {
  // ... existing code ...
  
  error: (error) => {
    if (error.status === 401) {
      // Session expired - logout immediately
      this.clearAuthData();
    } else {
      // Network error - retry with backoff
      this.retryCount++;
      if (this.retryCount < this.maxRetries) {
        const delay = Math.pow(2, this.retryCount) * 1000;
        setTimeout(() => this.verifySession(), delay);
      }
    }
  }
}
```

### 2. ✅ Pause Verification When Tab Hidden

```typescript
constructor(private http: HttpClient) {
  // ... existing code ...
  
  if (typeof window !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopPeriodicVerification();
      } else {
        this.startPeriodicVerification();
        this.verifySession(); // Verify immediately when tab visible
      }
    });
  }
}
```

### 3. ✅ Verify on User Activity

```typescript
// In app.component.ts
@HostListener('window:focus')
onWindowFocus() {
  // Verify when user returns to tab
  this.authService.checkSession().subscribe();
}
```

## Kết Luận

**Periodic verification đã được implement thành công!**

### Features:
- ✅ Auto-verify every 5 minutes
- ✅ Auto-logout on cookie expiration
- ✅ Auto-sync user data
- ✅ Manual check method available
- ✅ Proper cleanup on logout/destroy
- ✅ Production-ready

### Benefits:
- ✅ Better security
- ✅ Better UX
- ✅ Automatic session management
- ✅ Minimal performance impact

**Your auth system is now enterprise-grade!** 🎉
