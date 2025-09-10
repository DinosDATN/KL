# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is the Lfys educational platform - an Angular 18 application with Server-Side Rendering (SSR) support. The platform is a comprehensive learning management system featuring courses, coding problems, gamification, chat functionality, AI integration, and payment systems.

## Development Commands

### Core Angular CLI Commands
```bash
# Start development server
npm start
# or
ng serve

# Build the application
npm run build
# or
ng build

# Build with watch mode for development
npm run watch
# or
ng build --watch --configuration development

# Run unit tests
npm test
# or
ng test

# Generate new components/services/etc.
ng generate component component-name
ng generate service service-name
ng generate directive|pipe|class|guard|interface|enum|module

# Serve SSR application
npm run serve:ssr:cli
```

### Development Workflow
- Development server runs on `http://localhost:4200/`
- Build artifacts are stored in `dist/` directory
- Application supports both client-side and server-side rendering
- Uses Karma for unit testing

## High-Level Architecture

### Application Structure
- **Angular 18 Standalone Components**: Uses the new Angular standalone architecture (no NgModules)
- **SSR Ready**: Configured with Angular Universal for server-side rendering
- **Express Server**: Custom Express server (`server.ts`) for production SSR
- **TypeScript Strict Mode**: Configured with strict TypeScript settings

### Core Domain Models
The application is built around an educational platform with these primary domains:

#### User Management
- **Users**: Basic user accounts with roles (user/creator/admin)
- **User Profiles**: Extended profile information with preferences
- **User Statistics**: XP, levels, rankings, and learning metrics
- **Achievements**: Gamification system with badges and milestones
- **Goals**: User-defined learning objectives

#### Educational Content
- **Courses**: Main learning content with modules and enrollment tracking
- **Course Categories**: Hierarchical content organization
- **Documents**: Supplementary learning materials
- **Problems**: Coding challenges with test cases and submissions
- **Quizzes**: Assessment tools with questions and results

#### Interactive Features
- **Chat System**: Real-time messaging with rooms and reactions
- **Forums**: Discussion boards for community interaction
- **Comments**: User feedback on content
- **AI Integration**: AI-powered features for learning assistance

#### Platform Features
- **Payments**: Subscription and course purchase handling
- **Referral System**: User acquisition and reward programs
- **Admin Tools**: Content moderation and user management
- **Gamification**: Points, badges, leaderboards, and achievements
- **Recommendations**: Personalized content suggestions
- **Multi-language Support**: Translation system for internationalization

### Key Architectural Patterns

#### Models-First Approach
- Comprehensive TypeScript interfaces in `src/app/core/models/`
- Each domain has well-defined models with proper typing
- Models reflect the underlying database schema

#### Service-Oriented Architecture
- Services located in `src/app/core/services/`
- Currently includes mock data service for development
- Separation of concerns between presentation and business logic

#### Standalone Components
- Uses Angular 18's standalone components (no NgModules)
- Component-based architecture with clear separation
- Dependency injection through providers

## Configuration Details

### TypeScript Configuration
- **Strict Mode**: Enabled for better code quality
- **Target**: ES2022 with modern JavaScript features
- **Experimental Decorators**: Enabled for Angular features
- **Bundler Module Resolution**: For optimal build performance

### Angular Configuration
- **Server-Side Rendering**: Configured with prerendering
- **Build Optimization**: Production builds use optimization and hashing
- **Assets**: Static files served from `public/` directory
- **Styles**: Global styles in `src/styles.css`

### Build Configurations
- **Development**: No optimization, source maps enabled
- **Production**: Full optimization, bundle analysis, hashing enabled
- **Budget Limits**: 500kB warning, 1MB error for initial bundle

## Development Guidelines

### File Organization
```
src/app/
├── core/
│   ├── models/           # TypeScript interfaces for all domains
│   └── services/         # Business logic and API services
├── app.component.*       # Root application component
├── app.config.*          # Application configuration
└── app.routes.ts         # Route definitions
```

### Model Definitions
- All models follow consistent naming conventions
- Include proper TypeScript typing with optional fields
- Database-mapped interfaces with creation/update timestamps
- Enums used for constrained values (difficulty, status, etc.)

### Component Architecture
- Standalone components with explicit imports
- Component styles can be inline or external files
- Use Angular's new control flow syntax (@for, @if, etc.)

### SSR Considerations
- Server and client configurations are separated
- Express server handles both static assets and Angular SSR
- Client hydration is configured for optimal performance

## Current Status

This appears to be an early-stage project with:
- Complete data model definitions
- Basic Angular application scaffolding
- SSR infrastructure in place
- Mock data service for initial development
- Default Angular welcome page (ready for replacement)

The foundation is solid for building out the full educational platform with courses, problems, user management, and gamification features.
