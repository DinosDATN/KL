# OAuth Integration Testing Guide

This document provides comprehensive testing instructions for both Google and GitHub OAuth integrations in the LFYS platform.

## Prerequisites

Before testing, ensure you have:

1. **OAuth Credentials**: Client IDs and Client Secrets from both Google Cloud Console and GitHub Developer Settings
2. **Environment Variables**: Properly configured `.env` file in the `api` directory
3. **Dependencies**: All npm packages installed in both `api` and `cli` directories

## Environment Setup

### Backend Environment (.env file in api directory)

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_actual_google_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_actual_github_client_id_here
GITHUB_CLIENT_SECRET=your_actual_github_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:3000/api/v1/auth/github/callback

# Frontend URL for redirects
CLIENT_URL=http://localhost:4200

# Other required variables
JWT_SECRET=your_jwt_secret_here
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=3306
```

## OAuth Provider Configuration

### Google Cloud Console Setup
- **Authorized JavaScript Origins**: `http://localhost:4200`, `http://localhost:3000`
- **Authorized Redirect URIs**: `http://localhost:3000/api/v1/auth/google/callback`

### GitHub Developer Settings
- **Homepage URL**: `http://localhost:4200`
- **Authorization Callback URL**: `http://localhost:3000/api/v1/auth/github/callback`

## Testing Steps

### Step 1: Start the Servers

**Backend:**
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

**Frontend:**
```bash
cd cli
ng serve
```

**Expected Output:**
```
✔ Browser application bundle generation complete.
Local:   http://localhost:4200/
```

### Step 2: Test Google OAuth Flow

#### 2.1 Navigate to Login Page
- Open browser: `http://localhost:4200/auth/login`
- Verify Google button is present and clickable

#### 2.2 Test Google Login
- Click the "Google" button
- Should redirect to Google OAuth consent screen
- URL should contain `accounts.google.com`

#### 2.3 Authorize with Google
- Log in with Google account if not already logged in
- Review and accept permissions
- Should redirect back to application

#### 2.4 Verify Callback Processing
- Should redirect to `http://localhost:4200/auth/callback`
- Loading screen should show "Đang xử lý đăng nhập..."
- Should successfully process token and user data

### Step 3: Test GitHub OAuth Flow

#### 3.1 Navigate to Login Page (if not already there)
- Refresh or go to `http://localhost:4200/auth/login`
- Verify GitHub button is present and clickable

#### 3.2 Test GitHub Login
- Click the "GitHub" button
- Should redirect to GitHub OAuth authorization screen
- URL should contain `github.com/login/oauth`

#### 3.3 Authorize with GitHub
- Log in with GitHub account if not already logged in
- Review and accept permissions
- Should redirect back to application

#### 3.4 Verify Callback Processing
- Same callback flow as Google OAuth
- Should process successfully and log user in

### Step 4: Test from Register Page

Repeat the same tests from the register page:
- Navigate to `http://localhost:4200/auth/register`
- Test both Google and GitHub buttons
- Verify same successful flow

### Step 5: Backend API Endpoint Testing

#### 5.1 Test OAuth Initiation Endpoints
```bash
# Test Google OAuth initiation
curl -i http://localhost:3000/api/v1/auth/google

# Test GitHub OAuth initiation  
curl -i http://localhost:3000/api/v1/auth/github
```
**Expected:** Redirect responses (302 status) to respective OAuth providers

#### 5.2 Verify Database Integration
After successful OAuth flows, check your database:

```sql
-- Check users created via OAuth
SELECT id, name, email, avatar_url, password, created_at, updated_at 
FROM users 
WHERE password IS NULL;
```

**Expected Results:**
- Google OAuth users with Google profile data
- GitHub OAuth users with GitHub profile data
- `password` field should be NULL for OAuth users

## Error Testing Scenarios

### Test Error Scenarios

#### 1. Invalid OAuth Credentials
**Test:** Use incorrect Client IDs in `.env`
**Expected:** "invalid_client" or similar errors from OAuth providers

#### 2. Redirect URI Mismatch
**Test:** Change callback URL in OAuth provider settings
**Expected:** "redirect_uri_mismatch" errors

#### 3. OAuth Cancellation
**Test:** Cancel OAuth flow on provider consent screen
**Expected:** Redirect to login with error message

#### 4. Network Issues
**Test:** Disconnect internet during OAuth flow
**Expected:** Graceful error handling

#### 5. Missing Email Permission
**GitHub Test:** User with private email settings
**Expected:** Error message about missing email access

## Debug Information

### Backend Logs to Monitor

