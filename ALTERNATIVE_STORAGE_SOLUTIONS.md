# 🔐 Các Phương Án Thay Thế localStorage

## 📊 So Sánh Các Phương Án

| Phương Án | Bảo Mật | Persistence | SSR Support | Complexity | Recommended |
|-----------|---------|-------------|-------------|------------|-------------|
| localStorage | ⭐⭐ | ✅ Permanent | ❌ | ⭐ | Current |
| sessionStorage | ⭐⭐ | ⚠️ Session only | ❌ | ⭐ | Simple |
| Cookies (HttpOnly) | ⭐⭐⭐⭐⭐ | ✅ Permanent | ✅ | ⭐⭐⭐ | **Best** |
| IndexedDB | ⭐⭐⭐ | ✅ Permanent | ❌ | ⭐⭐⭐⭐ | Advanced |
| Memory Only | ⭐⭐⭐⭐ | ❌ Lost on refresh | ✅ | ⭐ | Temporary |
| Encrypted Storage | ⭐⭐⭐⭐ | ✅ Permanent | ❌ | ⭐⭐⭐⭐⭐ | Enterprise |

---

## 1️⃣ sessionStorage (Đơn Giản Nhất)

### Ưu Điểm
- ✅ Tương tự localStorage, dễ implement
- ✅ Tự động xóa khi đóng tab (bảo mật hơn)
- ✅ Không cần thay đổi nhiều code

### Nhược Điểm
- ❌ Mất token khi đóng tab
- ❌ Không có "Remember Me"
- ❌ Không support SSR

### Implementation

```typescript
// cli/src/app/core/services/storage.service.ts
import { Injectable } from '@angular/core';

export type StorageType = 'localStorage' | 'sessionStorage';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private storage: Storage;

  constructor() {
    // Default to sessionStorage for better security
    this.storage = typeof window !== 'undefined' ? sessionStorage : null as any;
  }

  setItem(key: string, value: string): void {
    if (this.storage) {
      this.storage.setItem(key, value);
    }
  }

  getItem(key: string): string | null {
    return this.storage ? this.storage.getItem(key) : null;
  }

  removeItem(key: string): void {
    if (this.storage) {
      this.storage.removeItem(key);
    }
  }

  clear(): void {
    if (this.storage) {
      this.storage.clear();
    }
  }

  // Switch between localStorage and sessionStorage
  switchStorage(type: StorageType): void {
    if (typeof window !== 'undefined') {
      this.storage = type === 'localStorage' ? localStorage : sessionStorage;
    }
  }
}
```

**Sử dụng trong AuthService**:

```typescript
constructor(
  private http: HttpClient,
  private storageService: StorageService
) {
  // Use sessionStorage by default
  this.storageService.switchStorage('sessionStorage');
  
  // Or use localStorage for "Remember Me"
  // this.storageService.switchStorage('localStorage');
}

setAuthData(token: string, user: User): void {
  this.storageService.setItem(this.TOKEN_KEY, token);
  this.storageService.setItem(this.USER_KEY, JSON.stringify(user));
  // ...
}
```

---

## 2️⃣ HttpOnly Cookies (RECOMMENDED - Bảo Mật Nhất)

### Ưu Điểm
- ✅✅✅ **Bảo mật cao nhất** - Không thể access từ JavaScript
- ✅ Tự động gửi trong mọi request
- ✅ Support SSR
- ✅ Chống XSS attacks
- ✅ Có thể set expiry time

### Nhược Điểm
- ⚠️ Cần thay đổi backend
- ⚠️ Phức tạp hơn một chút
- ⚠️ Cần cấu hình CORS đúng

### Backend Implementation

```javascript
// api/src/controllers/authController.js

const authController = {
  login: async (req, res) => {
    try {
      // ... validate user ...

      // Generate token
      const token = generateToken(user.id);

      // ✅ Set HttpOnly cookie instead of returning token
      res.cookie('auth_token', token, {
        httpOnly: true,        // Không thể access từ JavaScript
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict',    // CSRF protection
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      });

      // Return user data only (no token)
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.toAuthJSON()
          // ❌ No token in response
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login'
      });
    }
  },

  logout: async (req, res) => {
    try {
      // ✅ Clear cookie
      res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to logout'
      });
    }
  }
};
```

**Middleware để đọc cookie**:

