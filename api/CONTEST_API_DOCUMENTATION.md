# Contest API Documentation

This document provides complete documentation for the Contest API endpoints in the L-FYS platform.

## Base URL
```
http://localhost:3000/api/v1/contests
```

## Authentication
Most endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### 1. Get All Contests
**GET** `/contests`

Retrieve all contests with optional filtering and pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (`active`, `upcoming`, `completed`)
- `created_by` (optional): Filter by creator ID

**Authentication:** Optional (shows additional info if authenticated)

**Example Request:**
```bash
GET /api/v1/contests?page=1&limit=10&status=active
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Weekly Coding Contest #1",
      "description": "A weekly contest for all skill levels",
      "start_time": "2024-01-15T10:00:00.000Z",
      "end_time": "2024-01-15T12:00:00.000Z",
      "created_by": 1,
      "created_at": "2024-01-10T08:00:00.000Z",
      "updated_at": "2024-01-10T08:00:00.000Z",
      "Creator": {
        "id": 1,
        "name": "John Doe",
        "avatar_url": "https://example.com/avatar1.jpg"
      },
      "status": "active",
      "duration": 120,
      "time_remaining": 45,
      "problem_count": 3,
      "participant_count": 25
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 48,
    "items_per_page": 10
  }
}
```

### 2. Get Contest by ID
**GET** `/contests/:id`

Retrieve detailed information about a specific contest.

**Parameters:**
- `id`: Contest ID (required)

**Authentication:** Optional (shows registration status if authenticated)

**Example Request:**
```bash
GET /api/v1/contests/1
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Weekly Coding Contest #1",
    "description": "A weekly contest for all skill levels",
    "start_time": "2024-01-15T10:00:00.000Z",
    "end_time": "2024-01-15T12:00:00.000Z",
    "created_by": 1,
    "created_at": "2024-01-10T08:00:00.000Z",
    "updated_at": "2024-01-10T08:00:00.000Z",
    "Creator": {
      "id": 1,
      "name": "John Doe",
      "avatar_url": "https://example.com/avatar1.jpg"
    },
    "ContestProblems": [
      {
        "id": 1,
        "score": 100,
        "Problem": {
          "id": 1,
          "title": "Two Sum",
          "difficulty": "Easy",
          "estimated_time": "15 min"
        }
      }
    ],
    "status": "active",
    "duration": 120,
    "time_remaining": 45,
    "is_registered": true,
    "participant_count": 25
  }
}
```

### 3. Create Contest
**POST** `/contests`

Create a new contest. Requires admin or creator role.

**Authentication:** Required (admin or creator role)

**Request Body:**
```json
{
  "title": "Weekly Coding Contest #2",
  "description": "Another great contest",
  "start_time": "2024-01-22T10:00:00.000Z",
  "end_time": "2024-01-22T12:00:00.000Z",
  "problem_ids": [
    { "id": 1, "score": 100 },
    { "id": 2, "score": 150 },
    3
  ]
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Contest created successfully",
  "data": {
    "id": 2,
    "title": "Weekly Coding Contest #2",
    "description": "Another great contest",
    "start_time": "2024-01-22T10:00:00.000Z",
    "end_time": "2024-01-22T12:00:00.000Z",
    "created_by": 1,
    "created_at": "2024-01-15T08:00:00.000Z",
    "updated_at": "2024-01-15T08:00:00.000Z",
    "Creator": {
      "id": 1,
      "name": "John Doe",
      "avatar_url": "https://example.com/avatar1.jpg"
    },
    "ContestProblems": [
      {
        "id": 2,
        "score": 100,
        "Problem": {
          "id": 1,
          "title": "Two Sum",
          "difficulty": "Easy"
        }
      }
    ],
    "status": "upcoming",
    "duration": 120,
    "time_remaining": 10080
  }
}
```

### 4. Update Contest
**PUT** `/contests/:id`

Update contest details. Only creator or admin can update.

**Parameters:**
- `id`: Contest ID (required)

**Authentication:** Required (creator or admin)

