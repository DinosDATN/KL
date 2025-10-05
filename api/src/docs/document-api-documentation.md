# Document API Documentation

This document provides comprehensive documentation for all document-related API endpoints including modules, lessons, progress tracking, and analytics.

## Base URL
All endpoints are prefixed with `/api/v1/documents`

## Authentication
Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Document Management

### Create Document
**POST** `/`

Creates a new document.

**Authentication:** Required  
**Validation:** Document creation validation

**Request Body:**
```json
{
  "title": "Introduction to JavaScript",
  "description": "Learn the fundamentals of JavaScript programming",
  "content": "This document covers basic JavaScript concepts...",
  "topic_id": 1,
  "level": "Beginner",
  "duration": 120,
  "thumbnail_url": "https://example.com/thumbnail.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Document created successfully",
  "data": {
    "id": 1,
    "title": "Introduction to JavaScript",
    "description": "Learn the fundamentals of JavaScript programming",
    "content": "This document covers basic JavaScript concepts...",
    "topic_id": 1,
    "level": "Beginner",
    "duration": 120,
    "thumbnail_url": "https://example.com/thumbnail.jpg",
    "created_by": 123,
    "students": 0,
    "rating": 0,
    "is_deleted": false,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

### Get All Documents
**GET** `/`

Retrieves all documents with pagination and filtering options.

**Authentication:** Optional  
**Query Parameters:**
- `page` (integer, default: 1): Page number
- `limit` (integer, default: 10, max: 100): Items per page
- `level` (string): Filter by difficulty level (Beginner, Intermediate, Advanced)
- `topic_id` (integer): Filter by topic ID
- `category_id` (integer): Filter by category ID
- `created_by` (integer): Filter by creator user ID
- `search` (string): Search in title, description, content
- `sortBy` (string): Sort by field (title, rating, students, duration, created_at)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Introduction to JavaScript",
      "description": "Learn the fundamentals of JavaScript programming",
      "topic_id": 1,
      "level": "Beginner",
      "duration": 120,
      "students": 150,
      "rating": 4.5,
      "thumbnail_url": "https://example.com/thumbnail.jpg",
      "created_by": 123,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 50,
    "items_per_page": 10
  }
}
```

### Get Document by ID
**GET** `/:id`

Retrieves a single document by ID.

**Authentication:** Optional  
**Parameters:**
- `id` (integer): Document ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Introduction to JavaScript",
    "description": "Learn the fundamentals of JavaScript programming",
    "content": "This document covers basic JavaScript concepts...",
    "topic_id": 1,
    "level": "Beginner",
    "duration": 120,
    "students": 150,
    "rating": 4.5,
    "thumbnail_url": "https://example.com/thumbnail.jpg",
    "created_by": 123,
    "is_deleted": false,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

### Update Document
**PUT** `/:id`

Updates an existing document.

**Authentication:** Required  
**Authorization:** Document owner or admin  
**Parameters:**
- `id` (integer): Document ID

**Request Body:** (All fields optional)
```json
{
  "title": "Advanced JavaScript Concepts",
  "description": "Updated description",
  "content": "Updated content...",
  "level": "Intermediate",
  "duration": 180
}
```