```javascript
// api/src/middleware/authMiddleware.js

const authenticateToken = async (req, res, next) => {
  try {
    // ✅ Read token from cookie instead of Authorization header
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
        error: 'No token provided'
      });
    }

    // Verify token...
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};
```

**Install cookie-parser**:

```bash
cd api
npm install cookie-parser
```

**Setup trong app.js**:

```javascript
// api/src/app.js

const cookieParser = require('cookie-parser');

// Middleware
app.use(cookieParser());

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:4200',
  credentials: true // ✅ Important: Allow cookies
}));
```

### Frontend Implementation

```typescript
// cli/src/app/core/services/auth.service.ts

export class AuthService {
  // ❌ Không cần TOKEN_KEY nữa
  private readonly USER_KEY = 'auth_user';
  
  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`, 
      loginData,
      { withCredentials: true } // ✅ Important: Send cookies
    ).pipe(
      tap((response: AuthResponse) => {
        if (response.success && response.data?.user) {
          // ✅ Chỉ lưu user, không lưu token
          this.setUserData(response.data.user);
        }
      }),
      catchError(this.handleError)
    );
  }

  logout(): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/logout`, 
      {},
      { withCredentials: true } // ✅ Important: Send cookies
    ).pipe(
      tap(() => {
        this.clearAuthData();
      }),
      catchError((error) => {
        this.clearAuthData();
        return throwError(error);
      })
    );
  }

  getProfile(): Observable<{ success: boolean; data: { user: User } }> {
    return this.http.get<{ success: boolean; data: { user: User } }>(
      `${this.apiUrl}/profile`,
      { withCredentials: true } // ✅ Important: Send cookies
    ).pipe(
      tap((response) => {
        if (response.success && response.data.user) {
          this.updateUserData(response.data.user);
        }
      }),
      catchError(this.handleError)
    );
  }

  // ✅ Không cần getToken() nữa
  // Token được gửi tự động qua cookie

  private setUserData(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  private clearAuthData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.USER_KEY);
    }
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }
}
```

**Update HTTP Interceptor**:

```typescript
// cli/src/app/core/interceptors/auth.interceptor.ts

export class AuthInterceptor implements HttpInterceptor {
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // ✅ Không cần thêm Authorization header nữa
    // Cookie được gửi tự động
    
    // Clone request with credentials
    const authReq = req.clone({
      withCredentials: true // ✅ Important: Send cookies
    });

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token expired or invalid
          this.authService.clearAuthData();
          this.router.navigate(['/auth/login']);
        }
        return throwError(() => error);
      })
    );
  }
}
```

---

## 3️⃣ IndexedDB (Cho Dữ Liệu Lớn)

### Ưu Điểm
- ✅ Lưu được dữ liệu lớn (> 5MB)
- ✅ Async operations (không block UI)
- ✅ Có thể lưu objects phức tạp

### Nhược Điểm
- ❌ API phức tạp
- ❌ Không support SSR
- ❌ Overkill cho chỉ lưu token

### Implementation

```typescript
// cli/src/app/core/services/indexed-db.service.ts

import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AuthDB extends DBSchema {
  auth: {
    key: string;
    value: {
      token: string;
      user: any;
      timestamp: number;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class IndexedDBService {
  private db: IDBPDatabase<AuthDB> | null = null;

  async init(): Promise<void> {
    if (typeof window === 'undefined') return;

    this.db = await openDB<AuthDB>('auth-db', 1, {
      upgrade(db) {
        db.createObjectStore('auth');
      },
    });
  }

  async setAuthData(token: string, user: any): Promise<void> {
    if (!this.db) await this.init();
    
    await this.db?.put('auth', {
      token,
      user,
      timestamp: Date.now()
    }, 'current');
  }

  async getAuthData(): Promise<{ token: string; user: any } | null> {
    if (!this.db) await this.init();
    
    const data = await this.db?.get('auth', 'current');
    
    if (!data) return null;
    
    // Check if data is expired (7 days)
    const isExpired = Date.now() - data.timestamp > 7 * 24 * 60 * 60 * 1000;
    
    if (isExpired) {
      await this.clearAuthData();
      return null;
    }
    
    return {
      token: data.token,
      user: data.user
    };
  }

  async clearAuthData(): Promise<void> {
    if (!this.db) await this.init();
    await this.db?.delete('auth', 'current');
  }
}
```

