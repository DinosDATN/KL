# Admin API Documentation

This document provides comprehensive documentation for all admin APIs in the system. The admin APIs are designed to provide full administrative control over courses, documents, problems/exercises, contests, and users.

## Authentication & Authorization

All admin endpoints require:
- Valid JWT token in Authorization header: `Bearer <token>`
- Admin role (`admin`) or Creator role (`creator`) unless otherwise specified
- Some endpoints are restricted to Admin role only

## Base URL Structure

All admin APIs follow this pattern:
```
/api/v1/admin/{resource}
```

## Response Format

All APIs follow a consistent response format:

### Success Response
```json
{
  "success": true,
  "message": "Optional success message",
  "data": {...}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Optional detailed error"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "current_page": 1,
    "total_pages": 10,
    "total_items": 100,
    "items_per_page": 10
  }
}
```

## Course Admin APIs

**Base Path:** `/api/v1/admin/courses`

### Course CRUD Operations

#### Create Course
- **POST** `/api/v1/admin/courses`
- **Roles:** Admin, Creator
- **Body:**
```json
{
  "title": "Course Title",
  "description": "Course description",
  "category_id": 1,
  "level": "Beginner|Intermediate|Advanced",
  "duration": 120,
  "price": 99000,
  "original_price": 150000,
  "discount": 34,
  "is_premium": false,
  "thumbnail": "image_url",
  "instructor_id": 2,
  "status": "draft|published|archived"
}
```

#### Get All Courses (Admin View)
- **GET** `/api/v1/admin/courses`
- **Roles:** Admin, Creator
- **Query Parameters:**
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `status`: draft|published|archived
  - `category_id`: Filter by category
  - `instructor_id`: Filter by instructor
  - `level`: Beginner|Intermediate|Advanced
  - `is_premium`: true|false
  - `is_deleted`: true|false
  - `search`: Search in title/description
  - `sortBy`: title|rating|students|duration|price|created_at
  - `priceRange`: free|paid|discounted|under-500k|500k-1m|over-1m

#### Get Course by ID (Admin View)
- **GET** `/api/v1/admin/courses/:id`
- **Roles:** Admin, Creator
- **Query Parameters:**
  - `include_deleted`: true|false

#### Update Course
- **PUT** `/api/v1/admin/courses/:id`
- **Roles:** Admin, Creator (own courses)
- **Body:** Same as create course

#### Soft Delete Course
- **DELETE** `/api/v1/admin/courses/:id`
- **Roles:** Admin, Creator (own courses)

#### Permanently Delete Course
- **DELETE** `/api/v1/admin/courses/:id/permanent`
- **Roles:** Admin only

#### Restore Course
- **POST** `/api/v1/admin/courses/:id/restore`
- **Roles:** Admin only

#### Update Course Status
- **PATCH** `/api/v1/admin/courses/:id/status`
- **Roles:** Admin only
- **Body:**
```json
{
  "status": "draft|published|archived"
}
```

### Course Statistics & Analytics

#### Get Course Statistics
- **GET** `/api/v1/admin/courses/statistics`
- **Roles:** Admin only
- **Response:**
```json
{
  "success": true,
  "data": {
    "totalCourses": 150,
    "publishedCourses": 120,
    "deletedCourses": 5,
    "coursesByLevel": [...],
    "topCategories": [...],
    "totalRevenue": 50000000,
    "totalStudents": 25000,
    "averageRating": 4.3
  }
}
```

#### Get Deleted Courses
- **GET** `/api/v1/admin/courses/deleted`
- **Roles:** Admin only

#### Export Courses
- **GET** `/api/v1/admin/courses/export`
- **Roles:** Admin only
- **Query Parameters:**
  - `format`: json|csv (default: json)
  - `include_deleted`: true|false (default: false)

### Bulk Operations

#### Bulk Update Courses
- **PATCH** `/api/v1/admin/courses/bulk/update`
- **Roles:** Admin only
- **Body:**
```json
{
  "course_ids": [1, 2, 3],
  "update_data": {
    "status": "published",
    "is_premium": true
  }
}
```

#### Bulk Delete Courses
- **POST** `/api/v1/admin/courses/bulk/delete`
- **Roles:** Admin only
- **Body:**
```json
{
  "course_ids": [1, 2, 3],
  "permanent": false
}
```

#### Bulk Restore Courses
- **POST** `/api/v1/admin/courses/bulk/restore`
- **Roles:** Admin only
- **Body:**
```json
{
  "course_ids": [1, 2, 3]
}
```

## Document Admin APIs

**Base Path:** `/api/v1/admin/documents`

### Document CRUD Operations