**Response:**
```json
{
  "success": true,
  "message": "Document updated successfully",
  "data": {
    "id": 1,
    "title": "Advanced JavaScript Concepts",
    "description": "Updated description",
    "content": "Updated content...",
    "level": "Intermediate",
    "duration": 180,
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

### Delete Document
**DELETE** `/:id`

Soft deletes a document (sets is_deleted to true).

**Authentication:** Required  
**Authorization:** Document owner or admin  
**Parameters:**
- `id` (integer): Document ID

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

---

## Module Management

### Create Module
**POST** `/:id/modules`

Creates a new module within a document.

**Authentication:** Required  
**Authorization:** Document owner or admin  
**Parameters:**
- `id` (integer): Document ID

**Request Body:**
```json
{
  "title": "Variables and Data Types",
  "position": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Module created successfully",
  "data": {
    "id": 1,
    "document_id": 1,
    "title": "Variables and Data Types",
    "position": 1,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

### Get Document Modules
**GET** `/:document_id/modules`

Retrieves all modules for a document.

**Authentication:** Optional  
**Parameters:**
- `document_id` (integer): Document ID
**Query Parameters:**
- `include_stats` (boolean): Include lesson statistics
- `include_lessons` (boolean): Include lessons in response

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "document_id": 1,
      "title": "Variables and Data Types",
      "position": 1,
      "lessonCount": 5,
      "lessonsWithContent": 5,
      "completionRate": 100,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Get Module by ID
**GET** `/modules/:module_id`

Retrieves a single module by ID.

**Authentication:** Optional  
**Parameters:**
- `module_id` (integer): Module ID
**Query Parameters:**
- `include_lessons` (boolean): Include lessons
- `include_document` (boolean): Include document information

### Update Module
**PUT** `/modules/:module_id`

Updates an existing module.

**Authentication:** Required  
**Authorization:** Document owner or admin

### Delete Module
**DELETE** `/modules/:module_id`

Deletes a module and all its lessons.

**Authentication:** Required  
**Authorization:** Document owner or admin

### Reorder Modules
**POST** `/:document_id/modules/reorder`

Reorders modules within a document.

**Authentication:** Required  
**Authorization:** Document owner or admin

**Request Body:**
```json
{
  "modules": [
    { "id": 2, "position": 1 },
    { "id": 1, "position": 2 },
    { "id": 3, "position": 3 }
  ]
}
```

### Get Module Statistics
**GET** `/modules/:module_id/stats`

Retrieves detailed statistics for a module.

**Response:**
```json
{
  "success": true,
  "data": {
    "module": {
      "id": 1,
      "title": "Variables and Data Types"
    },
    "stats": {
      "totalLessons": 5,
      "lessonsWithContent": 5,
      "lessonsWithCodeExamples": 3,
      "lessonsWithoutContent": 0,
      "completionRate": 100,
      "avgContentLength": 850,
      "codeExampleRate": 60
    }
  }
}
```

### Duplicate Module
**POST** `/modules/:module_id/duplicate`

Creates a copy of a module with all its lessons.

**Authentication:** Required  
**Authorization:** Document owner or admin

---

## Lesson Management

### Create Lesson
**POST** `/modules/:module_id/lessons`

Creates a new lesson within a module.

**Authentication:** Required  
**Authorization:** Document owner or admin

**Request Body:**
```json
{
  "title": "Understanding Variables",
  "content": "Variables are containers for storing data values...",
  "code_example": "let message = 'Hello World';\nconsole.log(message);",
  "position": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lesson created successfully",
  "data": {
    "id": 1,
    "module_id": 1,
    "title": "Understanding Variables",
    "content": "Variables are containers for storing data values...",
    "code_example": "let message = 'Hello World';\nconsole.log(message);",
    "position": 1,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

### Get Module Lessons
**GET** `/modules/:module_id/lessons`

Retrieves all lessons for a module.

**Authentication:** Optional (progress requires auth)  
**Query Parameters:**
- `include_progress` (boolean): Include user's completion status

### Get Document Lessons
**GET** `/:document_id/lessons-all`

Retrieves all lessons for a document across all modules.

**Authentication:** Optional (progress requires auth)

### Get Lesson by ID
**GET** `/lessons/:lesson_id`

Retrieves a single lesson by ID.

**Authentication:** Optional (progress requires auth)  
**Query Parameters:**
- `include_progress` (boolean): Include completion status
- `include_module` (boolean): Include module information
- `include_animations` (boolean): Include animations

### Update Lesson
**PUT** `/lessons/:lesson_id`

Updates an existing lesson.

**Authentication:** Required  
**Authorization:** Document owner or admin

### Delete Lesson
**DELETE** `/lessons/:lesson_id`

Deletes a lesson.

**Authentication:** Required  
**Authorization:** Document owner or admin

### Reorder Lessons
**POST** `/modules/:module_id/lessons/reorder`

Reorders lessons within a module.

**Authentication:** Required  
**Authorization:** Document owner or admin

### Toggle Lesson Completion
**POST** `/lessons/:lesson_id/completion`

Marks a lesson as completed or incomplete.

**Authentication:** Required

**Request Body:**
```json
{
  "completed": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lesson marked as completed",
  "data": {
    "id": 1,
    "user_id": 123,
    "lesson_id": 1,
    "completed_at": "2024-01-15T10:30:00Z",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### Get User Lesson Completions
**GET** `/:document_id/my-completions`

Retrieves user's lesson completions for a document.

**Authentication:** Required

### Duplicate Lesson
**POST** `/lessons/:lesson_id/duplicate`

Creates a copy of a lesson.

**Authentication:** Required  
**Authorization:** Document owner or admin

### Get Lesson Navigation
**GET** `/lessons/:lesson_id/navigation`

Retrieves navigation information for a lesson (previous/next).

**Response:**
```json
{
  "success": true,
  "data": {
    "current": {
      "id": 2,
      "title": "Understanding Variables",
      "position": 1,
      "module_id": 1
    },
    "previous": {
      "id": 1,
      "title": "Introduction",
      "position": 1,
      "module_id": 1
    },
    "next": {
      "id": 3,
      "title": "Data Types",
      "position": 2,
      "module_id": 1
    },
    "totalLessons": 15,
    "currentPosition": 2
  }
}
```

---

## Progress & Analytics

### Get Learning Dashboard
**GET** `/dashboard`

Retrieves user's learning dashboard with progress overview.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalDocumentsStarted": 5,
      "completedDocuments": 2,
      "inProgressDocuments": 3,
      "totalLessonsCompleted": 45,
      "averageProgress": 68
    },
    "documentsWithProgress": [
      {
        "id": 1,
        "title": "Introduction to JavaScript",
        "thumbnail_url": "https://example.com/thumb.jpg",
        "Creator": {
          "id": 123,
          "name": "John Doe"
        },
        "progress": {
          "totalLessons": 20,
          "completedLessons": 15,
          "completionRate": 75,
          "startedAt": "2024-01-10T10:00:00Z",
          "lastActivityAt": "2024-01-15T10:30:00Z"
        }
      }
    ],
    "recentCompletions": [
      {
        "id": 1,
        "completed_at": "2024-01-15T10:30:00Z",
        "Lesson": {
          "id": 5,
          "title": "Functions",
          "Module": {
            "id": 2,
            "title": "Basic Concepts",
            "Document": {
              "id": 1,
              "title": "Introduction to JavaScript"
            }
          }
        }
      }
    ]
  }
}
```

### Get Document Progress
**GET** `/:document_id/progress`

Retrieves detailed progress for a specific document.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "document": {
      "id": 1,
      "title": "Introduction to JavaScript",
      "description": "Learn JavaScript fundamentals",
      "level": "Beginner"
    },
    "progress": {
      "totalLessons": 20,
      "completedLessons": 15,
      "totalModules": 4,
      "completedModules": 3,
      "completionRate": 75,
      "moduleCompletionRate": 75,
      "startedAt": "2024-01-10T10:00:00Z",
      "lastActivityAt": "2024-01-15T10:30:00Z",
      "isCompleted": false,
      "daysActive": 6
    },
    "moduleProgress": [
      {
        "id": 1,
        "title": "Introduction",
        "position": 1,
        "totalLessons": 5,
        "completedLessons": 5,
        "completionRate": 100,
        "isCompleted": true,
        "lessons": [
          {
            "id": 1,
            "title": "What is JavaScript?",
            "position": 1,
            "isCompleted": true,
            "completedAt": "2024-01-10T11:00:00Z"
          }
        ]
      }
    ]
  }
}
```

### Get Document Analytics
**GET** `/:document_id/analytics`

Retrieves analytics for document creators/instructors.

**Authentication:** Required  
**Authorization:** Document owner or admin

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalStartedUsers": 150,
      "completedUsers": 45,
      "completionRate": 30,
      "averageProgress": 65,
      "dropOffRate": 70
    },
    "lessonAnalytics": [
      {
        "id": 1,
        "title": "What is JavaScript?",
        "module_title": "Introduction",
        "module_position": 1,
        "lesson_position": 1,
        "completion_count": 140,
        "completion_rate": 93.33
      }
    ],
    "dropOffAnalysis": [
      {
        "lessonId": 1,
        "lessonTitle": "What is JavaScript?",
        "moduleTitle": "Introduction",
        "position": 1,
        "completionCount": 140,
        "completionRate": 93.33,
        "dropOffRate": 0
      }
    ],
    "engagementData": [
      {
        "completion_date": "2024-01-15",
        "completions": 25
      }
    ],
    "progressDistribution": {
      "0-25%": 30,
      "26-50%": 25,
      "51-75%": 20,
      "76-99%": 30,
      "100%": 45
    }
  }
}
```

### Mark Document Completed
**POST** `/:document_id/complete`

Marks entire document as completed (only if all lessons are completed).

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Document marked as completed",
  "data": {
    "completion": {
      "id": 1,
      "user_id": 123,
      "document_id": 1,
      "completed_at": "2024-01-15T12:00:00Z"
    },
    "progress": {
      "completionRate": 100,
      "documentCompletedAt": "2024-01-15T12:00:00Z"
    }
  }
}
```

