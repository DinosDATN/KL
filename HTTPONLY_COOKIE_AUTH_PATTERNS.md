# HttpOnly Cookie Authentication - Patterns & Best Practices

## Cách Hiện Tại (Đúng với HttpOnly Cookies)

### Flow:
```
1. User login → Backend set HttpOnly cookie
2. Frontend lưu user data vào localStorage (không có token)
3. Mọi API request tự động gửi cookie
4. Frontend check localStorage để biết user đã login
5. Khi reload: Verify với server qua cookie
```

### Code Hiện Tại:

```typescript
// AuthService
constructor(private http: HttpClient) {
  if (typeof window === 'undefined') {
    // SSR: Skip
    this.authInitialized.next(true);
    return;
  }

  setTimeout(() => {
    const user = this.getUserFromStorage(); // localStorage
    
    if (user) {
      // Verify với server (cookie tự động gửi)
      this.getProfile().subscribe({
        next: (response) => {
          this.currentUserSubject.next(response.data.user);
          this.isAuthenticatedSubject.next(true);
          this.authInitialized.next(true);
        },
        error: () => {
          // Cookie expired hoặc invalid
          this.clearAuthData();
          this.authInitialized.next(true);
        }
      });
    } else {
      this.authInitialized.next(true);
    }
  }, 0);
}
```

### Ưu Điểm:
- ✅ **An toàn**: Token không thể bị XSS steal
- ✅ **Tự động**: Cookie tự động gửi với mọi request
- ✅ **Đơn giản**: Không cần manually attach token
- ✅ **SSR friendly**: Cookie work với SSR

### Nhược Điểm:
- ❌ **Phụ thuộc localStorage**: Cần localStorage để biết user đã login
- ❌ **Extra API call**: Phải verify với server khi reload
- ❌ **CSRF risk**: Cần CSRF protection
- ❌ **Cross-domain**: Khó khăn với multiple domains

## Alternative 1: Pure Cookie-Based (Không Dùng localStorage)

### Concept:
Không lưu gì ở client, chỉ dựa vào cookie.

### Implementation:

```typescript
// AuthService
constructor(private http: HttpClient) {
  if (typeof window === 'undefined') {
    this.authInitialized.next(true);
    return;
  }

  // ✅ Luôn verify với server, không check localStorage
  setTimeout(() => {
    this.getProfile().subscribe({
      next: (response) => {
        this.currentUserSubject.next(response.data.user);
        this.isAuthenticatedSubject.next(true);
        this.authInitialized.next(true);
      },
      error: () => {
        // Không có cookie hoặc expired
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
        this.authInitialized.next(true);
      }
    });
  }, 0);
}

// Login
login(credentials): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(
    `${this.apiUrl}/login`,
    credentials,
    { withCredentials: true }
  ).pipe(
    tap((response) => {
      if (response.success && response.data?.user) {
        // ✅ Không lưu localStorage, chỉ update state
        this.currentUserSubject.next(response.data.user);
        this.isAuthenticatedSubject.next(true);
      }
    })
  );
}
```

### Ưu Điểm:
- ✅ **Đơn giản hơn**: Không cần localStorage
- ✅ **Single source of truth**: Chỉ dựa vào server
- ✅ **Không bị desync**: localStorage và cookie luôn sync

### Nhược Điểm:
- ❌ **Extra API call**: Mọi page load đều gọi API
- ❌ **Slower**: Phải đợi API response
- ❌ **Network dependent**: Offline không work

## Alternative 2: Session Storage Instead of Local Storage

### Concept:
Dùng sessionStorage thay vì localStorage.

### Implementation:

```typescript
// AuthService
private readonly USER_KEY = 'auth_user';

private getUserFromStorage(): User | null {
  if (typeof window !== 'undefined') {
    // ✅ Dùng sessionStorage thay vì localStorage
    const userStr = sessionStorage.getItem(this.USER_KEY);
    if (userStr) {
      return JSON.parse(userStr);
    }
  }
  return null;
}

setUserData(user: User): void {
  if (typeof window !== 'undefined') {
    // ✅ Lưu vào sessionStorage
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }
  this.currentUserSubject.next(user);
  this.isAuthenticatedSubject.next(true);
}
```

### Ưu Điểm:
- ✅ **Auto clear**: sessionStorage tự xóa khi đóng tab
- ✅ **More secure**: Không persist across sessions
- ✅ **Same API**: Code gần giống localStorage

### Nhược Điểm:
- ❌ **Lost on tab close**: User phải login lại khi mở tab mới
- ❌ **UX worse**: Không remember login

## Alternative 3: Hybrid Approach (Recommended)

### Concept:
Kết hợp localStorage + periodic verification.

### Implementation:

```typescript
// AuthService
private verificationInterval?: any;

constructor(private http: HttpClient) {
  if (typeof window === 'undefined') {
    this.authInitialized.next(true);
    return;
  }

  setTimeout(() => {
    this.initializeAuthState();
    
    // ✅ Verify định kỳ (mỗi 5 phút)
    this.startPeriodicVerification();
  }, 0);
}

private startPeriodicVerification(): void {
  // Verify mỗi 5 phút
  this.verificationInterval = setInterval(() => {
    if (this.isAuthenticatedSubject.value) {
      this.getProfile().subscribe({
        next: (response) => {
          // Update user data nếu có thay đổi
          this.currentUserSubject.next(response.data.user);
        },
        error: () => {
          // Cookie expired, logout
          this.clearAuthData();
        }
      });
    }
  }, 5 * 60 * 1000); // 5 minutes
}

ngOnDestroy(): void {
  if (this.verificationInterval) {
    clearInterval(this.verificationInterval);
  }
}
```