#### Create Document
- **POST** `/api/v1/admin/documents`
- **Roles:** Admin, Creator
- **Body:**
```json
{
  "title": "Document Title",
  "description": "Document description",
  "content": "Document content (HTML/Markdown)",
  "topic_id": 1,
  "level": "Beginner|Intermediate|Advanced",
  "duration": 30,
  "thumbnail_url": "image_url",
  "created_by": 2
}
```

#### Get All Documents (Admin View)
- **GET** `/api/v1/admin/documents`
- **Roles:** Admin, Creator
- **Query Parameters:**
  - `page`, `limit`: Pagination
  - `topic_id`: Filter by topic
  - `created_by`: Filter by creator
  - `level`: Beginner|Intermediate|Advanced
  - `is_deleted`: true|false
  - `search`: Search in title/description
  - `sortBy`: title|rating|students|created_at
  - `students_range`: low|medium|high

#### Get Document by ID (Admin View)
- **GET** `/api/v1/admin/documents/:id`
- **Roles:** Admin, Creator
- **Query Parameters:**
  - `include_deleted`: true|false

#### Update Document
- **PUT** `/api/v1/admin/documents/:id`
- **Roles:** Admin, Creator (own documents)

#### Soft Delete Document
- **DELETE** `/api/v1/admin/documents/:id`
- **Roles:** Admin, Creator (own documents)

#### Permanently Delete Document
- **DELETE** `/api/v1/admin/documents/:id/permanent`
- **Roles:** Admin only

#### Restore Document
- **POST** `/api/v1/admin/documents/:id/restore`
- **Roles:** Admin only

### Document Statistics & Management

#### Get Document Statistics
- **GET** `/api/v1/admin/documents/statistics`
- **Roles:** Admin only

#### Get Deleted Documents
- **GET** `/api/v1/admin/documents/deleted`
- **Roles:** Admin only

#### Export Documents
- **GET** `/api/v1/admin/documents/export`
- **Roles:** Admin only
- **Query Parameters:**
  - `format`: json|csv
  - `include_deleted`: true|false

### Bulk Operations

#### Bulk Update Documents
- **PATCH** `/api/v1/admin/documents/bulk/update`
- **Roles:** Admin only

#### Bulk Delete Documents
- **POST** `/api/v1/admin/documents/bulk/delete`
- **Roles:** Admin only

#### Bulk Restore Documents
- **POST** `/api/v1/admin/documents/bulk/restore`
- **Roles:** Admin only

### Topic Management

#### Create Topic
- **POST** `/api/v1/admin/documents/topics`
- **Roles:** Admin only
- **Body:**
```json
{
  "name": "Topic Name"
}
```

#### Update Topic
- **PUT** `/api/v1/admin/documents/topics/:id`
- **Roles:** Admin only

#### Delete Topic
- **DELETE** `/api/v1/admin/documents/topics/:id`
- **Roles:** Admin only

## Problem/Exercise Admin APIs

**Base Path:** `/api/v1/admin/problems`

### Problem CRUD Operations

#### Create Problem
- **POST** `/api/v1/admin/problems`
- **Roles:** Admin, Creator
- **Body:**
```json
{
  "title": "Problem Title",
  "description": "Problem description",
  "difficulty": "Easy|Medium|Hard",
  "estimated_time": "30 minutes",
  "category_id": 1,
  "is_premium": false,
  "created_by": 2,
  "examples": [
    {
      "input": "input example",
      "output": "expected output",
      "explanation": "explanation"
    }
  ],
  "constraints": [
    {
      "constraint": "1 <= n <= 1000"
    }
  ],
  "starter_codes": [
    {
      "language": "python",
      "code": "def solution():\n    pass"
    }
  ],
  "test_cases": [
    {
      "input": "test input",
      "output": "expected output",
      "is_hidden": true
    }
  ],
  "tags": [1, 2, 3]
}
```

#### Get All Problems (Admin View)
- **GET** `/api/v1/admin/problems`
- **Roles:** Admin, Creator
- **Query Parameters:**
  - `page`, `limit`: Pagination
  - `category_id`: Filter by category
  - `created_by`: Filter by creator
  - `difficulty`: Easy|Medium|Hard
  - `is_deleted`: true|false
  - `is_premium`: true|false
  - `is_popular`: true|false
  - `is_new`: true|false
  - `search`: Search in title/description
  - `sortBy`: title|difficulty|likes|acceptance|created_at
  - `acceptance_range`: low|medium|high

#### Get Problem by ID (Admin View)
- **GET** `/api/v1/admin/problems/:id`
- **Roles:** Admin, Creator
- **Query Parameters:**
  - `include_deleted`: true|false

#### Update Problem
- **PUT** `/api/v1/admin/problems/:id`
- **Roles:** Admin, Creator (own problems)

