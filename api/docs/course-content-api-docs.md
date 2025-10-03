# Course Content Management API Documentation

## Overview
This document provides comprehensive documentation for the Course Content Management API endpoints. These APIs handle course modules, lessons, enrollments, reviews, analytics, and dashboard features.

## Base URL
```
/api/v1/course-content
```

## Authentication
Most endpoints require authentication using JWT tokens. Some endpoints support optional authentication for public access.

### Authentication Types
- **Required Auth**: `Authorization: Bearer <jwt_token>`
- **Optional Auth**: Optional JWT token for enhanced features
- **Public**: No authentication required

---

## Module Management

### Create Module
Create a new module within a course.

**Endpoint**: `POST /courses/:course_id/modules`  
**Auth**: Required  
**Roles**: Admin, Course Instructor

**Request Body**:
```json
{
  "title": "Introduction to Web Development",
  "position": 1
}
```

**Response**:
```json
{
  "success": true,
  "message": "Module created successfully",
  "data": {
    "id": 1,
    "title": "Introduction to Web Development",
    "position": 1,
    "course_id": 123,
    "created_at": "2024-01-01T10:00:00Z"
  }
}
```

### Get Course Modules
Retrieve all modules for a specific course.

**Endpoint**: `GET /courses/:course_id/modules`  
**Auth**: Public  

**Query Parameters**:
- `include_lessons` (boolean): Include lessons in response
- `sort` (string): Sort order (default: position)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Introduction to Web Development",
      "position": 1,
      "lessons_count": 5,
      "lessons": [...] // if include_lessons=true
    }
  ]
}
```

### Get Module by ID
Retrieve a specific module with its details.

**Endpoint**: `GET /modules/:module_id`  
**Auth**: Public  

### Update Module
Update module details.

**Endpoint**: `PUT /modules/:module_id`  
**Auth**: Required  
**Roles**: Admin, Course Instructor

**Request Body**:
```json
{
  "title": "Updated Module Title",
  "position": 2
}
```

### Delete Module
Delete a module and all its lessons.

**Endpoint**: `DELETE /modules/:module_id`  
**Auth**: Required  
**Roles**: Admin, Course Instructor

### Reorder Modules
Change the order of modules within a course.

**Endpoint**: `POST /courses/:course_id/modules/reorder`  
**Auth**: Required  
**Roles**: Admin, Course Instructor

**Request Body**:
```json
{
  "module_orders": [
    { "module_id": 1, "position": 2 },
    { "module_id": 2, "position": 1 }
  ]
}
```

---

## Lesson Management

### Create Lesson
Create a new lesson within a module.

**Endpoint**: `POST /modules/:module_id/lessons`  
**Auth**: Required  
**Roles**: Admin, Course Instructor

**Request Body**:
```json
{
  "title": "HTML Basics",
  "type": "video",
  "content": "Lesson content here...",
  "duration": 1800,
  "position": 1
}
```

**Response**:
```json
{
  "success": true,
  "message": "Lesson created successfully",
  "data": {
    "id": 1,
    "title": "HTML Basics",
    "type": "video",
    "duration": 1800,
    "position": 1,
    "module_id": 123
  }
}
```

### Get Module Lessons
Retrieve all lessons for a specific module.

**Endpoint**: `GET /modules/:module_id/lessons`  
**Auth**: Public  

**Query Parameters**:
- `sort` (string): Sort order (default: position)
- `type` (string): Filter by lesson type

### Get Course Lessons
Retrieve all lessons across all modules of a course.

**Endpoint**: `GET /courses/:course_id/lessons`  
**Auth**: Public  

### Get Lesson by ID
Retrieve a specific lesson with full content.

**Endpoint**: `GET /lessons/:lesson_id`  
**Auth**: Optional  

**Note**: Full content may require authentication or enrollment.

### Update Lesson
Update lesson details and content.

**Endpoint**: `PUT /lessons/:lesson_id`  
**Auth**: Required  
**Roles**: Admin, Course Instructor

### Delete Lesson
Delete a specific lesson.

**Endpoint**: `DELETE /lessons/:lesson_id`  
**Auth**: Required  
**Roles**: Admin, Course Instructor

### Reorder Lessons
Change the order of lessons within a module.

**Endpoint**: `POST /modules/:module_id/lessons/reorder`  
**Auth**: Required  
**Roles**: Admin, Course Instructor

**Request Body**:
```json
{
  "lesson_orders": [
    { "lesson_id": 1, "position": 2 },
    { "lesson_id": 2, "position": 1 }
  ]
}
```

---

## Enrollment Management

### Enroll in Course
Enroll the authenticated user in a course.

**Endpoint**: `POST /courses/:course_id/enroll`  
**Auth**: Required  

**Response**:
```json
{
  "success": true,
  "message": "Successfully enrolled in course",
  "data": {
    "enrollment": {
      "id": 1,
      "user_id": 123,
      "course_id": 456,
      "progress": 0,
      "status": "not-started",
      "start_date": "2024-01-01T10:00:00Z"
    },
    "course": {
      "id": 456,
      "title": "Web Development Bootcamp",
      "level": "beginner"
    }
  }
}
```

### Get User Enrollments
Retrieve all courses the user is enrolled in.

**Endpoint**: `GET /enrollments`  
**Auth**: Required  

**Query Parameters**:
- `status` (string): Filter by enrollment status
- `include_course_details` (boolean): Include detailed course info
- `page` (number): Page number for pagination
- `limit` (number): Items per page

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "progress": 45,
      "status": "in-progress",
      "start_date": "2024-01-01T10:00:00Z",
      "Course": {
        "id": 456,
        "title": "Web Development Bootcamp",
        "thumbnail": "...",
        "Instructor": {
          "name": "John Doe"
        }
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_items": 25,
    "items_per_page": 10
  }
}
```

