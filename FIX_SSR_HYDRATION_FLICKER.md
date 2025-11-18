# Sửa Lỗi Giao Diện Bị Duplicate/Flicker (SSR Hydration Issue)

## Vấn Đề

Giao diện thỉnh thoảng bị duplicate hoặc flicker, xuất hiện 2 lớp:
- 1 lớp chỉ có layout (skeleton)
- 1 lớp có nội dung đầy đủ

## Nguyên Nhân

### SSR Hydration Mismatch

App đang dùng SSR (Server-Side Rendering). Vấn đề xảy ra khi:

1. **Server render** HTML với một state
2. **Client hydration** với state khác
3. Angular phát hiện mismatch → Re-render → Flicker

### Các Nguyên Nhân Cụ Thể:

#### 1. Auth State Mismatch
```typescript
// Server: không có localStorage, không có cookie
currentUser = null

// Client: có localStorage, có cookie
currentUser = { name: "Duy Khang", ... }
```

→ Header render 2 lần khác nhau → Flicker

#### 2. Conditional Rendering với *ngIf
```html
<!-- Server render: user = null -->
<app-header *ngIf="!currentUrl.startsWith('/forum')"></app-header>

<!-- Client hydration: user = User -->
<app-header *ngIf="!currentUrl.startsWith('/forum')"></app-header>
<!-- Nhưng nội dung bên trong khác! -->
```

#### 3. Theme State Mismatch
```typescript
// Server: không có localStorage
theme = 'light' (default)

// Client: có localStorage
theme = 'dark' (user preference)
```

→ Theme flash

## Giải Pháp

### 1. Disable SSR Cho Auth-Dependent Components

**Sử dụng `@defer` hoặc `isPlatformBrowser`:**

```typescript
// header.component.ts
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Inject } from '@angular/core';

export class HeaderComponent {
  isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }
}
```

```html
<!-- header.component.html -->
<ng-container *ngIf="isBrowser">
  <!-- Chỉ render ở client -->
  <div *ngIf="isAuthenticated">
    <img [src]="currentUser?.avatar_url" />
    <span>{{ currentUser?.name }}</span>
  </div>
</ng-container>

<ng-container *ngIf="!isBrowser">
  <!-- Placeholder cho SSR -->
  <div class="skeleton-avatar"></div>
  <div class="skeleton-text"></div>
</ng-container>
```

### 2. Sử dụng CSS để Ẩn Flicker

**Thêm vào `styles.css`:**

```css
/* Prevent FOUC during hydration */
body:not(.hydrated) {
  visibility: hidden;
}

body.hydrated {
  visibility: visible;
}

/* Smooth transition */
body {
  transition: visibility 0s;
}
```

**Thêm vào `app.component.ts`:**

```typescript
export class AppComponent implements OnInit {
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Mark as hydrated after Angular finishes hydration
      setTimeout(() => {
        document.body.classList.add('hydrated');
      }, 0);
    }
  }
}
```

### 3. Sử Dụng `afterNextRender` (Angular 16+)

```typescript
import { afterNextRender } from '@angular/core';

export class HeaderComponent {
  constructor() {
    afterNextRender(() => {
      // Code này chỉ chạy sau khi hydration hoàn tất
      this.loadUserData();
    });
  }
}
```

### 4. Tối Ưu Auth Initialization

**Đảm bảo auth state consistent giữa server và client:**

```typescript
// auth.service.ts
private initializeAuthState(): void {
  // ✅ Trong SSR, không gọi API
  if (!isPlatformBrowser(this.platformId)) {
    this.authInitialized.next(true);
    return;
  }

  // Chỉ verify session ở client
  const user = this.getUserFromStorage();
  if (user) {
    this.getProfile().subscribe({
      next: (response) => {
        this.currentUserSubject.next(response.data.user);
        this.isAuthenticatedSubject.next(true);
        this.authInitialized.next(true);
      },
      error: () => {
        this.clearAuthData();
        this.authInitialized.next(true);
      }
    });
  } else {
    this.authInitialized.next(true);
  }
}
```

### 5. Skeleton Loading States

