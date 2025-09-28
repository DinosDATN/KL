# Google OAuth Integration Testing Guide

This document provides step-by-step instructions for testing the Google OAuth integration in the LFYS platform.

## Prerequisites

Before testing, ensure you have:

1. **Google OAuth Credentials**: Client ID and Client Secret from Google Cloud Console
2. **Environment Variables**: Properly configured `.env` file in the `api` directory
3. **Dependencies**: All npm packages installed in both `api` and `cli` directories

## Environment Setup

### 1. Backend Environment (.env file in api directory)

```env
# Required for Google OAuth
GOOGLE_CLIENT_ID=your_actual_google_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback
CLIENT_URL=http://localhost:4200

# Other required variables
JWT_SECRET=your_jwt_secret_here
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=3306
```

### 2. Google Cloud Console Configuration

Ensure your Google OAuth client has:

**Authorized JavaScript Origins:**
- `http://localhost:4200`
- `http://localhost:3000`

**Authorized Redirect URIs:**
- `http://localhost:3000/api/v1/auth/google/callback`

## Testing Steps

### Step 1: Start the Backend Server

```bash
cd api
npm run dev
```

**Expected Output:**
```
✅ Database connection ready
🚀 Server is running on port 3000
📍 Health check: http://localhost:3000/health
📍 API base URL: http://localhost:3000/api/v1
💬 Socket.IO server is ready
```

### Step 2: Start the Frontend Server

```bash
cd cli
ng serve
```

**Expected Output:**
```
✔ Browser application bundle generation complete.
Local:   http://localhost:4200/
```

### Step 3: Test Google OAuth Flow

#### 3.1 Navigate to Login Page
- Open browser and go to `http://localhost:4200/auth/login`
- You should see the login form with a Google button

#### 3.2 Click Google Login Button
- Click the "Google" button in the social login section
- You should be redirected to Google's OAuth consent screen
- The browser URL should change to `accounts.google.com`

#### 3.3 Authorize with Google
- Log in with your Google account (if not already logged in)
- Review and accept the permissions requested
- Click "Continue" or "Allow"

#### 3.4 Verify Callback Processing
- You should be redirected to `http://localhost:4200/auth/callback`
- You should see a loading screen with "Đang xử lý đăng nhập..."
- The callback component should process the token and user data

#### 3.5 Verify Successful Login
- After processing, you should be redirected to the main dashboard (`/`)
- Check browser localStorage: you should see `auth_token` and `auth_user`
- Verify you're logged in by checking the user menu/profile area

### Step 4: Test from Register Page

#### 4.1 Navigate to Register Page
- Go to `http://localhost:4200/auth/register`
- Click the Google button there as well
- Should follow the same flow as login

### Step 5: Verify Backend API Endpoints

#### 5.1 Test OAuth Initiation
```bash
curl -i http://localhost:3000/api/v1/auth/google
```
**Expected:** Redirect to Google (302 status)

#### 5.2 Check User Creation/Update
- After successful OAuth, check your database
- New users should be created with Google profile data
- Existing users should be updated with Google info

## Error Testing

### Test Error Scenarios

#### 1. Invalid Google Credentials
- Use incorrect `GOOGLE_CLIENT_ID` in `.env`
- Should show "invalid_client" error from Google

#### 2. Redirect URI Mismatch
- Try accessing OAuth from different port/domain
- Should show "redirect_uri_mismatch" error

#### 3. Network Issues
- Disconnect internet during OAuth flow
- Should handle gracefully with appropriate error messages

#### 4. OAuth Cancellation
- Start OAuth flow but cancel on Google consent screen
- Should redirect to login with error parameter

## Debug Information

### Backend Logs to Monitor

```bash
# Check these log outputs in your backend console:
Google OAuth Profile: { id, email, name }
Existing user found: user@email.com
# OR
New user created from Google OAuth: user@email.com
Google OAuth successful, redirecting to: CLIENT_URL/auth/callback?token=...
```

### Frontend Console Logs

```javascript
// Check browser console for these logs:
OAuth callback query params: { token: "...", user: "..." }
Google OAuth Profile: { id, email, name }
```

### Database Verification

Check your `users` table:
```sql
SELECT id, name, email, avatar_url, password, created_at, updated_at 
FROM users 
WHERE email = 'your-google-email@gmail.com';
```

**Expected for Google OAuth users:**
- `name`: Google display name
- `email`: Google email address
- `avatar_url`: Google profile picture URL
- `password`: NULL (OAuth users don't have passwords)

## Troubleshooting

### Common Issues and Solutions

#### 1. "Error: No email found in Google profile"
**Solution:** Ensure your Google OAuth scope includes `email`
- Check Google Cloud Console OAuth consent screen
- Verify scopes include `../auth/userinfo.email`

#### 2. "redirect_uri_mismatch"
**Solution:** 
- Check exact URL in Google Cloud Console
- Ensure protocol (http/https) and port match exactly
- Common mistake: forgetting to include port 3000

#### 3. CORS Errors
**Solution:**
- Add your frontend URL to authorized JavaScript origins
- Check backend CORS configuration in `app.js`

#### 4. "invalid_client"
**Solution:**
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Check for extra spaces or quotes in .env file
- Ensure OAuth client is enabled in Google Cloud Console

#### 5. Token/User Data Not Found in Callback
**Solution:**
- Check backend logs for OAuth processing errors
- Verify database connection and user creation
- Check JWT token generation

### Debug Mode

Enable detailed logging:

**Backend (.env):**
```env
NODE_ENV=development
LOG_LEVEL=debug
```

**Frontend (browser console):**
- Open DevTools
- Check Network tab for API calls
- Monitor Console for error messages

## Success Criteria

### ✅ Integration is working correctly if:

1. **OAuth Flow**: Successful redirect to Google and back
2. **User Authentication**: JWT token generated and stored
3. **User Data**: Google profile info saved to database
4. **Session Management**: User remains logged in after refresh
5. **UI State**: Login/register pages show authenticated state
6. **Error Handling**: Graceful handling of OAuth failures

### 🔍 Performance Expectations

- **OAuth Initiation**: < 500ms redirect to Google
- **Callback Processing**: < 2s from Google redirect to dashboard
- **Database Operations**: < 500ms for user lookup/creation
- **Frontend State Update**: Immediate UI updates after callback

## Security Validation

### Verify Security Measures

1. **No Client Secret Exposure**: Secret only in backend `.env`
2. **HTTPS in Production**: Use secure callbacks in production
3. **Token Validation**: JWT tokens properly signed and verified
4. **User Data Validation**: Google profile data validated before storage
5. **Error Information**: No sensitive data in error messages

This comprehensive testing ensures your Google OAuth integration is working correctly and securely!