**Install idb**:

```bash
cd cli
npm install idb
```

---

## 4️⃣ Memory Only (Tạm Thời)

### Ưu Điểm
- ✅ Bảo mật cao (không lưu disk)
- ✅ Support SSR
- ✅ Đơn giản

### Nhược Điểm
- ❌ Mất token khi refresh
- ❌ Không có persistence

### Implementation

```typescript
// cli/src/app/core/services/auth.service.ts

export class AuthService {
  // ✅ Chỉ lưu trong memory
  private tokenCache: string | null = null;
  private userCache: User | null = null;

  setAuthData(token: string, user: User): void {
    this.tokenCache = token;
    this.userCache = user;
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  getToken(): string | null {
    return this.tokenCache;
  }

  getCurrentUser(): User | null {
    return this.userCache;
  }

  clearAuthData(): void {
    this.tokenCache = null;
    this.userCache = null;
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }
}
```

---

## 5️⃣ Encrypted Storage (Enterprise)

### Ưu Điểm
- ✅✅✅ Bảo mật rất cao
- ✅ Persistence
- ✅ Chống tampering

### Nhược Điểm
- ❌ Phức tạp nhất
- ❌ Cần encryption key management
- ❌ Performance overhead

### Implementation

```typescript
// cli/src/app/core/services/encrypted-storage.service.ts

import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class EncryptedStorageService {
  private readonly SECRET_KEY = 'your-secret-key'; // ⚠️ Should be from environment

  encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, this.SECRET_KEY).toString();
  }

  decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  setItem(key: string, value: string): void {
    if (typeof window !== 'undefined') {
      const encrypted = this.encrypt(value);
      localStorage.setItem(key, encrypted);
    }
  }

  getItem(key: string): string | null {
    if (typeof window !== 'undefined') {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      
      try {
        return this.decrypt(encrypted);
      } catch (error) {
        console.error('Decryption failed:', error);
        return null;
      }
    }
    return null;
  }

  removeItem(key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
}
```

**Install crypto-js**:

```bash
cd cli
npm install crypto-js
npm install --save-dev @types/crypto-js
```

---

## 🎯 Khuyến Nghị

### Cho Dự Án Của Bạn

**Tôi khuyên dùng: HttpOnly Cookies** vì:

1. ✅ **Bảo mật cao nhất** - Token không thể bị đánh cắp qua XSS
2. ✅ **Tự động gửi** - Không cần thêm header thủ công
3. ✅ **Support SSR** - Hoạt động tốt với Angular Universal
4. ✅ **Industry standard** - Được sử dụng rộng rãi
5. ✅ **CSRF protection** - Với SameSite flag

### Roadmap Implementation

**Phase 1: Quick Win (Hiện tại)**
- ✅ Dùng localStorage (đã implement)
- ✅ Fix các vấn đề hiện tại

**Phase 2: Security Upgrade (Recommended)**
- 🔄 Migrate sang HttpOnly Cookies
- 🔄 Update backend và frontend
- 🔄 Test kỹ CORS và credentials

**Phase 3: Advanced (Optional)**
- 🔄 Thêm Refresh Token
- 🔄 Implement Token Rotation
- 🔄 Add Rate Limiting

---

## 📊 Comparison Table

| Feature | localStorage | HttpOnly Cookie | IndexedDB | Memory |
|---------|-------------|-----------------|-----------|--------|
| XSS Protection | ❌ | ✅ | ❌ | ✅ |
| CSRF Protection | ✅ | ⚠️ (need SameSite) | ✅ | ✅ |
| Persistence | ✅ | ✅ | ✅ | ❌ |
| SSR Support | ❌ | ✅ | ❌ | ✅ |
| Auto Send | ❌ | ✅ | ❌ | ❌ |
| Size Limit | 5-10MB | 4KB | ~50MB+ | RAM |
| Complexity | ⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐ |

---

## 🚀 Migration Guide

Nếu bạn muốn migrate sang HttpOnly Cookies, tôi có thể giúp bạn:

1. Update backend để set cookies
2. Update frontend để gửi credentials
3. Update interceptor để handle cookies
4. Test toàn bộ flow
5. Deploy và monitor

Bạn muốn tôi implement phương án nào? 😊