### Update Enrollment Progress
Update progress for a specific course enrollment.

**Endpoint**: `PATCH /courses/:course_id/progress`  
**Auth**: Required  

**Request Body**:
```json
{
  "progress": 75,
  "status": "in-progress",
  "completed_lessons": [1, 2, 3, 4, 5]
}
```

### Unenroll from Course
Remove enrollment from a course.

**Endpoint**: `DELETE /courses/:course_id/enroll`  
**Auth**: Required  

---

## Review Management

### Create or Update Review
Create a new review or update existing review for a course.

**Endpoint**: `POST /courses/:course_id/reviews`  
**Auth**: Required  

**Request Body**:
```json
{
  "rating": 5,
  "comment": "Excellent course with great content and clear explanations!"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "id": 1,
    "rating": 5,
    "comment": "Excellent course...",
    "verified": true,
    "helpful": 0,
    "not_helpful": 0,
    "user_id": 123,
    "course_id": 456,
    "created_at": "2024-01-01T10:00:00Z"
  }
}
```

### Get Course Reviews
Retrieve reviews for a specific course.

**Endpoint**: `GET /courses/:course_id/reviews`  
**Auth**: Public  

**Query Parameters**:
- `rating` (number): Filter by rating (1-5)
- `verified_only` (boolean): Show only verified reviews
- `sort` (string): Sort order (newest, oldest, highest_rated, lowest_rated, most_helpful)
- `page` (number): Page number
- `limit` (number): Items per page

**Response**:
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": 1,
        "rating": 5,
        "comment": "Excellent course...",
        "verified": true,
        "helpful": 12,
        "not_helpful": 1,
        "User": {
          "name": "Jane Smith",
          "avatar_url": "..."
        },
        "created_at": "2024-01-01T10:00:00Z"
      }
    ],
    "summary": {
      "average_rating": 4.6,
      "total_reviews": 150,
      "verified_reviews": 120,
      "rating_distribution": {
        "5": 85,
        "4": 45,
        "3": 15,
        "2": 3,
        "1": 2
      }
    }
  },
  "pagination": {
    "current_page": 1,
    "total_pages": 15,
    "total_items": 150
  }
}
```

### Mark Review Helpful
Mark a review as helpful or not helpful.

**Endpoint**: `PATCH /reviews/:review_id/helpful`  
**Auth**: Required  

**Request Body**:
```json
{
  "helpful": true
}
```

### Delete Review
Delete the user's own review.

**Endpoint**: `DELETE /courses/:course_id/reviews`  
**Auth**: Required  

---

## Analytics and Dashboard

### Get Course Structure with Progress
Retrieve course structure including modules, lessons, and user progress.

**Endpoint**: `GET /courses/:course_id/structure`  
**Auth**: Optional  

**Response**:
```json
{
  "success": true,
  "data": {
    "modules": [
      {
        "id": 1,
        "title": "Introduction",
        "position": 1,
        "lessons": [
          {
            "id": 1,
            "title": "Welcome",
            "type": "video",
            "duration": 600,
            "completed": true
          }
        ],
        "completedLessons": 3,
        "totalLessons": 5
      }
    ],
    "totalModules": 8,
    "totalLessons": 45,
    "completedLessons": 12
  }
}
```

### Calculate Course Progress
Calculate detailed progress information for a course.

**Endpoint**: `POST /courses/:course_id/progress`  
**Auth**: Required  

**Request Body**:
```json
{
  "completed_lessons": [1, 2, 3, 4, 5]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalLessons": 45,
    "completedLessons": 12,
    "progressPercentage": 27,
    "totalDuration": 18000,
    "completedDuration": 4800,
    "nextLesson": {
      "id": 6,
      "title": "CSS Selectors",
      "type": "video",
      "module": "CSS Fundamentals"
    }
  }
}
```

### Get Learning Dashboard
Retrieve user's personalized learning dashboard.

**Endpoint**: `GET /dashboard`  
**Auth**: Required  

**Response**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalCourses": 5,
      "completedCourses": 2,
      "inProgressCourses": 3,
      "averageProgress": 62
    },
    "recentActivity": [
      {
        "courseId": 456,
        "courseTitle": "Web Development Bootcamp",
        "progress": 75,
        "status": "in-progress",
        "lastActivity": "2024-01-15T14:30:00Z"
      }
    ],
    "nextSteps": [
      {
        "courseId": 456,
        "courseTitle": "Web Development Bootcamp",
        "progress": 75,
        "thumbnail": "..."
      }
    ],
    "enrollments": [...]
  }
}
```