#### Soft Delete Problem
- **DELETE** `/api/v1/admin/problems/:id`
- **Roles:** Admin, Creator (own problems)

#### Permanently Delete Problem
- **DELETE** `/api/v1/admin/problems/:id/permanent`
- **Roles:** Admin only

#### Restore Problem
- **POST** `/api/v1/admin/problems/:id/restore`
- **Roles:** Admin only

### Problem Statistics

#### Get Problem Statistics
- **GET** `/api/v1/admin/problems/statistics`
- **Roles:** Admin only
- **Response:**
```json
{
  "success": true,
  "data": {
    "totalProblems": 500,
    "publishedProblems": 450,
    "deletedProblems": 20,
    "problemsByDifficulty": [...],
    "problemsByCategory": [...],
    "totalSubmissions": 150000,
    "totalSolved": 75000,
    "averageAcceptance": 50.5,
    "popularProblems": 25,
    "newProblems": 15,
    "premiumProblems": 100
  }
}
```

### Bulk Operations

#### Bulk Update Problems
- **PATCH** `/api/v1/admin/problems/bulk/update`
- **Roles:** Admin only

### Category Management

#### Create Problem Category
- **POST** `/api/v1/admin/problems/categories`
- **Roles:** Admin only
- **Body:**
```json
{
  "name": "Category Name",
  "description": "Category description"
}
```

#### Update Problem Category
- **PUT** `/api/v1/admin/problems/categories/:id`
- **Roles:** Admin only

#### Delete Problem Category
- **DELETE** `/api/v1/admin/problems/categories/:id`
- **Roles:** Admin only

### Tag Management

#### Create Tag
- **POST** `/api/v1/admin/problems/tags`
- **Roles:** Admin only
- **Body:**
```json
{
  "name": "Tag Name"
}
```

#### Update Tag
- **PUT** `/api/v1/admin/problems/tags/:id`
- **Roles:** Admin only

#### Delete Tag
- **DELETE** `/api/v1/admin/problems/tags/:id`
- **Roles:** Admin only

## Contest Admin APIs

**Base Path:** `/api/v1/admin/contests`

### Contest CRUD Operations

#### Create Contest
- **POST** `/api/v1/admin/contests`
- **Roles:** Admin, Creator
- **Body:**
```json
{
  "title": "Contest Title",
  "description": "Contest description",
  "start_time": "2024-01-01T10:00:00Z",
  "end_time": "2024-01-01T12:00:00Z",
  "created_by": 2
}
```

#### Get All Contests (Admin View)
- **GET** `/api/v1/admin/contests`
- **Roles:** Admin, Creator
- **Query Parameters:**
  - `page`, `limit`: Pagination
  - `created_by`: Filter by creator
  - `status`: upcoming|active|completed
  - `search`: Search in title/description
  - `sortBy`: title|start_time|end_time|created_at
  - `date_range`: today|this_week|this_month

#### Get Contest by ID (Admin View)
- **GET** `/api/v1/admin/contests/:id`
- **Roles:** Admin, Creator

#### Update Contest
- **PUT** `/api/v1/admin/contests/:id`
- **Roles:** Admin, Creator (own contests)

#### Delete Contest
- **DELETE** `/api/v1/admin/contests/:id`
- **Roles:** Admin only

### Contest Problem Management

#### Add Problem to Contest
- **POST** `/api/v1/admin/contests/:id/problems`
- **Roles:** Admin, Creator (own contests)
- **Body:**
```json
{
  "problem_id": 123,
  "points": 100
}
```

#### Remove Problem from Contest
- **DELETE** `/api/v1/admin/contests/:id/problems/:problem_id`
- **Roles:** Admin, Creator (own contests)

### Contest Management

#### Get Contest Statistics
- **GET** `/api/v1/admin/contests/statistics`
- **Roles:** Admin only

#### Get Contest Participants
- **GET** `/api/v1/admin/contests/:id/participants`
- **Roles:** Admin only

#### Export Contests
- **GET** `/api/v1/admin/contests/export`
- **Roles:** Admin only
- **Query Parameters:**
  - `format`: json|csv
  - `include_participants`: true|false

### Bulk Operations

#### Bulk Update Contests
- **PATCH** `/api/v1/admin/contests/bulk/update`
- **Roles:** Admin only

## User Admin APIs

**Base Path:** `/api/v1/admin/users`

### User CRUD Operations

