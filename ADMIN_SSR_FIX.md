# Admin Components SSR Fix

## Vấn đề
Các admin components đang gọi API trong SSR mode (Server-Side Rendering), dẫn đến lỗi 401 vì:
- SSR chạy trên server, không có cookie authentication
- API calls trong `ngOnInit()` được thực thi cả trên server và browser

## Giải pháp

### 1. Sử dụng BaseAdminComponent

Tất cả admin components nên extend từ `BaseAdminComponent`:

```typescript
import { BaseAdminComponent } from '../base-admin.component';

export class YourAdminComponent extends BaseAdminComponent implements OnInit {
  constructor(
    // Your services
    private yourService: YourService,
    // Required for BaseAdminComponent
    authService: AuthService,
    router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(platformId, authService, router);
  }

  ngOnInit(): void {
    // ✅ Chỉ chạy trong browser
    this.runInBrowser(() => {
      if (this.checkAdminAccess()) {
        this.loadData();
      }
    });
  }

  loadData(): void {
    // ✅ Kiểm tra trước khi gọi API
    if (!this.isBrowser) {
      return;
    }

    // Your API calls here
    this.yourService.getData().subscribe(...);
  }
}
```

### 2. BaseAdminComponent Features

- `isBrowser`: Boolean để kiểm tra xem code đang chạy trong browser hay SSR
- `checkAdminAccess()`: Kiểm tra quyền admin và redirect nếu không có quyền
- `runInBrowser(callback)`: Chỉ thực thi callback trong browser

### 3. Components đã được fix

✅ `course-management.component.ts`
✅ `instructor-management.component.ts`

### 4. Components cần fix

Các components sau cần áp dụng pattern tương tự:
- dashboard.component.ts
- user-management.component.ts
- user-analytics.component.ts
- admin-management.component.ts
- course-analytics.component.ts
- lesson-management.component.ts
- problem-management.component.ts
- contest-management.component.ts
- payment-management.component.ts
- và các admin components khác...

### 5. Quy tắc quan trọng

1. **Không gọi API trong constructor**
2. **Luôn kiểm tra `isBrowser` trước khi gọi API**
3. **Sử dụng `runInBrowser()` trong `ngOnInit()`**
4. **Kiểm tra admin access trước khi load data**

### 6. Testing

Sau khi fix, kiểm tra:
1. Không có lỗi 401 trong console khi SSR
2. Trang admin load đúng sau khi hydration
3. API calls chỉ được gọi trong browser
4. Redirect đúng nếu user không phải admin

## Lợi ích

- ✅ Không có lỗi 401 trong SSR mode
- ✅ Tối ưu performance (không gọi API không cần thiết trên server)
- ✅ Code sạch hơn và dễ maintain
- ✅ Consistent pattern cho tất cả admin components