**Request Body:**
```json
{
  "title": "Updated Contest Title",
  "description": "Updated description",
  "start_time": "2024-01-22T11:00:00.000Z",
  "end_time": "2024-01-22T13:00:00.000Z"
}
```

### 5. Delete Contest
**DELETE** `/contests/:id`

Delete a contest. Only creator or admin can delete.

**Parameters:**
- `id`: Contest ID (required)

**Authentication:** Required (creator or admin)

**Example Response:**
```json
{
  "success": true,
  "message": "Contest deleted successfully"
}
```

### 6. Register for Contest
**POST** `/contests/:id/register`

Register the authenticated user for a contest.

**Parameters:**
- `id`: Contest ID (required)

**Authentication:** Required

**Example Response:**
```json
{
  "success": true,
  "message": "Successfully registered for contest"
}
```

### 7. Unregister from Contest
**DELETE** `/contests/:id/register`

Unregister the authenticated user from a contest.

**Parameters:**
- `id`: Contest ID (required)

**Authentication:** Required

**Example Response:**
```json
{
  "success": true,
  "message": "Successfully unregistered from contest"
}
```

### 8. Get Contest Problems
**GET** `/contests/:id/problems`

Get all problems in a contest. User must be registered to view.

**Parameters:**
- `id`: Contest ID (required)

**Authentication:** Required (must be registered or admin)

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "score": 100,
      "Problem": {
        "id": 1,
        "title": "Two Sum",
        "description": "Given an array of integers...",
        "difficulty": "Easy",
        "estimated_time": "15 min"
      }
    }
  ]
}
```

### 9. Submit to Contest
**POST** `/contests/:id/problems/:problem_id/submit`

Submit a solution for a contest problem.

**Parameters:**
- `id`: Contest ID (required)
- `problem_id`: Problem ID (required)

**Authentication:** Required (must be registered)

**Request Body:**
```json
{
  "sourceCode": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // solution code\n    }\n}",
  "language": "java"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Code submitted successfully",
  "data": {
    "submission": {
      "id": 1,
      "user_id": 2,
      "contest_problem_id": 1,
      "language": "java",
      "status": "accepted",
      "score": 100,
      "submitted_at": "2024-01-15T10:30:00.000Z",
      "Code": {
        "source_code": "class Solution { ... }"
      }
    },
    "execution_result": {
      "status": "accepted",
      "executionTime": 45,
      "memoryUsed": 12.5,
      "testResults": [
        { "status": "passed", "input": "[2,7,11,15], 9", "output": "[0,1]" }
      ]
    }
  }
}
```

### 10. Get Contest Leaderboard
**GET** `/contests/:id/leaderboard`

Get the contest leaderboard with rankings.

**Parameters:**
- `id`: Contest ID (required)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Authentication:** Required

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "user_id": 2,
      "total_score": 250,
      "submission_count": 2,
      "last_submission": "2024-01-15T11:45:00.000Z",
      "rank": 1,
      "User": {
        "id": 2,
        "name": "Jane Smith",
        "avatar_url": "https://example.com/avatar2.jpg"
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "items_per_page": 50
  }
}
```

### 11. Get User Contest Submissions
**GET** `/contests/:id/submissions`

Get current user's submissions for a contest.

**Parameters:**
- `id`: Contest ID (required)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Authentication:** Required (must be registered)

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "language": "java",
      "status": "accepted",
      "score": 100,
      "submitted_at": "2024-01-15T10:30:00.000Z",
      "ContestProblem": {
        "id": 1,
        "score": 100,
        "Problem": {
          "id": 1,
          "title": "Two Sum",
          "difficulty": "Easy"
        }
      },
      "Code": {
        "source_code": "class Solution { ... }"
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_items": 1,
    "items_per_page": 20
  }
}
```

### 12. Get Contest Participants
**GET** `/contests/:id/participants`

Get list of users registered for the contest.

**Parameters:**
- `id`: Contest ID (required)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Authentication:** Required

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "contest_id": 1,
      "user_id": 2,
      "joined_at": "2024-01-14T08:00:00.000Z",
      "User": {
        "id": 2,
        "name": "Jane Smith",
        "avatar_url": "https://example.com/avatar2.jpg"
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 2,
    "total_items": 25,
    "items_per_page": 20
  }
}
```

