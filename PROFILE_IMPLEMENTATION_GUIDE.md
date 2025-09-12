# Profile System Implementation Guide

This document outlines the implementation of the enhanced profile system with full CRUD capabilities, avatar upload, and comprehensive user settings management.

## Overview

The profile system has been completely refactored to provide:

1. **Backend API Endpoints** - Full CRUD operations for user profiles
2. **Frontend Service Layer** - ProfileService for API integration
3. **Enhanced UI Components** - Editable profile forms with validation
4. **Avatar Upload** - File upload with image validation
5. **Settings Management** - Theme, privacy, and notification settings
6. **Password Management** - Secure password change functionality

## Backend Implementation

### New API Endpoints

The following endpoints have been added to `/api/v1/users/profile/`:

- `GET /me` - Get current user's complete profile data
- `PUT /basic` - Update basic user information (name, email)
- `PUT /details` - Update extended profile details (bio, birthday, etc.)
- `PUT /settings` - Update user preferences and privacy settings
- `POST /avatar` - Upload user avatar image
- `PUT /password` - Change user password

### Database Models

The system uses existing models:
- `User` - Basic user authentication data
- `UserProfile` - Extended profile information and settings
- `UserStats` - User learning statistics (if available)

### Key Features

1. **Data Validation** - Comprehensive server-side validation
2. **File Upload** - Secure avatar upload with image validation
3. **Error Handling** - Detailed error responses with field-specific messages
4. **Security** - Input sanitization and authentication checks

### Dependencies Added

```json
{
  "multer": "^1.4.5-lts.1"
}
```

## Frontend Implementation

### New Service

- `ProfileService` - Handles all profile-related API calls
- Reactive data management with BehaviorSubject
- Comprehensive validation helpers
- Avatar URL handling with fallbacks

### Enhanced Component

The profile component now includes:

1. **Editable Forms** - Reactive forms for all profile sections
2. **Avatar Upload** - Click-to-upload with preview
3. **Real-time Validation** - Client-side and server-side validation
4. **Loading States** - Visual feedback during API calls
5. **Error Handling** - User-friendly error messages
6. **Success Feedback** - Confirmation messages

### Form Sections

1. **Basic Information** - Name and email
2. **Profile Details** - Bio, birthday, contact info, social links
3. **Settings** - Language, theme, privacy preferences
4. **Password Change** - Secure password update

## Installation Steps

### Backend Setup

1. **Install Dependencies**:
   ```bash
   cd api
   npm install multer
   ```

2. **Create Upload Directory**:
   ```bash
   mkdir -p uploads/avatars
   ```

3. **Database Migration** (if needed):
   The UserProfile and UserStats tables should already exist. If not, ensure they are created with the proper schema.

4. **Environment Variables**:
   Ensure your `.env` file has proper JWT configuration:
   ```env
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRES_IN=7d
   ```

### Frontend Setup

No additional dependencies are required. The implementation uses:
- Angular Reactive Forms (already included)
- HttpClient (already included)
- RxJS (already included)

## Usage

### For Users

1. **Profile Viewing**: Users can view their complete profile information
2. **Profile Editing**: Click "Edit" buttons to modify different sections
3. **Avatar Upload**: Click on the avatar to upload a new image
4. **Settings Management**: Customize privacy, theme, and notification preferences
5. **Password Security**: Change password with current password verification

### For Developers

1. **API Integration**: The ProfileService provides a clean interface for all profile operations
2. **Form Validation**: Built-in client and server-side validation
3. **Error Handling**: Comprehensive error management with user-friendly messages
4. **Reactive Updates**: Profile changes are automatically reflected in the UI

## Security Features

1. **Authentication Required** - All profile endpoints require valid JWT tokens
2. **Input Validation** - Server-side validation for all user inputs
3. **File Upload Security** - Image type and size validation
4. **Password Security** - Current password verification before changes
5. **Privacy Controls** - Granular visibility settings for profile sections

## API Response Format

All API responses follow this consistent format:

```json
{
  "success": boolean,
  "message": string,
  "data": object (optional),
  "errors": object (optional, for validation errors)
}
```

## File Upload Specifications

- **Supported Formats**: JPEG, PNG, GIF, WebP
- **Size Limit**: 5MB
- **Storage**: Local filesystem (`/uploads/avatars/`)
- **Naming**: `avatar-{userId}-{timestamp}-{random}.ext`

## Error Handling

The system provides comprehensive error handling:

1. **Validation Errors** - Field-specific error messages
2. **Authentication Errors** - Token validation and expiration
3. **File Upload Errors** - Type and size validation
4. **Network Errors** - Connection and timeout handling
5. **Server Errors** - Graceful error responses

## Testing

### Manual Testing Checklist

1. **Profile Loading** - ✅ Profile data loads correctly
2. **Basic Info Update** - ✅ Name and email updates work
3. **Profile Details** - ✅ Bio, birthday, contact info updates
4. **Settings Update** - ✅ Theme, language, privacy settings
5. **Avatar Upload** - ✅ Image upload and preview
6. **Password Change** - ✅ Secure password update
7. **Form Validation** - ✅ Client and server validation
8. **Error Handling** - ✅ Proper error messages
9. **Loading States** - ✅ UI feedback during operations
10. **Responsive Design** - ✅ Works on mobile and desktop

### API Testing

Use tools like Postman or curl to test API endpoints:

```bash
# Get profile
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/users/profile/me

# Update basic info
curl -X PUT -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Name","email":"new@email.com"}' \
  http://localhost:3000/api/v1/users/profile/basic
```

## Performance Considerations

1. **Reactive Updates** - Only affected UI components re-render
2. **Form Validation** - Client-side validation reduces server requests
3. **File Upload** - Image compression and validation
4. **Caching** - Profile data is cached in BehaviorSubject
5. **Lazy Loading** - Profile components only load when accessed

## Future Enhancements

1. **Image Resizing** - Automatic avatar resizing on upload
2. **Cloud Storage** - AWS S3 or similar for avatar storage
3. **Profile Completion** - Gamification for profile completion
4. **Social Integration** - OAuth profile synchronization
5. **Activity Logging** - Track profile changes for audit
6. **Email Verification** - Verify email changes
7. **Two-Factor Authentication** - Enhanced security options

## Troubleshooting

### Common Issues

1. **Avatar Upload Fails**: Check file permissions on uploads directory
2. **Profile Data Not Loading**: Verify JWT token and API connectivity
3. **Form Validation Errors**: Check network requests and server logs
4. **Theme Not Changing**: Verify settings are properly saved and applied

### Debug Steps

1. Check browser console for JavaScript errors
2. Verify network requests in browser dev tools
3. Check server logs for API errors
4. Validate JWT token is not expired
5. Ensure database connections are working

## Conclusion

This enhanced profile system provides a complete user profile management solution with modern UI/UX, comprehensive validation, secure file handling, and robust error management. The implementation follows Angular and Node.js best practices while maintaining consistency with the existing codebase architecture.