### Get Document Leaderboard
**GET** `/:document_id/leaderboard`

Retrieves leaderboard for a document showing top learners.

**Authentication:** Optional  
**Query Parameters:**
- `limit` (integer, default: 10): Number of users to return

**Response:**
```json
{
  "success": true,
  "data": {
    "document": {
      "id": 1,
      "title": "Introduction to JavaScript"
    },
    "leaderboard": [
      {
        "rank": 1,
        "user": {
          "id": 123,
          "name": "Alice Johnson",
          "avatar_url": "https://example.com/avatar.jpg"
        },
        "stats": {
          "completedLessons": 20,
          "totalLessons": 20,
          "completionRate": 100.0,
          "startedAt": "2024-01-10T10:00:00Z",
          "lastActivity": "2024-01-12T15:30:00Z",
          "documentCompletedAt": "2024-01-12T15:30:00Z",
          "isCompleted": true
        }
      }
    ],
    "totalUsers": 150
  }
}
```

---

## Additional Endpoints

### Get Featured Documents
**GET** `/featured`

**Query Parameters:**
- `limit` (integer, default: 6): Number of featured documents

### Get Topics
**GET** `/topics`

Retrieves all available topics.

### Get Document Categories
**GET** `/categories`

Retrieves all document categories.

### Get Document Details
**GET** `/:id/details`

