# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Lfys (Learn For Yourself) is a comprehensive educational platform built with a full-stack architecture:

- **Frontend**: Angular 18 application with SSR support (`cli/`)
- **Backend**: Node.js Express API with Sequelize ORM (`api/`)  
- **Database**: MySQL 8.0 with comprehensive schema for educational content
- **Architecture**: Microservices-style separation with standalone Angular components

This is a feature-rich learning management system supporting courses, coding problems, gamification, chat functionality, AI integration, and payment systems.

## Development Commands

### Full Stack Development

```bash
# Start both API and frontend in development
cd api && npm run dev &
cd cli && npm start

# Start database services
cd api && npm run docker:up

# Stop database services  
cd api && npm run docker:down
```

### Frontend (Angular - cli/)

```bash
# Development server (http://localhost:4200)
npm start
# or
ng serve

# Build for production
npm run build

# Build with file watching
npm run watch

# Run unit tests
npm test

# Generate components/services
ng generate component component-name
ng generate service service-name

# Serve SSR application
npm run serve:ssr:cli
```

### Backend API (Node.js - api/)

```bash
# Development server with auto-reload (http://localhost:3000)
npm run dev

# Production server
npm start

# Database management
npm run docker:up        # Start MySQL + phpMyAdmin
npm run docker:down      # Stop containers
npm run docker:logs      # View logs

# Database migrations (when implemented)
npm run db:migrate
npm run db:seed
```

### Testing Individual Components

```bash
# Test specific Angular component
cd cli
ng test --include="**/component-name.component.spec.ts"

# Test API endpoints with curl
curl http://localhost:3000/health
curl http://localhost:3000/api/v1/users

# Access phpMyAdmin for database inspection
# http://localhost:8080 (mysql/api_user/api_password)
```

## Architecture Overview

### Full-Stack Structure

```
main/
├── cli/                    # Angular 18 frontend application
├── api/                    # Node.js Express backend
├── Lfys_main.sql          # Complete database schema 
├── insert_main.sql        # Sample data script
```

### Frontend Architecture (Angular 18)

#### Core Architectural Patterns

- **Standalone Components**: No NgModules, using Angular 18's standalone architecture
- **Lazy Loading**: Route-based code splitting with `loadComponent()`
- **Server-Side Rendering**: Angular Universal with Express server
- **Models-First Design**: Comprehensive TypeScript interfaces in `core/models/`

#### Domain Models Structure

The application models a comprehensive educational platform:

**User Management Domain**:
- `User`, `UserProfile`, `UserStat`, `UserGoal` - Complete user lifecycle
- `Achievement`, `UserAchievement` - Gamification system
- `UserActivityLog` - Activity tracking

**Educational Content Domain**:
- `Course`, `CourseCategory`, `CourseEnrollment` - Course management
- `Problem`, `ProblemCategory` - Coding challenges
- `Document`, `Quiz` - Learning materials and assessments
- `Chat`, `Forum` - Communication features

**Platform Features**:
- `Payment`, `Referral` - Monetization systems
- `AI`, `Recommendation` - Intelligence features
- `Translation` - Internationalization support

#### Component Architecture

```
src/app/
├── core/
│   ├── models/           # Complete domain model definitions
│   └── services/         # Business logic and mock data
├── features/             # Feature modules (lazy loaded)
│   ├── homepage/
│   ├── courses/
│   ├── problems/
│   ├── documents/
│   ├── forum/
│   └── profile/
├── shared/
│   └── layout/           # Layout components
└── app.routes.ts         # Route definitions with lazy loading
```

#### Key Technologies Integration

- **Ace Editor**: Code editor for programming problems (`ace-builds` in angular.json)
- **TailwindCSS**: Utility-first CSS framework
- **RxJS**: Reactive programming for data streams
- **TypeScript Strict Mode**: Enhanced type safety

### Backend Architecture (Node.js)

#### API Structure

```
api/src/
├── app.js              # Main Express application
├── config/             # Database and environment config
├── controllers/        # Request handlers
├── models/             # Sequelize models
├── routes/             # API route definitions
├── middleware/         # Custom middleware (future)
└── services/           # Business logic services (future)
```

#### Database Integration

- **Sequelize ORM**: Promise-based MySQL ORM
- **Docker Compose**: MySQL + phpMyAdmin development environment
- **Database Schema**: Comprehensive educational platform schema in `Lfys_main.sql`
- **Environment Configuration**: `.env` based configuration

#### Current API Features

- RESTful endpoints with consistent response format
- Error handling middleware
- CORS enabled for frontend integration
- Request logging
- Health check endpoint
- User CRUD operations with filtering and pagination

### Database Schema Architecture

The MySQL schema supports a complex educational platform:

#### Core Entity Relationships

1. **Users** → **UserProfiles**, **UserStats**, **UserGoals**
2. **Courses** → **CourseModules** → **CourseLessons**
3. **Problems** → **TestCases**, **Submissions**, **StarterCodes**
4. **Documents** → **DocumentModules** → **DocumentLessons**
5. **Gamification**: **Achievements** ↔ **UserAchievements**

#### Advanced Features Schema

- **Chat System**: Real-time messaging with rooms and reactions
- **Forum System**: Discussion boards with posts and replies
- **Payment System**: Subscription and course purchase tracking
- **AI Integration**: AI-powered features and recommendations
- **Multi-language Support**: Translation system for internationalization

### Development Workflow Considerations

#### Frontend Development

- Development server runs on `http://localhost:4200/`
- SSR server runs on `http://localhost:4000/` (production)
- Hot reloading enabled for rapid development
- Mock services provide data during API development

#### Backend Development

- API server runs on `http://localhost:3000/`
- Database auto-sync in development mode
- phpMyAdmin available at `http://localhost:8080/`
- Graceful shutdown handling implemented

#### Full-Stack Integration

- CORS configured for frontend-backend communication
- API prefix `/api/v1/` for versioned endpoints
- Environment-based configuration for different deployment stages
- Database migrations ready for schema evolution

### Code Editor Integration

The platform includes a sophisticated code editor setup:

- **Ace Editor** integration for coding problems
- Multiple language support: JavaScript, Python, Java, C++, C#
- Theme support: GitHub, Monokai
- Language tools and autocompletion enabled

This setup supports the coding problem-solving features essential to the educational platform.

## Current Development Status

The project represents a well-architected foundation for a comprehensive educational platform:

- ✅ Complete domain modeling and database schema
- ✅ Angular 18 application with SSR infrastructure  
- ✅ Express API with Sequelize ORM integration
- ✅ Docker-based development environment
- ✅ Code editor integration for programming features
- 🔄 Frontend features implementation in progress
- 🔄 API endpoints expansion needed
- 🔄 Frontend-backend integration pending

The architecture supports rapid development of educational features with proper separation of concerns and scalable patterns.
