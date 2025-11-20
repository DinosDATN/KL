# Backend Requirements - Deleted Courses Filter

## Yêu Cầu Quan Trọng

Frontend đã được cập nhật để gửi filter `is_deleted` trong tất cả requests. Backend **BẮT BUỘC** phải xử lý filter này đúng cách.

## API Endpoints Cần Xử Lý

### 1. GET /admin/courses

**Query Parameters:**
```
?page=1
&limit=10
&is_deleted=false    // ✅ QUAN TRỌNG: Filter này
&search=...
&sortBy=...
&status=...
&category_id=...
&instructor_id=...
```

**Backend Logic:**
```javascript
// Pseudo code
const { is_deleted, ...otherFilters } = req.query;

let query = Course.findAll({
  where: {
    ...otherFilters,
    is_deleted: is_deleted === 'true' ? true : false  // ✅ Parse string to boolean
  }
});
```

**Quan Trọng:**
- Nếu `is_deleted=false` → Chỉ trả về courses có `is_deleted = false`
- Nếu `is_deleted=true` → Chỉ trả về courses có `is_deleted = true`
- Query parameter là **string**, cần parse sang boolean

### 2. GET /admin/courses/deleted

**Query Parameters:**
```
?page=1
&limit=10
&is_deleted=true     // ✅ Luôn là true cho endpoint này
&search=...
&sortBy=...
```

**Backend Logic:**
```javascript
// Endpoint này có thể:
// Option 1: Hardcode is_deleted = true
const courses = await Course.findAll({
  where: {
    is_deleted: true,
    ...otherFilters
  }
});

// Option 2: Sử dụng query parameter (recommended)
const { is_deleted = 'true', ...otherFilters } = req.query;
const courses = await Course.findAll({
  where: {
    is_deleted: is_deleted === 'true',
    ...otherFilters
  }
});
```

## Các Actions Cần Xử Lý

### 1. Soft Delete (DELETE /admin/courses/:id)

**Request:**
```
DELETE /admin/courses/123
```

**Backend Logic:**
```javascript
// ✅ Soft delete - Chỉ update is_deleted flag
await Course.update(
  { is_deleted: true, deleted_at: new Date() },
  { where: { id: courseId } }
);

// ❌ KHÔNG xóa record khỏi database
// await Course.destroy({ where: { id: courseId } });
```

**Response:**
```json
{
  "success": true,
  "message": "Course deleted successfully"
}
```

### 2. Restore (POST /admin/courses/:id/restore)

**Request:**
```
POST /admin/courses/123/restore
```

**Backend Logic:**
```javascript
// ✅ Restore - Set is_deleted = false
await Course.update(
  { is_deleted: false, deleted_at: null },
  { where: { id: courseId, is_deleted: true } }
);
```

**Response:**
```json
{
  "success": true,
  "message": "Course restored successfully",
  "data": { ...courseData }
}
```

### 3. Permanent Delete (DELETE /admin/courses/:id/permanent)

**Request:**
```
DELETE /admin/courses/123/permanent
```

**Backend Logic:**
```javascript
// ✅ Permanent delete - Xóa record khỏi database
await Course.destroy({ 
  where: { id: courseId, is_deleted: true },
  force: true  // Sequelize: force delete
});
```

**Response:**
```json
{
  "success": true,
  "message": "Course permanently deleted"
}
```

### 4. Bulk Restore (POST /admin/courses/bulk/restore)

**Request:**
```json
{
  "course_ids": [1, 2, 3, 4, 5]
}
```

**Backend Logic:**
```javascript
await Course.update(
  { is_deleted: false, deleted_at: null },
  { where: { id: { [Op.in]: course_ids }, is_deleted: true } }
);
```

**Response:**
```json
{
  "success": true,
  "message": "5 courses restored successfully",
  "data": {
    "restored_count": 5
  }
}
```

### 5. Bulk Delete (POST /admin/courses/bulk/delete)

**Request:**
```json
{
  "course_ids": [1, 2, 3],
  "permanent": false  // ✅ false = soft delete, true = permanent delete
}
```

**Backend Logic:**
```javascript
if (permanent === true) {
  // Permanent delete
  await Course.destroy({ 
    where: { id: { [Op.in]: course_ids }, is_deleted: true },
    force: true
  });
} else {
  // Soft delete
  await Course.update(
    { is_deleted: true, deleted_at: new Date() },
    { where: { id: { [Op.in]: course_ids } } }
  );
}
```

**Response:**
```json
{
  "success": true,
  "message": "3 courses deleted successfully",
  "data": {
    "deleted_count": 3
  }
}
```

## Database Schema

### Courses Table

**Required Columns:**
```sql
CREATE TABLE courses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  -- ... other columns ...
  
  -- ✅ REQUIRED for soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ✅ Index for performance
CREATE INDEX idx_courses_is_deleted ON courses(is_deleted);
```

## Testing Checklist

### Test Cases Backend Cần Verify

#### Filter Tests
- [ ] GET /admin/courses?is_deleted=false → Chỉ trả về courses chưa xóa
- [ ] GET /admin/courses?is_deleted=true → Chỉ trả về courses đã xóa
- [ ] GET /admin/courses/deleted → Chỉ trả về courses đã xóa
- [ ] Filter hoạt động với search, sort, pagination