### 13. Add Problem to Contest
**POST** `/contests/:id/problems`

Add a problem to a contest. Only creator or admin can do this.

**Parameters:**
- `id`: Contest ID (required)

**Authentication:** Required (creator or admin)

**Request Body:**
```json
{
  "problem_id": 3,
  "score": 150
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Problem added to contest successfully",
  "data": {
    "id": 3,
    "contest_id": 1,
    "score": 150,
    "Problem": {
      "id": 3,
      "title": "Valid Parentheses",
      "difficulty": "Medium",
      "estimated_time": "20 min"
    }
  }
}
```

### 14. Remove Problem from Contest
**DELETE** `/contests/:id/problems/:problem_id`

Remove a problem from a contest. Only creator or admin can do this.

**Parameters:**
- `id`: Contest ID (required)
- `problem_id`: Problem ID (required)

**Authentication:** Required (creator or admin)

**Example Response:**
```json
{
  "success": true,
  "message": "Problem removed from contest successfully"
}
```

### 15. Get Active Contests
**GET** `/contests/active`

Get all currently active contests.

**Authentication:** Not required

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Weekly Coding Contest #1",
      "start_time": "2024-01-15T10:00:00.000Z",
      "end_time": "2024-01-15T12:00:00.000Z",
      "status": "active",
      "duration": 120,
      "time_remaining": 45
    }
  ]
}
```

### 16. Get Upcoming Contests
**GET** `/contests/upcoming`

Get all upcoming contests.

**Authentication:** Not required

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "title": "Weekly Coding Contest #2",
      "start_time": "2024-01-22T10:00:00.000Z",
      "end_time": "2024-01-22T12:00:00.000Z",
      "status": "upcoming",
      "duration": 120,
      "time_remaining": 10080
    }
  ]
}
```

### 17. Get Past Contests
**GET** `/contests/past`

Get all completed contests with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Authentication:** Not required

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "title": "Previous Contest",
      "start_time": "2024-01-08T10:00:00.000Z",
      "end_time": "2024-01-08T12:00:00.000Z",
      "status": "completed",
      "duration": 120,
      "time_remaining": 0,
      "Creator": {
        "id": 1,
        "name": "John Doe",
        "avatar_url": "https://example.com/avatar1.jpg"
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_items": 28,
    "items_per_page": 10
  }
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Common HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

### Example Validation Error:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title must be between 3 and 255 characters"
    },
    {
      "field": "start_time",
      "message": "Start time must be in the future"
    }
  ]
}
```

## Contest Status Values

- `upcoming`: Contest has not started yet
- `active`: Contest is currently running
- `completed`: Contest has ended

## Submission Status Values

- `accepted`: Solution passed all test cases
- `wrong`: Solution failed some test cases
- `error`: Runtime error or compilation error

## Usage Examples

### Complete Contest Flow

1. **Create a contest:**
```bash
POST /api/v1/contests
Authorization: Bearer <admin-token>
{
  "title": "My Contest",
  "start_time": "2024-02-01T10:00:00Z",
  "end_time": "2024-02-01T12:00:00Z",
  "problem_ids": [1, 2, 3]
}
```

2. **User registers:**
```bash
POST /api/v1/contests/1/register
Authorization: Bearer <user-token>
```

3. **User views problems:**
```bash
GET /api/v1/contests/1/problems
Authorization: Bearer <user-token>
```

4. **User submits solution:**
```bash
POST /api/v1/contests/1/problems/1/submit
Authorization: Bearer <user-token>
{
  "sourceCode": "def solution()...",
  "language": "python"
}
```

5. **Check leaderboard:**
```bash
GET /api/v1/contests/1/leaderboard
Authorization: Bearer <user-token>
```

This completes the comprehensive Contest API documentation with all necessary endpoints for a fully functional contest system.