#### Create User
- **POST** `/api/v1/admin/users`
- **Roles:** Admin only
- **Body:**
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123",
  "role": "user|creator|admin",
  "is_active": true,
  "subscription_status": "free|premium"
}
```

#### Get All Users (Admin View)
- **GET** `/api/v1/admin/users`
- **Roles:** Admin only
- **Query Parameters:**
  - `page`, `limit`: Pagination
  - `role`: user|creator|admin
  - `is_active`: true|false
  - `is_online`: true|false
  - `subscription_status`: free|premium
  - `search`: Search in name/email
  - `sortBy`: name|email|role|created_at|last_seen
  - `registration_date`: today|this_week|this_month|this_year
  - `last_activity`: online|recent|inactive

#### Get User by ID (Admin View)
- **GET** `/api/v1/admin/users/:id`
- **Roles:** Admin only

#### Update User
- **PUT** `/api/v1/admin/users/:id`
- **Roles:** Admin only

#### Delete User
- **DELETE** `/api/v1/admin/users/:id`
- **Roles:** Admin only

### User Management Operations

#### Update User Role
- **PATCH** `/api/v1/admin/users/:id/role`
- **Roles:** Admin only
- **Body:**
```json
{
  "role": "user|creator|admin"
}
```

#### Toggle User Status
- **PATCH** `/api/v1/admin/users/:id/status`
- **Roles:** Admin only
- **Body:**
```json
{
  "is_active": true
}
```

#### Get User Activity Log
- **GET** `/api/v1/admin/users/:id/activity`
- **Roles:** Admin only
- **Query Parameters:**
  - `page`, `limit`: Pagination

### User Statistics

#### Get User Statistics
- **GET** `/api/v1/admin/users/statistics`
- **Roles:** Admin only
- **Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 10000,
    "activeUsers": 9500,
    "inactiveUsers": 500,
    "onlineUsers": 250,
    "usersByRole": [...],
    "usersBySubscription": [...],
    "registrationTrends": [...],
    "topCreators": [...],
    "recentActivity": {
      "last24h": 1500,
      "last7days": 8000,
      "last30days": 9500
    }
  }
}
```

#### Export Users
- **GET** `/api/v1/admin/users/export`
- **Roles:** Admin only
- **Query Parameters:**
  - `format`: json|csv
  - `include_profiles`: true|false
  - `include_stats`: true|false

### Bulk Operations

#### Bulk Update Users
- **PATCH** `/api/v1/admin/users/bulk/update`
- **Roles:** Admin only
- **Body:**
```json
{
  "user_ids": [1, 2, 3],
  "update_data": {
    "is_active": false,
    "subscription_status": "premium"
  }
}
```

## Error Codes

| HTTP Status | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation failed |
| 500 | Internal Server Error - Server error |

## Rate Limiting

Admin APIs have higher rate limits than public APIs:
- 1000 requests per hour per user for read operations
- 200 requests per hour per user for write operations
- 50 requests per hour per user for bulk operations

## Security Considerations

1. **Authentication**: All endpoints require valid JWT tokens
2. **Authorization**: Role-based access control (RBAC)
3. **Input Validation**: All inputs are validated and sanitized
4. **SQL Injection Protection**: Using Sequelize ORM with parameterized queries
5. **Rate Limiting**: Implemented to prevent abuse
6. **Audit Logging**: All admin actions are logged for audit purposes

## Best Practices

1. **Pagination**: Always use pagination for list endpoints
2. **Filtering**: Use appropriate filters to reduce response size
3. **Bulk Operations**: Use bulk endpoints for mass operations
4. **Error Handling**: Always check response status and handle errors appropriately
5. **Data Export**: Use CSV format for large datasets
6. **Soft Deletes**: Prefer soft deletes over permanent deletion for data integrity

## Example Usage

### JavaScript/Axios Example

```javascript
// Get all courses with filtering
const response = await axios.get('/api/v1/admin/courses', {
  params: {
    page: 1,
    limit: 20,
    status: 'published',
    level: 'Beginner',
    search: 'JavaScript'
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Create a new problem
const problem = await axios.post('/api/v1/admin/problems', {
  title: 'Two Sum Problem',
  description: 'Find two numbers that add up to target',
  difficulty: 'Easy',
  category_id: 1,
  examples: [
    {
      input: 'nums = [2,7,11,15], target = 9',
      output: '[0,1]',
      explanation: 'nums[0] + nums[1] = 2 + 7 = 9'
    }
  ]
}, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Bulk update users
const bulkUpdate = await axios.patch('/api/v1/admin/users/bulk/update', {
  user_ids: [1, 2, 3, 4, 5],
  update_data: {
    is_active: true,
    subscription_status: 'premium'
  }
}, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Support

For additional support or questions about the admin APIs:
1. Check the API response messages for detailed error information
2. Review the server logs for debugging information
3. Ensure proper authentication and authorization
4. Verify input data format and required fields