#### Soft Delete Tests
- [ ] DELETE /admin/courses/:id → Set is_deleted = true
- [ ] Course biến mất khỏi list is_deleted=false
- [ ] Course xuất hiện trong list is_deleted=true
- [ ] deleted_at được set đúng

#### Restore Tests
- [ ] POST /admin/courses/:id/restore → Set is_deleted = false
- [ ] Course biến mất khỏi list is_deleted=true
- [ ] Course xuất hiện trong list is_deleted=false
- [ ] deleted_at được clear (set null)

#### Permanent Delete Tests
- [ ] DELETE /admin/courses/:id/permanent → Xóa record
- [ ] Chỉ xóa được courses có is_deleted = true
- [ ] Không thể xóa courses có is_deleted = false
- [ ] Record không còn trong database

#### Bulk Operations Tests
- [ ] Bulk restore hoạt động đúng
- [ ] Bulk soft delete hoạt động đúng
- [ ] Bulk permanent delete hoạt động đúng
- [ ] Bulk operations với permanent flag

#### Statistics Tests
- [ ] GET /admin/courses/statistics → Đếm đúng
- [ ] totalCourses = courses có is_deleted = false
- [ ] deletedCourses = courses có is_deleted = true

## Common Issues & Solutions

### Issue 1: Query Parameter là String
```javascript
// ❌ WRONG
if (is_deleted) { ... }  // '0', 'false' vẫn là truthy

// ✅ CORRECT
if (is_deleted === 'true' || is_deleted === true) { ... }
```

### Issue 2: Permanent Delete Không An Toàn
```javascript
// ❌ WRONG - Có thể xóa nhầm courses chưa soft delete
await Course.destroy({ where: { id: courseId } });

// ✅ CORRECT - Chỉ xóa courses đã soft delete
await Course.destroy({ 
  where: { id: courseId, is_deleted: true }
});
```

### Issue 3: Statistics Không Đúng
```javascript
// ❌ WRONG
const totalCourses = await Course.count();

// ✅ CORRECT
const totalCourses = await Course.count({ 
  where: { is_deleted: false } 
});
const deletedCourses = await Course.count({ 
  where: { is_deleted: true } 
});
```

## Security Considerations

### 1. Authorization
```javascript
// ✅ Verify admin role
if (req.user.role !== 'admin') {
  return res.status(403).json({ 
    success: false, 
    error: 'Forbidden' 
  });
}
```

### 2. Validation
```javascript
// ✅ Validate course exists
const course = await Course.findOne({ 
  where: { id: courseId } 
});
if (!course) {
  return res.status(404).json({ 
    success: false, 
    error: 'Course not found' 
  });
}

// ✅ Validate course is deleted before permanent delete
if (!course.is_deleted) {
  return res.status(400).json({ 
    success: false, 
    error: 'Course must be soft deleted first' 
  });
}
```

### 3. Audit Log (Recommended)
```javascript
// ✅ Log permanent deletes
await AuditLog.create({
  user_id: req.user.id,
  action: 'PERMANENT_DELETE_COURSE',
  resource_type: 'Course',
  resource_id: courseId,
  details: { course_title: course.title }
});
```

## Example Implementation (Node.js/Express)

```javascript
// GET /admin/courses
router.get('/admin/courses', authenticateAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      is_deleted = 'false',  // ✅ Default to false
      search,
      sortBy = 'created_at_desc'
    } = req.query;

    // ✅ Parse is_deleted to boolean
    const isDeleted = is_deleted === 'true';

    // Build where clause
    const where = { is_deleted: isDeleted };
    
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // Query courses
    const { rows: courses, count: totalItems } = await Course.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: parseSortBy(sortBy),
      include: [
        { model: Instructor, attributes: ['id', 'name', 'email'] },
        { model: Category, attributes: ['id', 'name'] }
      ]
    });

    res.json({
      success: true,
      data: courses,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(totalItems / parseInt(limit)),
        total_items: totalItems,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /admin/courses/:id/restore
router.post('/admin/courses/:id/restore', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findOne({ 
      where: { id, is_deleted: true } 
    });

    if (!course) {
      return res.status(404).json({ 
        success: false, 
        error: 'Deleted course not found' 
      });
    }

    await course.update({ 
      is_deleted: false, 
      deleted_at: null 
    });

    res.json({
      success: true,
      message: 'Course restored successfully',
      data: course
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// DELETE /admin/courses/:id/permanent
router.delete('/admin/courses/:id/permanent', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findOne({ 
      where: { id, is_deleted: true } 
    });

    if (!course) {
      return res.status(404).json({ 
        success: false, 
        error: 'Deleted course not found' 
      });
    }

    // Audit log before delete
    await AuditLog.create({
      user_id: req.user.id,
      action: 'PERMANENT_DELETE_COURSE',
      resource_type: 'Course',
      resource_id: id,
      details: { title: course.title }
    });

    await course.destroy({ force: true });

    res.json({
      success: true,
      message: 'Course permanently deleted'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
```

## Summary

✅ **Frontend gửi `is_deleted` filter trong mọi request**
✅ **Backend phải filter dựa trên `is_deleted` parameter**
✅ **Soft delete = set `is_deleted = true`**
✅ **Restore = set `is_deleted = false`**
✅ **Permanent delete = xóa record khỏi DB**
✅ **Chỉ permanent delete courses đã soft delete**