### Get Course Enrollment Statistics
Get enrollment statistics for a course (instructors and admins only).

**Endpoint**: `GET /courses/:course_id/enrollment-stats`  
**Auth**: Required  
**Roles**: Admin, Course Instructor

**Response**:
```json
{
  "success": true,
  "data": {
    "totalEnrollments": 1250,
    "completionRate": 68,
    "averageProgress": 72.5,
    "statusBreakdown": [
      { "status": "not-started", "count": 125 },
      { "status": "in-progress", "count": 875 },
      { "status": "completed", "count": 250 }
    ]
  }
}
```

### Get Course Review Analytics
Get detailed review analytics for a course (instructors and admins only).

**Endpoint**: `GET /courses/:course_id/review-analytics`  
**Auth**: Required  
**Roles**: Admin, Course Instructor

**Response**:
```json
{
  "success": true,
  "data": {
    "totalReviews": 450,
    "averageRating": 4.6,
    "ratingDistribution": {
      "5": 245,
      "4": 125,
      "3": 55,
      "2": 20,
      "1": 5
    },
    "verifiedReviews": 380,
    "verifiedPercentage": 84,
    "helpfulnessRatio": 78
  }
}
```

### Validate Course Structure
Validate course structure and identify issues (instructors and admins only).

**Endpoint**: `GET /courses/:course_id/validate`  
**Auth**: Required  
**Roles**: Admin, Course Instructor

**Response**:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "issues": [
      {
        "type": "warning",
        "message": "2 module(s) have no lessons",
        "details": ["Advanced Topics", "Conclusion"]
      }
    ],
    "statistics": {
      "totalModules": 8,
      "totalLessons": 45,
      "totalDuration": 18000,
      "emptyModules": 2,
      "lessonsWithoutContent": 0
    }
  }
}
```

---

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

### Common HTTP Status Codes
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., already enrolled)
- `422 Unprocessable Entity`: Validation errors
- `500 Internal Server Error`: Server error

### Error Types
- **ValidationError**: Invalid request data
- **AuthenticationError**: Authentication required or invalid
- **AuthorizationError**: Insufficient permissions
- **NotFoundError**: Resource not found
- **ConflictError**: Resource conflict
- **ServerError**: Internal server error

---

## Rate Limiting
- **Standard endpoints**: 100 requests per hour per user
- **Heavy operations** (bulk operations): 20 requests per hour per user
- **Analytics endpoints**: 50 requests per hour per user

---

## Validation Rules

### Module Validation
- `title`: Required, 3-255 characters
- `position`: Required, positive integer

### Lesson Validation
- `title`: Required, 3-255 characters
- `type`: Required, one of: video, text, quiz, assignment, discussion
- `content`: Optional for video type, required for others
- `duration`: Optional, positive integer (seconds)
- `position`: Required, positive integer

### Review Validation
- `rating`: Required, integer 1-5
- `comment`: Optional, max 2000 characters

### Progress Validation
- `progress`: Required, integer 0-100
- `status`: Optional, one of: not-started, in-progress, completed
- `completed_lessons`: Optional, array of lesson IDs

---

## Service Layer Integration

The Course Content API leverages a comprehensive service layer for:

- **Progress Calculation**: Automatic progress tracking and next lesson suggestions
- **Enrollment Management**: Business logic for enrollment validation and prerequisites
- **Analytics**: Statistical analysis and reporting for courses and enrollments
- **Structure Validation**: Course content validation and quality checks
- **Dashboard Data**: Personalized learning analytics and recommendations

---

## Usage Examples

### Enrolling in a Course and Tracking Progress

```javascript
// 1. Enroll in course
const enrollment = await fetch('/api/v1/course-content/courses/456/enroll', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

// 2. Get course structure
const structure = await fetch('/api/v1/course-content/courses/456/structure', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 3. Update progress
const progress = await fetch('/api/v1/course-content/courses/456/progress', {
  method: 'PATCH',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    progress: 25,
    status: 'in-progress',
    completed_lessons: [1, 2, 3]
  })
});
```

### Creating Course Content

```javascript
// 1. Create module
const module = await fetch('/api/v1/course-content/courses/456/modules', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Introduction to React',
    position: 1
  })
});

// 2. Add lessons to module
const lesson = await fetch(`/api/v1/course-content/modules/${module.data.id}/lessons`, {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'What is React?',
    type: 'video',
    content: 'Introduction to React concepts...',
    duration: 900,
    position: 1
  })
});
```

---

## Migration and Deployment Notes

### Database Requirements
- Ensure all Sequelize models are properly associated
- Run database migrations for new service layer features
- Index optimization for performance on large datasets

### Monitoring and Logging
- Track API usage patterns for optimization
- Monitor service layer performance
- Log enrollment and progress patterns for analytics

### Security Considerations
- Validate user ownership for course modifications
- Implement rate limiting for public endpoints  
- Secure analytics endpoints for instructor/admin access only