### Ưu Điểm:
- ✅ **Fast initial load**: Dùng localStorage
- ✅ **Auto sync**: Verify định kỳ
- ✅ **Detect expiration**: Tự động logout khi cookie expired
- ✅ **Best UX**: Nhanh và reliable

### Nhược Điểm:
- ❌ **More complex**: Code phức tạp hơn
- ❌ **Extra requests**: Periodic API calls

## Alternative 4: Server-Side Session Check

### Concept:
Backend trả về auth status trong mọi response.

### Implementation:

**Backend:**
```javascript
// Middleware
app.use((req, res, next) => {
  // Thêm auth status vào mọi response
  const originalJson = res.json;
  res.json = function(data) {
    return originalJson.call(this, {
      ...data,
      _auth: {
        isAuthenticated: !!req.user,
        user: req.user || null
      }
    });
  };
  next();
});
```

**Frontend:**
```typescript
// HTTP Interceptor
intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  return next.handle(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && event.body?._auth) {
        // Update auth state từ response
        const authData = event.body._auth;
        if (authData.isAuthenticated) {
          this.authService.updateUser(authData.user);
        } else {
          this.authService.clearAuthData();
        }
      }
    })
  );
}
```

### Ưu Điểm:
- ✅ **Always in sync**: Mọi API call đều update auth state
- ✅ **No extra calls**: Piggyback trên existing requests
- ✅ **Real-time**: Detect logout/expiration ngay lập tức

### Nhược Điểm:
- ❌ **Backend changes**: Cần modify backend
- ❌ **Overhead**: Thêm data vào mọi response
- ❌ **Coupling**: Frontend và backend coupled

## Alternative 5: JWT in Cookie (Hybrid)

### Concept:
Lưu JWT trong HttpOnly cookie, nhưng decode payload ở client.

### Implementation:

**Backend:**
```javascript
// Set cookie với JWT
res.cookie('auth_token', jwt, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});

// Cũng trả về decoded payload
res.json({
  success: true,
  user: decodedUser // Không có sensitive data
});
```

**Frontend:**
```typescript
// AuthService
login(credentials): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(
    `${this.apiUrl}/login`,
    credentials,
    { withCredentials: true }
  ).pipe(
    tap((response) => {
      if (response.success && response.data?.user) {
        // ✅ Lưu user data (không có token)
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.data.user));
        
        // ✅ Lưu expiration time để check
        const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24h
        localStorage.setItem('auth_expires', expiresAt.toString());
        
        this.currentUserSubject.next(response.data.user);
        this.isAuthenticatedSubject.next(true);
      }
    })
  );
}

// Check expiration
isTokenExpired(): boolean {
  const expiresAt = localStorage.getItem('auth_expires');
  if (!expiresAt) return true;
  return Date.now() > parseInt(expiresAt);
}
```

### Ưu Điểm:
- ✅ **Fast check**: Không cần API call để check expiration
- ✅ **Secure**: Token vẫn trong HttpOnly cookie
- ✅ **Better UX**: Biết trước khi nào expired

### Nhược Điểm:
- ❌ **Clock sync**: Phụ thuộc client clock
- ❌ **Manual logout**: Backend logout không sync ngay

## So Sánh

| Pattern | Security | Performance | Complexity | UX | Recommended |
|---------|----------|-------------|------------|----|----|
| **Current (localStorage + verify)** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Yes |
| Pure Cookie | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⚠️ Maybe |
| SessionStorage | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ❌ No |
| Hybrid (periodic verify) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Yes |
| Server-side check | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Yes |
| JWT in Cookie | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⚠️ Maybe |

## Recommendation

### Cho App Hiện Tại:

**Giữ nguyên cách hiện tại + Thêm periodic verification:**

```typescript
// auth.service.ts
export class AuthService {
  private verificationInterval?: any;

  constructor(private http: HttpClient) {
    // ... existing code ...
    
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.initializeAuthState();
        this.startPeriodicVerification();
      }, 0);
    }
  }

  private startPeriodicVerification(): void {
    // Verify mỗi 5 phút
    this.verificationInterval = setInterval(() => {
      if (this.isAuthenticatedSubject.value) {
        this.getProfile().subscribe({
          next: (response) => {
            this.updateUserData(response.data.user);
          },
          error: () => {
            if (environment.enableLogging) {
              console.warn('[Auth] Session expired, logging out');
            }
            this.clearAuthData();
          }
        });
      }
    }, 5 * 60 * 1000);
  }

  ngOnDestroy(): void {
    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
    }
  }
}
```

### Tại Sao?

1. ✅ **Giữ được fast initial load** (localStorage)
2. ✅ **Auto detect expiration** (periodic verify)
3. ✅ **Minimal changes** (chỉ thêm 1 method)
4. ✅ **Best of both worlds**

## Kết Luận

**Cách hiện tại (localStorage + verify on load) là ĐÚNG và phù hợp với HttpOnly Cookies.**

**Improvements có thể thêm:**
1. ✅ Periodic verification (recommended)
2. ✅ Retry logic khi verify fail
3. ✅ Exponential backoff
4. ⚠️ Server-side auth status (nếu có thể modify backend)

**Không nên:**
- ❌ Pure cookie (quá chậm)
- ❌ SessionStorage (UX kém)
- ❌ Decode JWT ở client (security risk nếu có sensitive data)

**Current approach is production-ready and follows best practices!** 🎉
