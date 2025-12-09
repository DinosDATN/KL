# 🐛 Bugfix: Angular Template Syntax Error

## Vấn đề

Frontend build failed với lỗi:
```
NG5002: Parser Error: Bindings cannot contain assignments
NG9: Property 'Math' does not exist on type 'BankAccountsAdminComponent'
```

## Nguyên nhân

### Lỗi 1: Arrow function trong template
Angular không cho phép sử dụng arrow function trực tiếp trong template:

```html
<!-- ❌ SAI -->
<div>{{ bankAccounts.filter(a => a.is_active).length }}</div>
```

### Lỗi 2: Sử dụng Math trong template
Angular không tự động expose global objects như `Math`:

```html
<!-- ❌ SAI -->
<div>{{ Math.min(currentPage * itemsPerPage, filteredAccounts.length) }}</div>
```

## Giải pháp

### 1. Tạo methods trong component

**File:** `bank-accounts-admin.component.ts`

```typescript
// Thêm methods
getTotalActive(): number {
  return this.bankAccounts.filter(acc => acc.is_active).length;
}

getDisplayRange(): string {
  const start = (this.currentPage - 1) * this.itemsPerPage + 1;
  const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredAccounts.length);
  return `${start} - ${end}`;
}
```

### 2. Sử dụng methods trong template

**File:** `bank-accounts-admin.component.html`

**Trước:**
```html
<!-- ❌ SAI -->
<div class="stat-value">{{ bankAccounts.filter(a => a.is_active).length }}</div>

<div class="info-text">
  Hiển thị {{ (currentPage - 1) * itemsPerPage + 1 }} - 
  {{ Math.min(currentPage * itemsPerPage, filteredAccounts.length) }} 
  trong tổng số {{ filteredAccounts.length }} tài khoản
</div>
```

**Sau:**
```html
<!-- ✅ ĐÚNG -->
<div class="stat-value">{{ getTotalActive() }}</div>

<div class="info-text">
  Hiển thị {{ getDisplayRange() }} 
  trong tổng số {{ filteredAccounts.length }} tài khoản
</div>
```

## Bài học

### Angular Template Rules:

1. **Không sử dụng arrow functions:**
   ```html
   <!-- ❌ SAI -->
   {{ items.filter(i => i.active) }}
   
   <!-- ✅ ĐÚNG -->
   {{ getActiveItems() }}
   ```

2. **Không sử dụng global objects trực tiếp:**
   ```html
   <!-- ❌ SAI -->
   {{ Math.max(a, b) }}
   {{ Date.now() }}
   
   <!-- ✅ ĐÚNG -->
   {{ getMaxValue(a, b) }}
   {{ getCurrentTime() }}
   ```

3. **Không sử dụng assignments:**
   ```html
   <!-- ❌ SAI -->
   {{ value = 10 }}
   
   <!-- ✅ ĐÚNG -->
   {{ setValue(10) }}
   ```

4. **Không sử dụng complex logic:**
   ```html
   <!-- ❌ SAI -->
   {{ items.filter(i => i.active).map(i => i.name).join(', ') }}
   
   <!-- ✅ ĐÚNG -->
   {{ getActiveItemNames() }}
   ```

## Best Practices

### 1. Keep templates simple
- Logic nên ở trong component
- Template chỉ hiển thị dữ liệu

### 2. Create helper methods
```typescript
// Component
getFilteredItems(): Item[] {
  return this.items.filter(item => item.active);
}

getFormattedDate(date: Date): string {
  return date.toLocaleDateString('vi-VN');
}

calculateTotal(): number {
  return this.items.reduce((sum, item) => sum + item.price, 0);
}
```

### 3. Use pipes for formatting
```html
<!-- Date formatting -->
{{ date | date:'dd/MM/yyyy' }}

<!-- Currency formatting -->
{{ price | currency:'VND' }}

<!-- Custom pipes -->
{{ text | customPipe }}
```

### 4. Avoid complex expressions
```html
<!-- ❌ BAD -->
{{ (items.length > 0 ? items.filter(i => i.active).length : 0) / items.length * 100 }}

<!-- ✅ GOOD -->
{{ getActivePercentage() }}
```

## Files đã sửa

1. `cli/src/app/features/admin/bank-accounts/bank-accounts-admin.component.ts`
   - Thêm `getTotalActive()` method
   - Thêm `getDisplayRange()` method

2. `cli/src/app/features/admin/bank-accounts/bank-accounts-admin.component.html`
   - Sử dụng `getTotalActive()` thay vì arrow function
   - Sử dụng `getDisplayRange()` thay vì Math.min

## Kết quả

✅ Build thành công
✅ Không có lỗi template
✅ Code clean và maintainable
✅ Performance tốt hơn (methods được cache)

## Testing

### Kiểm tra:
1. Statistics cards hiển thị đúng
2. Pagination info hiển thị đúng
3. Không có lỗi console
4. Performance tốt

## References

- [Angular Template Syntax](https://angular.io/guide/template-syntax)
- [Angular Style Guide](https://angular.io/guide/styleguide)
- [Template Expressions](https://angular.io/guide/interpolation)

---

**Ngày fix:** 09/12/2024
**Người fix:** AI Assistant
**Thời gian fix:** < 5 phút
**Status:** ✅ **FIXED**
