# 🐛 Bugfix: Auth Middleware Import Error

## Vấn đề

Backend crash khi khởi động với lỗi:
```
Error: Cannot find module '../middleware/auth'
```

## Nguyên nhân

File `api/src/routes/creatorBankAccountRoutes.js` đã import sai tên middleware:
```javascript
// ❌ SAI
const { authenticate, authorize } = require('../middleware/auth');
```

Trong khi tất cả các routes khác trong dự án đều sử dụng:
```javascript
// ✅ ĐÚNG
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
```

## Giải pháp

### 1. Sửa import statement

**Trước:**
```javascript
const { authenticate, authorize } = require('../middleware/auth');
```

**Sau:**
```javascript
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
```

### 2. Sửa middleware calls

**Trước:**
```javascript
router.get('/my-bank-account', 
  authenticate,  // ❌ SAI
  creatorBankAccountController.getMyBankAccount
);

router.get('/admin/bank-accounts', 
  authenticate,  // ❌ SAI
  authorize('admin'),  // ❌ SAI
  creatorBankAccountController.getAllBankAccounts
);
```

**Sau:**
```javascript
router.get('/my-bank-account', 
  authenticateToken,  // ✅ ĐÚNG
  creatorBankAccountController.getMyBankAccount
);

router.get('/admin/bank-accounts', 
  authenticateToken,  // ✅ ĐÚNG
  requireRole('admin'),  // ✅ ĐÚNG
  creatorBankAccountController.getAllBankAccounts
);
```

## File đã sửa

- `api/src/routes/creatorBankAccountRoutes.js`

## Kết quả

✅ Backend khởi động thành công
✅ Routes hoạt động bình thường
✅ Middleware authentication/authorization hoạt động đúng

## Bài học

Khi tạo routes mới, luôn tham khảo các routes hiện có để đảm bảo:
1. Import đúng tên middleware
2. Sử dụng đúng tên function
3. Tuân theo convention của dự án

## Middleware trong dự án

File: `api/src/middleware/authMiddleware.js`

Các function có sẵn:
- `authenticateToken` - Xác thực JWT token
- `requireRole(role)` - Kiểm tra role của user
- `optionalAuth` - Authentication tùy chọn

## Cách sử dụng đúng

```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Route yêu cầu authentication
router.get('/protected', 
  authenticateToken, 
  controller.method
);

// Route yêu cầu authentication + role admin
router.get('/admin-only', 
  authenticateToken, 
  requireRole('admin'), 
  controller.method
);

// Route yêu cầu authentication + role creator
router.get('/creator-only', 
  authenticateToken, 
  requireRole('creator'), 
  controller.method
);

module.exports = router;
```

## Status

✅ **FIXED** - Backend đang chạy bình thường

---

**Ngày fix:** 09/12/2024
**Người fix:** AI Assistant
**Thời gian fix:** < 5 phút