**Thay vì ẩn/hiện, dùng skeleton:**

```html
<!-- header.component.html -->
<div class="header">
  <!-- Luôn hiển thị, nhưng nội dung khác nhau -->
  <div class="user-section">
    <ng-container *ngIf="authLoaded; else skeleton">
      <ng-container *ngIf="isAuthenticated; else guestMenu">
        <!-- Authenticated user -->
        <img [src]="currentUser?.avatar_url" />
        <span>{{ currentUser?.name }}</span>
      </ng-container>
      
      <ng-template #guestMenu>
        <!-- Guest user -->
        <a href="/auth/login">Đăng nhập</a>
      </ng-template>
    </ng-container>
    
    <ng-template #skeleton>
      <!-- Loading skeleton - giống nhau ở server và client -->
      <div class="skeleton-avatar"></div>
      <div class="skeleton-text"></div>
    </ng-template>
  </div>
</div>
```

```css
/* Skeleton styles */
.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.skeleton-text {
  width: 100px;
  height: 20px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

## Implementation Plan

### Step 1: Sửa AuthService

```typescript
// auth.service.ts
import { PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export class AuthService {
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initializeAuthState();
      }, 0);
    } else {
      // SSR: Mark as initialized immediately
      this.authInitialized.next(true);
    }
  }
}
```

### Step 2: Sửa HeaderComponent

```typescript
// header.component.ts
export class HeaderComponent {
  authLoaded = false;
  isBrowser: boolean;

  constructor(
    private authService: AuthService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    this.authService.authInitialized$.subscribe((initialized) => {
      if (initialized) {
        this.authLoaded = true;
        
        if (this.isBrowser) {
          // Chỉ subscribe ở client
          this.authService.currentUser$.subscribe((user) => {
            this.currentUser = user;
            this.isAuthenticated = !!user;
          });
        }
      }
    });
  }
}
```

### Step 3: Thêm CSS Anti-Flicker

```css
/* styles.css */
/* Prevent hydration flicker */
html {
  visibility: visible;
  opacity: 1;
}

html:not(.hydrated) * {
  animation-duration: 0s !important;
  transition-duration: 0s !important;
}

html.hydrated {
  /* Animations enabled after hydration */
}
```

```typescript
// app.component.ts
export class AppComponent implements OnInit {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.classList.add('hydrated');
    }
  }
}
```

### Step 4: Sử Dụng Skeleton Everywhere

Thay thế tất cả `*ngIf="isAuthenticated"` bằng skeleton pattern:

```html
<!-- ❌ BAD: Causes flicker -->
<div *ngIf="isAuthenticated">
  <img [src]="user.avatar" />
</div>

<!-- ✅ GOOD: No flicker -->
<div>
  <ng-container *ngIf="authLoaded; else skeleton">
    <img *ngIf="isAuthenticated" [src]="user.avatar" />
  </ng-container>
  <ng-template #skeleton>
    <div class="skeleton-avatar"></div>
  </ng-template>
</div>
```

## Testing

### Test 1: Hard Refresh
```bash
1. Đang login
2. Hard refresh (Ctrl+Shift+R)
3. Quan sát:
   ✅ Không có flicker
   ✅ Skeleton hiển thị smooth
   ✅ Content load smooth
```

### Test 2: Slow Network
```bash
1. DevTools → Network → Slow 3G
2. Refresh page
3. Quan sát:
   ✅ Skeleton hiển thị ngay
   ✅ Không có duplicate content
   ✅ Smooth transition
```

### Test 3: Disable JavaScript
```bash
1. Disable JavaScript
2. Load page (SSR only)
3. Quan sát:
   ✅ Skeleton hiển thị
   ✅ Không có errors
   ✅ Basic layout works
```

## Kết Luận

**Root cause:** SSR hydration mismatch do auth state khác nhau giữa server và client.

**Solution:** 
1. ✅ Detect platform (server vs browser)
2. ✅ Sử dụng skeleton loading states
3. ✅ Disable animations during hydration
4. ✅ Consistent rendering logic

**Result:** Không còn flicker, smooth user experience!
