# Sửa Lỗi Header Hiển Thị Cả User Toggle và Login/Register

## Vấn Đề

Sau khi reload trang, header hiển thị CẢ:
- User toggle (avatar + name)
- Nút Đăng nhập + Đăng ký

Trong một khoảnh khắc ngắn trước khi về bình thường.

## Nguyên Nhân

### Timeline Sai:

```
t0: authInitialized$ emit true
t1: authLoaded = true ← Set ngay lập tức
t2: Template render với authLoaded = true, isAuthenticated = false (default)
    → Hiển thị Login/Register buttons
t3: currentUser$ emit user
t4: isAuthenticated = true
t5: Template re-render
    → Hiển thị User toggle
    → Ẩn Login/Register buttons
```

**Vấn đề:** Giữa t2 và t5, cả 2 phần đều hiển thị!

### Code Cũ (SAI):

```typescript
this.authInitSubscription = this.authService.authInitialized$.subscribe((initialized) => {
  if (initialized) {
    this.authLoaded = true; // ← Set quá sớm!
    
    if (!this.authSubscription) {
      this.authSubscription = this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
        this.isAuthenticated = !!user;
        // authLoaded đã = true từ trước
      });
    }
  }
});
```

### Template Logic:

```html
<ng-container *ngIf="authLoaded; else userSkeleton">
  <!-- authLoaded = true, isAuthenticated = false → Hiển thị Login/Register -->
  <button *ngIf="isAuthenticated">User Toggle</button>
  <div *ngIf="!isAuthenticated">Login/Register</div>
</ng-container>
```

**Kết quả:** 
- `authLoaded = true` → Thoát khỏi skeleton
- `isAuthenticated = false` → Hiển thị Login/Register
- Sau đó `isAuthenticated = true` → Hiển thị User Toggle
- **→ Flash of both states!**

## Giải Pháp

### Chỉ Set `authLoaded = true` SAU KHI Nhận User Value

```typescript
this.authInitSubscription = this.authService.authInitialized$.subscribe((initialized) => {
  if (initialized) {
    if (!this.authSubscription) {
      this.authSubscription = this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
        this.isAuthenticated = !!user;
        
        // ✅ Chỉ mark as loaded SAU KHI nhận được user value
        this.authLoaded = true;
        
        this.updateUserMenuItems();
        // ...
      });
    }
  }
});
```

### Timeline Mới (ĐÚNG):

```
t0: authInitialized$ emit true
t1: Subscribe currentUser$
t2: currentUser$ emit user (hoặc null)
t3: currentUser = user
t4: isAuthenticated = !!user
t5: authLoaded = true ← Set SAU KHI có giá trị
t6: Template render với authLoaded = true VÀ isAuthenticated đã đúng
    → Chỉ hiển thị 1 trong 2: User toggle HOẶC Login/Register
```

**Kết quả:** Không còn flash of both states!

## So Sánh

### Trước (SAI):

```
Skeleton → authLoaded=true, isAuth=false → Login/Register
        → isAuth=true → User Toggle
        ↑ Flash of both!
```

### Sau (ĐÚNG):

```
Skeleton → authLoaded=true, isAuth=true → User Toggle
        (hoặc)
Skeleton → authLoaded=true, isAuth=false → Login/Register
        ↑ Chỉ hiển thị 1 lần!
```

## Code Changes

### File: `cli/src/app/shared/layout/header/header.component.ts`

**Trước:**
```typescript
this.authInitSubscription = this.authService.authInitialized$.subscribe((initialized) => {
  if (initialized) {
    this.authLoaded = true; // ❌ Quá sớm
    
    if (!this.authSubscription) {
      this.authSubscription = this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
        this.isAuthenticated = !!user;
      });
    }
  }
});
```

**Sau:**
```typescript
this.authInitSubscription = this.authService.authInitialized$.subscribe((initialized) => {
  if (initialized) {
    if (!this.authSubscription) {
      this.authSubscription = this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
        this.isAuthenticated = !!user;
        
        // ✅ Chỉ mark as loaded SAU KHI nhận user value
        this.authLoaded = true;
        
        this.updateUserMenuItems();
      });
    }
  }
});
```

## Tại Sao Cách Này Đúng?

### 1. Atomic Update
- `currentUser`, `isAuthenticated`, và `authLoaded` được update cùng lúc
- Template chỉ render 1 lần với state đầy đủ

### 2. No Race Condition
- Không có khoảng thời gian nào mà `authLoaded = true` nhưng `isAuthenticated` chưa đúng
- State luôn consistent

### 3. Smooth Transition
```
Skeleton (authLoaded=false)
   ↓
User Toggle (authLoaded=true, isAuth=true)
   hoặc
Login/Register (authLoaded=true, isAuth=false)
```

Không có intermediate state!

## Testing

### Test 1: Login và Reload
```bash
1. Login vào hệ thống
2. Reload page (F5)
3. Quan sát header:
   ✅ Skeleton hiển thị
   ✅ Chuyển sang User Toggle
   ✅ KHÔNG hiển thị Login/Register
   ✅ KHÔNG có flash
```

### Test 2: Logout và Reload
```bash
1. Logout
2. Reload page
3. Quan sát header:
   ✅ Skeleton hiển thị
   ✅ Chuyển sang Login/Register buttons
   ✅ KHÔNG hiển thị User Toggle
   ✅ KHÔNG có flash
```

### Test 3: Slow Network
```bash
1. DevTools → Network → Slow 3G
2. Login và reload
3. Quan sát:
   ✅ Skeleton hiển thị lâu hơn
   ✅ Vẫn chuyển smooth sang User Toggle
   ✅ KHÔNG có double display
```

## Nguyên Tắc Chung

**Khi dùng loading flag với conditional rendering:**

```typescript
// ❌ SAI: Set loading flag trước khi có data
this.dataLoaded = true;
this.loadData().subscribe(data => {
  this.data = data;
});

// ✅ ĐÚNG: Set loading flag SAU KHI có data
this.loadData().subscribe(data => {
  this.data = data;
  this.dataLoaded = true; // ← Sau khi có data
});
```

**Template:**
```html
<ng-container *ngIf="dataLoaded; else skeleton">
  <!-- Data đã sẵn sàng, không có intermediate state -->
  <div>{{ data }}</div>
</ng-container>
```

## Kết Luận

**Vấn đề:** `authLoaded` được set quá sớm, trước khi `isAuthenticated` được update.

**Giải pháp:** Chỉ set `authLoaded = true` SAU KHI nhận được giá trị từ `currentUser$`.

**Kết quả:** 
- ✅ Không còn flash of both states
- ✅ Smooth transition từ skeleton
- ✅ State luôn consistent
- ✅ Better user experience

**Nguyên tắc:** Loading flag phải được set SAU KHI data đã sẵn sàng, không phải trước!