Retrieves comprehensive document information including modules, lessons, categories, and animations.

### Get Document Modules (Alternative endpoint)
**GET** `/:id/modules`

Same as document modules endpoint.

### Get Document Lessons (Alternative endpoint)
**GET** `/:id/lessons`

Same as document lessons endpoint.

### Get Document Animations
**GET** `/:id/animations`

Retrieves animations associated with a document.

### Get Lesson Animations
**GET** `/lessons/:lessonId/animations`

Retrieves animations for a specific lesson.

### Get Documents by Topic
**GET** `/topic/:topic_id`

Retrieves documents filtered by topic.

---

## Error Responses

All endpoints return consistent error responses:

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
- `200 OK`: Successful GET requests
- `201 Created`: Successful POST requests
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server errors

---

## Rate Limiting
API endpoints may be rate-limited. Check response headers for rate limit information:
- `X-RateLimit-Limit`: Maximum requests per time window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

---

## Data Validation

### Document Validation
- `title`: Required, 1-255 characters
- `description`: Optional, max 5000 characters
- `content`: Optional, max 100000 characters
- `topic_id`: Required, valid topic ID
- `level`: Optional, one of: Beginner, Intermediate, Advanced
- `duration`: Optional, positive integer (minutes)
- `thumbnail_url`: Optional, max 1000 characters

### Module Validation
- `title`: Required, 1-255 characters
- `position`: Optional, positive integer

### Lesson Validation
- `title`: Required, 1-255 characters
- `content`: Optional, max 100000 characters
- `code_example`: Optional, max 50000 characters
- `position`: Optional, positive integer

---

This documentation covers all the comprehensive document APIs built for managing documents, modules, lessons, progress tracking, and analytics. The APIs provide full CRUD operations with proper authentication, authorization, validation, and error handling.