**Google OAuth Success:**
```
Google OAuth Profile: { id: '123...', email: 'user@gmail.com', name: 'John Doe' }
Existing user found: user@gmail.com
Google OAuth successful, redirecting to: http://localhost:4200/auth/callback?token=...
```

**GitHub OAuth Success:**
```
GitHub OAuth Profile: { id: '456...', username: 'johndoe', email: 'user@github.com', name: 'John Doe' }
New user created from GitHub OAuth: user@github.com
GitHub OAuth successful, redirecting to: http://localhost:4200/auth/callback?token=...
```

### Frontend Console Logs

```javascript
// OAuth service logs
Redirecting to Google OAuth: http://localhost:3000/api/v1/auth/google
Redirecting to GitHub OAuth: http://localhost:3000/api/v1/auth/github

// Callback component logs
OAuth callback query params: { token: "...", user: "..." }
```

### Database Verification

**Google OAuth User:**
```sql
SELECT * FROM users WHERE email = 'user@gmail.com';
```
Expected: User with Google profile data, NULL password

**GitHub OAuth User:**
```sql
SELECT * FROM users WHERE email = 'user@github.com';
```
Expected: User with GitHub profile data, NULL password

## Performance Testing

### Load Testing OAuth Endpoints

```bash
# Test concurrent OAuth initiations
for i in {1..10}; do
  curl -s http://localhost:3000/api/v1/auth/google &
  curl -s http://localhost:3000/api/v1/auth/github &
done
```

### Response Time Expectations

- **OAuth Initiation**: < 300ms redirect
- **Callback Processing**: < 1s from redirect to dashboard
- **Database Operations**: < 200ms for user lookup/creation
- **Frontend State Update**: Immediate after callback

## Troubleshooting Guide

### Common Issues and Solutions

#### Google OAuth Issues

1. **"redirect_uri_mismatch"**
   - Check exact URL match in Google Cloud Console
   - Verify protocol and port numbers

2. **"invalid_client"**
   - Verify Client ID and Secret in `.env`
   - Check Google OAuth consent screen setup

#### GitHub OAuth Issues

1. **"Bad verification code"**
   - Regenerate Client Secret in GitHub settings
   - Verify no extra spaces in environment variables

2. **"No email found in GitHub profile"**
   - User needs to make email public in GitHub settings
   - Or use primary email scope properly

#### General OAuth Issues

1. **Callback doesn't process**
   - Check JWT secret configuration
   - Verify database connection
   - Check frontend route configuration

2. **Authentication state not updated**
   - Clear browser localStorage
   - Check Angular auth service implementation
   - Verify token format and expiration

## Automated Testing

### Backend API Tests

```javascript
// Example test cases
describe('OAuth Endpoints', () => {
  it('should redirect to Google OAuth', async () => {
    const response = await request(app).get('/api/v1/auth/google');
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('accounts.google.com');
  });

  it('should redirect to GitHub OAuth', async () => {
    const response = await request(app).get('/api/v1/auth/github');
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('github.com');
  });
});
```

### Frontend Component Tests

```javascript
describe('OAuth Integration', () => {
  it('should call OAuth service on Google button click', () => {
    // Component testing for Google OAuth
  });

  it('should call OAuth service on GitHub button click', () => {
    // Component testing for GitHub OAuth
  });

  it('should process OAuth callback correctly', () => {
    // Callback component testing
  });
});
```

## Success Criteria

### ✅ OAuth Integration is working correctly if:

**Google OAuth:**
1. ✅ Redirects to Google OAuth consent screen
2. ✅ Processes callback successfully
3. ✅ Creates/updates user with Google data
4. ✅ Generates valid JWT token
5. ✅ Updates frontend authentication state

**GitHub OAuth:**
1. ✅ Redirects to GitHub OAuth authorization screen
2. ✅ Processes callback successfully
3. ✅ Creates/updates user with GitHub data
4. ✅ Generates valid JWT token
5. ✅ Updates frontend authentication state

**General:**
1. ✅ Error handling works for all failure scenarios
2. ✅ Authentication state persists after page refresh
3. ✅ Users can log out properly
4. ✅ Database stores OAuth user data correctly

## Security Validation

### Security Checklist

- [ ] **Client Secrets**: Not exposed in frontend code
- [ ] **HTTPS**: Use secure connections in production
- [ ] **JWT Tokens**: Properly signed and validated
- [ ] **CORS**: Configured correctly for OAuth origins
- [ ] **Error Messages**: No sensitive information leaked
- [ ] **Rate Limiting**: OAuth endpoints protected from abuse
- [ ] **Session Security**: Proper token expiration and refresh

This comprehensive testing guide ensures both Google and GitHub OAuth integrations work reliably and securely!
