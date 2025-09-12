# Frontend-Backend Integration Guide

## Overview
This guide explains how to connect the Angular frontend with the Node.js backend API for the L-FYS platform homepage.

## What Has Been Implemented

### ✅ Backend API (Already Complete)
- **Location**: `/api/` directory
- **Endpoints Available**:
  - `GET /api/v1/homepage/overview` - Platform statistics
  - `GET /api/v1/homepage/courses/featured` - Featured courses
  - `GET /api/v1/homepage/documents/featured` - Featured documents  
  - `GET /api/v1/homepage/problems/featured` - Featured problems
  - `GET /api/v1/homepage/leaderboard?limit=5` - Top users
  - `GET /api/v1/homepage/testimonials` - User testimonials
  - `GET /api/v1/homepage/achievements/featured` - Featured achievements

### ✅ Frontend Integration (Newly Added)
- **HTTP Service**: `src/app/core/services/homepage.service.ts`
- **Environment Config**: `src/environments/environment.ts` & `environment.prod.ts`
- **Updated Component**: `src/app/features/homepage/homepage.component.ts`
- **Enhanced Template**: Loading states, error handling, retry functionality

## Setup Instructions

### 1. Start the Backend API Server

```bash
# Navigate to API directory
cd api

# Install dependencies (if not already done)
npm install

# Start MySQL database with Docker
npm run docker:up

# Start the development server
npm run dev
```

The API will be available at: `http://localhost:3000/api/v1`

### 2. Start the Frontend Application

```bash
# Navigate to frontend directory  
cd cli

# Install dependencies (if not already done)
npm install

# Start the development server
ng serve
```

The frontend will be available at: `http://localhost:4200`

### 3. Verify the Integration

1. **Open your browser** and navigate to `http://localhost:4200`
2. **Check the homepage** - you should see:
   - Loading spinners initially
   - Real data from the backend API
   - Error messages if backend is not running
   - Retry buttons for failed requests

3. **Open browser developer tools** to monitor:
   - Network requests to `http://localhost:3000/api/v1/*`
   - Console logs showing successful data loading
   - Any error messages if connections fail

## Environment Configuration

### Development Environment
- **API URL**: `http://localhost:3000/api/v1`
- **Timeout**: 10 seconds
- **Logging**: Enabled

### Production Environment  
- **API URL**: Update `src/environments/environment.prod.ts` with your production API URL
- **Timeout**: 15 seconds
- **Logging**: Disabled

## Features Implemented

### 🔄 Loading States
- Spinners for each section while data loads
- Individual loading states for different content types

### ❌ Error Handling
- User-friendly error messages
- Automatic retry functionality
- Network timeout handling
- Server error detection

### 🔁 Retry Mechanism
- Automatic retry (2 attempts) for failed requests
- Manual retry button for persistent failures
- Smart retry only for failed sections

### 📱 Responsive Design
- Loading states match existing design system
- Error messages are mobile-friendly
- Maintains original homepage aesthetics

## API Response Format

All backend endpoints return data in this format:
```json
{
  "success": true,
  "data": {
    // Actual response data
  }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Troubleshooting

### Frontend shows loading forever
- ✅ Check if backend server is running on port 3000
- ✅ Verify MySQL database is running (`npm run docker:up`)
- ✅ Check browser developer tools for CORS errors

### "Connection refused" errors
- ✅ Ensure backend API server is started with `npm run dev`
- ✅ Check if port 3000 is available
- ✅ Verify environment.ts has correct API URL

### Data not displaying correctly
- ✅ Check browser console for JavaScript errors
- ✅ Verify API response format matches expected structure
- ✅ Ensure all required model properties are available

## Next Steps

### Optional Enhancements
1. **Add HTTP Interceptors** for global error handling and loading states
2. **Implement Caching** to reduce API calls and improve performance
3. **Add Offline Support** with service workers
4. **Implement Real-time Updates** with WebSockets

### Production Deployment
1. **Update Production Environment** with real API URL
2. **Configure CORS** on backend for production domain
3. **Set up SSL/HTTPS** for secure API communication
4. **Implement API Rate Limiting** for production usage

## File Changes Summary

### New Files Added
- `src/environments/environment.ts` - Development configuration
- `src/environments/environment.prod.ts` - Production configuration  
- `src/app/core/services/homepage.service.ts` - HTTP service for API calls

### Modified Files
- `angular.json` - Added environment file replacements
- `src/app/app.config.ts` - Added HttpClient provider
- `src/app/features/homepage/homepage.component.ts` - Replaced mock service with HTTP service
- `src/app/features/homepage/homepage.component.html` - Added loading/error states

## Success Indicators

When the integration is working correctly, you should see:
- ✅ Homepage loads with real backend data
- ✅ Loading spinners appear briefly during data fetch  
- ✅ All sections populate with actual database content
- ✅ Network tab shows successful API calls
- ✅ Error handling works when backend is stopped

The integration is now complete and ready for development and testing!
