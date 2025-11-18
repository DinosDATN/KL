# 🔧 Fix 401 Error on Lesson Page

## ❌ Vấn Đề

Khi truy cập `http://localhost:4200/courses/1/lessons/1` bị lỗi:

```
CoursesService Error: 401 Unauthorized
Error: Access token is required
```

## 🔍 Nguyên Nhân

1. **Chưa login** - Không có cookie `auth_token`
2. **Route không có guard** - Lesson route không yêu cầu authentication

## ✅ Giải Pháp

### 1. Thêm AuthGuard vào Lesson Route

```typescript
// cli/src/app/app.routes.ts

{
  path: 'courses/:courseId/lessons/:lessonId',
  loadComponent: () =>
    import('./features/courses/lesson-learning/lesson-learning.component')
      .then((m) => m.LessonLearningComponent),
  canActivate: [AuthGuard], // ✅ Require authentication
},
```

**Lợi ích**:
- ✅ Tự động redirect về `/auth/login` nếu chưa login
- ✅ Lưu URL để redirect lại sau khi login
- ✅ Không còn lỗi 401

### 2. Login Trước Khi Truy Cập

**Bước 1**: Mở `http://localhost:4200/auth/login`

**Bước 2**: Đăng nhập với tài khoản của bạn

**Bước 3**: Kiểm tra cookie:
- F12 > Application > Cookies
- Tìm `auth_token`
- ✅ HttpOnly: true
- ✅ Value: eyJhbGc... (JWT token)

**Bước 4**: Bây giờ truy cập `http://localhost:4200/courses/1/lessons/1`

## 🧪 Test Flow

### Scenario 1: Chưa Login

1. Truy cập `http://localhost:4200/courses/1/lessons/1`
2. **Kết quả**: Tự động redirect về `/auth/login?returnUrl=/courses/1/lessons/1`
3. Login thành công
4. **Kết quả**: Tự động redirect về `/courses/1/lessons/1`

### Scenario 2: Đã Login

1. Login trước
2. Truy cập `http://localhost:4200/courses/1/lessons/1`
3. **Kết quả**: Lesson page load thành công, không có lỗi 401

## 📊 Console Logs

### ❌ Trước (Chưa Login)

```
❌ User logged out, cleaning up
🔌 Socket connection status: DISCONNECTED
👤 Auth state changed in header: { user: undefined, isAuth: false }
CoursesService Error: 401 Unauthorized
Error: Access token is required
```

### ✅ Sau (Đã Login)

```
✅ Login successful, cookie set for user: user@example.com
✅ User authenticated, initializing app
🔌 Socket connection status: CONNECTED
👤 Auth state changed in header: { user: "User Name", isAuth: true }
✅ Lesson data loaded successfully
```

## 🛡️ Các Routes Nên Có AuthGuard

Đã thêm:
- ✅ `/profile` - canActivate: [AuthGuard]
- ✅ `/grading-board` - canActivate: [AuthGuard]
- ✅ `/chat` - canActivate: [AuthGuard]
- ✅ `/courses/:courseId/lessons/:lessonId` - canActivate: [AuthGuard] ← **MỚI THÊM**

Nên thêm (optional):
- `/courses/:id` - Nếu course detail cần authentication
- `/contests/:id` - Nếu contest detail cần authentication

## 🔒 AuthGuard Hoạt Động Như Thế Nào

```typescript
// cli/src/app/core/guards/auth.guard.ts

export class AuthGuard implements CanActivate {
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map((isAuthenticated: boolean) => {
        if (isAuthenticated) {
          return true; // ✅ Cho phép truy cập
        } else {
          // ❌ Redirect về login với returnUrl
          this.router.navigate(['/auth/login'], { 
            queryParams: { returnUrl: state.url }
          });
          return false;
        }
      })
    );
  }
}
```

**Flow**:
1. User truy cập protected route
2. AuthGuard check `isAuthenticated$`
3. Nếu `true` → Cho phép truy cập
4. Nếu `false` → Redirect về `/auth/login?returnUrl=...`
5. Sau khi login → Redirect về `returnUrl`

## 🎯 Checklist

- [x] Thêm `canActivate: [AuthGuard]` vào lesson route
- [ ] Restart frontend (nếu cần)
- [ ] Test: Truy cập lesson khi chưa login → Redirect về login
- [ ] Test: Login → Redirect về lesson
- [ ] Test: Truy cập lesson khi đã login → Load thành công

## 🚀 Kết Quả

Sau khi thêm AuthGuard:

1. ✅ **Không còn lỗi 401** khi chưa login
2. ✅ **Tự động redirect** về login page
3. ✅ **Lưu returnUrl** để redirect lại sau login
4. ✅ **Better UX** - User biết phải login
5. ✅ **Secure** - Protected routes được bảo vệ

---

**Files đã sửa**:
- `cli/src/app/app.routes.ts`

**Bây giờ hãy login và test lại!** 🎉
