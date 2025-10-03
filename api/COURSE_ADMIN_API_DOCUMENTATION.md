# Course Administration API Documentation

This document outlines the complete API endpoints for the Course Administration module, designed for admin-level access and management of courses in the system.

## Table of Contents
1. [Authentication & Authorization](#authentication--authorization)
2. [Course CRUD Operations](#course-crud-operations)
3. [Advanced Course Management](#advanced-course-management)
4. [Bulk Operations](#bulk-operations)
5. [Statistics & Export](#statistics--export)
6. [Response Format](#response-format)
7. [Error Handling](#error-handling)
8. [Examples](#examples)

## Authentication & Authorization

All Course Administration API endpoints require:
- **Authentication**: Valid JWT token in the `Authorization` header
- **Authorization**: Admin role (`role: 'admin'`)

```
Headers:
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Course CRUD Operations

### Create Course
**POST** `/api/v1/admin/courses`

Creates a new course in the system.

#### Request Body
```json
{
  "title": "Advanced JavaScript Programming",
  "description": "Comprehensive course covering modern JavaScript concepts",
  "category_id": 1,
  "level": "Advanced",
  "duration": 120,
  "price": 999000,
  "original_price": 1299000,
  "discount": 23,
  "is_premium": true,
  "thumbnail": "https://example.com/thumbnail.jpg",
  "instructor_id": 5,
  "status": "draft"
}
```

#### Response
```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "id": 10,
    "title": "Advanced JavaScript Programming",
    "description": "Comprehensive course covering modern JavaScript concepts",
    "category_id": 1,
    "instructor_id": 5,
    "level": "Advanced",
    "duration": 120,
    "price": 999000,
    "original_price": 1299000,
    "discount": 23,
    "is_premium": true,
    "status": "draft",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "Instructor": {
      "id": 5,
      "name": "John Smith",
      "email": "john.smith@example.com",
      "avatar_url": "https://example.com/avatar.jpg"
    },
    "Category": {
      "id": 1,
      "name": "Programming",
      "description": "Programming related courses"
    }
  }
}
```

### Get All Courses (Admin View)
**GET** `/api/v1/admin/courses`

Retrieves all courses with advanced filtering and pagination options.

#### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (`draft`, `published`, `archived`)
- `category_id` (optional): Filter by category ID
- `instructor_id` (optional): Filter by instructor ID
- `level` (optional): Filter by level (`Beginner`, `Intermediate`, `Advanced`)
- `is_premium` (optional): Filter by premium status (`true`, `false`)
- `is_deleted` (optional): Include deleted courses (`true`, `false`)
- `search` (optional): Search in title and description
- `sortBy` (optional): Sort by field (`title`, `created_at`, `updated_at`, `rating`, `students`, `price`)
- `priceRange` (optional): Filter by price range (`free`, `paid`, `discounted`, `under-500k`, `500k-1m`, `over-1m`)

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "title": "Advanced JavaScript Programming",
      "status": "draft",
      "level": "Advanced",
      "price": 999000,
      "students": 0,
      "rating": 0,
      "is_premium": true,
      "is_deleted": false,
      "created_at": "2024-01-15T10:30:00Z",
      "Instructor": {
        "id": 5,
        "name": "John Smith"
      },
      "Category": {
        "id": 1,
        "name": "Programming"
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 45,
    "items_per_page": 10
  }
}
```

### Get Course by ID (Admin View)
**GET** `/api/v1/admin/courses/:id`

Retrieves a single course with full details.

#### Query Parameters
- `include_deleted` (optional): Include deleted courses (`true`, `false`)

#### Response
```json
{
  "success": true,
  "data": {
    "id": 10,
    "title": "Advanced JavaScript Programming",
    "description": "Comprehensive course covering modern JavaScript concepts",
    "status": "draft",
    "level": "Advanced",
    "duration": 120,
    "price": 999000,
    "original_price": 1299000,
    "discount": 23,
    "is_premium": true,
    "is_deleted": false,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "Instructor": {
      "id": 5,
      "name": "John Smith",
      "email": "john.smith@example.com",
      "avatar_url": "https://example.com/avatar.jpg"
    },
    "Category": {
      "id": 1,
      "name": "Programming",
      "description": "Programming related courses"
    }
  }
}
```

### Update Course
**PUT** `/api/v1/admin/courses/:id`

Updates an existing course.

#### Request Body
```json
{
  "title": "Advanced JavaScript & TypeScript Programming",
  "description": "Updated comprehensive course covering modern JavaScript and TypeScript",
  "price": 1199000,
  "status": "published"
}
```

#### Response
```json
{
  "success": true,
  "message": "Course updated successfully",
  "data": {
    "id": 10,
    "title": "Advanced JavaScript & TypeScript Programming",
    "description": "Updated comprehensive course covering modern JavaScript and TypeScript",
    "price": 1199000,
    "status": "published",
    "updated_at": "2024-01-15T11:30:00Z",
    "Instructor": { ... },
    "Category": { ... }
  }
}
```

### Delete Course (Soft Delete)
**DELETE** `/api/v1/admin/courses/:id`

Soft deletes a course (sets `is_deleted` to true).

#### Response
```json
{
  "success": true,
  "message": "Course deleted successfully"
}
```

## Advanced Course Management

### Update Course Status
**PATCH** `/api/v1/admin/courses/:id/status`

Updates only the status of a course (admin only).

#### Request Body
```json
{
  "status": "published"
}
```

#### Response
```json
{
  "success": true,
  "message": "Course status updated to published",
  "data": {
    "id": 10,
    "status": "published",
    "updated_at": "2024-01-15T12:00:00Z",
    "Instructor": { ... },
    "Category": { ... }
  }
}
```

### Restore Course
**POST** `/api/v1/admin/courses/:id/restore`

Restores a soft-deleted course (admin only).

#### Response
```json
{
  "success": true,
  "message": "Course restored successfully",
  "data": {
    "id": 10,
    "is_deleted": false,
    "updated_at": "2024-01-15T12:30:00Z",
    "Instructor": { ... },
    "Category": { ... }
  }
}
```

### Permanently Delete Course
**DELETE** `/api/v1/admin/courses/:id/permanent`

Permanently deletes a course from the database (admin only).

#### Response
```json
{
  "success": true,
  "message": "Course permanently deleted successfully"
}
```

### Get Deleted Courses
**GET** `/api/v1/admin/courses/deleted`

Retrieves all soft-deleted courses.

#### Query Parameters
- `page`, `limit`, `search`, `sortBy`, `instructor_id`

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 8,
      "title": "Deleted Course",
      "is_deleted": true,
      "deleted_at": "2024-01-14T15:00:00Z",
      "Instructor": { ... },
      "Category": { ... }
    }
  ],
  "pagination": { ... }
}
```

## Bulk Operations

### Bulk Update Courses
**PATCH** `/api/v1/admin/courses/bulk/update`

Updates multiple courses at once.

#### Request Body
```json
{
  "course_ids": [10, 11, 12],
  "update_data": {
    "status": "published",
    "is_premium": true
  }
}
```

#### Response
```json
{
  "success": true,
  "message": "Successfully updated 3 courses",
  "data": {
    "updatedCount": 3,
    "totalRequested": 3
  }
}
```

### Bulk Delete Courses
**POST** `/api/v1/admin/courses/bulk/delete`

Deletes multiple courses (soft or permanent).

#### Request Body
```json
{
  "course_ids": [10, 11, 12],
  "permanent": false
}
```

#### Response
```json
{
  "success": true,
  "message": "3 courses deleted successfully",
  "data": {
    "deletedCount": 3,
    "totalRequested": 3
  }
}
```

### Bulk Restore Courses
**POST** `/api/v1/admin/courses/bulk/restore`

Restores multiple soft-deleted courses.

#### Request Body
```json
{
  "course_ids": [8, 9]
}
```

#### Response
```json
{
  "success": true,
  "message": "2 courses restored successfully",
  "data": {
    "restoredCount": 2,
    "totalRequested": 2
  }
}
```

## Statistics & Export

### Get Course Statistics
**GET** `/api/v1/admin/courses/statistics`

Retrieves comprehensive course statistics for admin dashboard.

#### Response
```json
{
  "success": true,
  "data": {
    "totalCourses": 45,
    "publishedCourses": 32,
    "draftCourses": 10,
    "archivedCourses": 3,
    "deletedCourses": 5,
    "premiumCourses": 20,
    "freeCourses": 25,
    "totalRevenue": 15750000,
    "totalStudents": 1250,
    "averageRating": "4.35"
  }
}
```

### Export Courses
**GET** `/api/v1/admin/courses/export`

Exports course data in JSON or CSV format.

#### Query Parameters
- `format` (optional): Export format (`json`, `csv`) (default: `json`)
- `include_deleted` (optional): Include deleted courses (`true`, `false`) (default: `false`)

#### Response (JSON)
```json
{
  "success": true,
  "exportDate": "2024-01-15T13:00:00Z",
  "totalCourses": 45,
  "data": [ /* array of all courses */ ]
}
```

#### Response (CSV)
Returns CSV file with headers:
```
ID,Title,Status,Level,Category,Instructor,Price,Students,Rating,Created At,Is Premium,Is Deleted
10,"Advanced JavaScript Programming",published,Advanced,"Programming","John Smith",999000,125,4.5,"2024-01-15T10:30:00Z",true,false
...
```

## Response Format

All API responses follow this standard format:

### Success Response
```json
{
  "success": true,
  "message": "Optional success message",
  "data": { /* response data */ },
  "pagination": { /* pagination info for list endpoints */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Additional error details (in development)",
  "errors": [ /* validation errors array */ ]
}
```

## Error Handling

### HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **500**: Internal Server Error

### Common Error Messages
- `"Access token is required"` - Missing JWT token
- `"Insufficient permissions"` - User lacks admin role
- `"Course not found"` - Course ID doesn't exist
- `"You can only update your own courses"` - Non-admin trying to update other's course
- `"Only admins can change course status"` - Status change requires admin role
- `"Course title is required"` - Validation error
- `"Invalid course category"` - Category doesn't exist or is inactive

## Examples

### Complete Course Creation Flow
```javascript
// 1. Create a new course
const response = await fetch('/api/v1/admin/courses', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'React.js Masterclass',
    description: 'Complete React.js course from beginner to advanced',
    category_id: 2,
    level: 'Intermediate',
    duration: 180,
    price: 1499000,
    is_premium: true,
    status: 'draft'
  })
});

// 2. Update course status to published
const statusResponse = await fetch(`/api/v1/admin/courses/${courseId}/status`, {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'published'
  })
});
```

### Bulk Operations Example
```javascript
// Bulk update multiple courses
const bulkResponse = await fetch('/api/v1/admin/courses/bulk/update', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    course_ids: [10, 11, 12, 13],
    update_data: {
      is_premium: true,
      discount: 20
    }
  })
});
```

### Advanced Filtering Example
```javascript
// Get premium courses by specific instructor with high ratings
const response = await fetch('/api/v1/admin/courses?' + new URLSearchParams({
  instructor_id: 5,
  is_premium: 'true',
  status: 'published',
  sortBy: 'rating',
  page: 1,
  limit: 20
}), {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

---

## Security Notes
- All endpoints require valid JWT authentication
- Admin role is strictly enforced
- Input validation is performed on all requests
- Sensitive operations (permanent delete, bulk operations) require admin privileges
- Rate limiting should be implemented in production

## Development Notes
- The API follows RESTful principles
- All timestamps are in ISO 8601 format
- Pagination is implemented for list endpoints
- Soft deletion is used for data safety
- Comprehensive error handling with appropriate HTTP status codes
- Full audit trail through created_at/updated_at timestamps