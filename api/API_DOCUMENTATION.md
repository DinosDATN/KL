# L-FYS Backend API Documentation

This is the backend API for the L-FYS (Learn For Yourself) platform, built with Node.js, Express, and Sequelize ORM with MySQL.

## Table of Contents
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Models](#models)
- [Error Handling](#error-handling)

## Getting Started

### Prerequisites
- Node.js (v16+)
- MySQL (v8.0+)
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
4. Update the `.env` file with your database credentials
5. Start the development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000/api/v1`

## API Endpoints

### Homepage Endpoints

#### Overview Statistics
```
GET /api/v1/homepage/overview
GET /api/v1/overview
```
Returns platform statistics including total users, courses, documents, problems, etc.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 10234,
    "totalCourses": 120,
    "totalDocuments": 85,
    "totalProblems": 340,
    "totalSubmissions": 12000,
    "totalBadges": 24,
    "totalAchievements": 18
  }
}
```

#### Featured Content
```
GET /api/v1/homepage/courses/featured
GET /api/v1/homepage/documents/featured
GET /api/v1/homepage/problems/featured
```

#### Leaderboard
```
GET /api/v1/homepage/leaderboard?limit=5
GET /api/v1/leaderboard?limit=5
```

#### Testimonials
```
GET /api/v1/homepage/testimonials
GET /api/v1/testimonials
```

#### Achievements
```
GET /api/v1/homepage/achievements/featured
```

### Course Endpoints

#### Get All Courses
```
GET /api/v1/courses?page=1&limit=10&level=Beginner&category_id=1&is_premium=false
```

Query Parameters:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `level` (optional): Course level (Beginner, Intermediate, Advanced)
- `category_id` (optional): Filter by category
- `is_premium` (optional): Filter by premium status
- `instructor_id` (optional): Filter by instructor

#### Get Course by ID
```
GET /api/v1/courses/:id
```

#### Get Featured Courses
```
GET /api/v1/courses/featured?limit=6
```

#### Get Courses by Instructor
```
GET /api/v1/courses/instructor/:instructor_id?page=1&limit=10
```

#### Get Courses by Category
```
GET /api/v1/courses/category/:category_id?page=1&limit=10
```

### Problem Endpoints

#### Get All Problems
```
GET /api/v1/problems?page=1&limit=10&difficulty=Easy&category_id=1
```

Query Parameters:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `difficulty` (optional): Problem difficulty (Easy, Medium, Hard)
- `category_id` (optional): Filter by category
- `is_premium` (optional): Filter by premium status
- `is_new` (optional): Filter new problems
- `is_popular` (optional): Filter popular problems

#### Get Problem by ID
```
GET /api/v1/problems/:id
```

#### Get Featured Problems
```
GET /api/v1/problems/featured?limit=6
```

#### Get Problems by Difficulty
```
GET /api/v1/problems/difficulty/:difficulty?page=1&limit=10
```

#### Get Popular Problems
```
GET /api/v1/problems/popular?limit=10
```

#### Get New Problems
```
GET /api/v1/problems/new?limit=10
```

#### Get Problems by Category
```
GET /api/v1/problems/category/:category_id?page=1&limit=10
```

### Document Endpoints

#### Get All Documents
```
GET /api/v1/documents?page=1&limit=10&level=Beginner&topic_id=1
```

Query Parameters:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `level` (optional): Document level (Beginner, Intermediate, Advanced)
- `topic_id` (optional): Filter by topic
- `created_by` (optional): Filter by creator

#### Get Document by ID
```
GET /api/v1/documents/:id
```

#### Get Featured Documents
```
GET /api/v1/documents/featured?limit=6
```

#### Get Documents by Topic
```
GET /api/v1/documents/topic/:topic_id?page=1&limit=10
```

## Models

### Core Models

#### User
- `id`: Primary key
- `name`: User's full name
- `email`: Unique email address
- `password`: Hashed password (nullable for OAuth users)
- `avatar_url`: Profile picture URL
- `role`: user, creator, admin
- `is_active`: Account status
- `is_online`: Online status
- `subscription_status`: free, premium
- `subscription_end_date`: Premium subscription end date

#### Course
- `id`: Primary key
- `instructor_id`: Foreign key to users table
- `title`: Course title
- `description`: Course description
- `level`: Beginner, Intermediate, Advanced
- `rating`: Average rating (0-5)
- `students`: Number of enrolled students
- `duration`: Course duration in minutes
- `is_premium`: Premium course flag
- `status`: published, draft, archived

#### Problem
- `id`: Primary key
- `title`: Problem title
- `description`: Problem description
- `difficulty`: Easy, Medium, Hard
- `acceptance`: Acceptance rate percentage
- `likes/dislikes`: User feedback
- `is_popular`: Popular problem flag
- `is_new`: New problem flag
- `is_premium`: Premium problem flag

#### Document
- `id`: Primary key
- `title`: Document title
- `description`: Document description
- `content`: Document content (Markdown/HTML)
- `level`: Beginner, Intermediate, Advanced
- `rating`: Average rating (0-5)
- `students`: Number of readers
- `duration`: Estimated reading time

#### UserStats
- `user_id`: Foreign key to users table
- `xp`: Experience points
- `level`: User level
- `rank`: Global ranking
- `courses_completed`: Number of completed courses
- `problems_solved`: Number of solved problems
- `current_streak`: Current learning streak
- `longest_streak`: Longest learning streak

## Error Handling

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {...}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

### Pagination Response
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

## Database Setup

The API uses the MySQL database schema defined in `Lfys_main.sql`. Make sure to:

1. Create the database: `CREATE DATABASE lfysdb;`
2. Import the schema: `mysql -u username -p lfysdb < Lfys_main.sql`
3. Update the `.env` file with your database credentials

## Development

### Running the API
```bash
# Development with hot reload
npm run dev

# Production
npm start
```

### Testing
```bash
npm test
```

### Database Migrations
```bash
# Run migrations
npm run db:migrate

# Undo last migration
npm run db:migrate:undo

# Seed data
npm run db:seed
```

## Features Implemented

✅ **Models**: User, Course, Problem, Document, UserStats, Achievement, Testimonial
✅ **Controllers**: Homepage, Course, Problem, Document controllers
✅ **Routes**: RESTful API endpoints with filtering and pagination
✅ **Database**: Sequelize ORM with MySQL integration
✅ **Error Handling**: Consistent error responses
✅ **Environment Configuration**: Development and production configs
✅ **Homepage API**: All endpoints needed for the frontend homepage

## API Compatibility

This API is designed to be fully compatible with the Angular frontend located at:
`E:\A_ProjectKLTN\Project\main\cli\src\app\features\homepage`

The API provides all the data structures and endpoints that the frontend `HomepageMockDataService` expects.
