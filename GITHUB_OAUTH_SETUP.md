# GitHub OAuth Setup Guide

This guide will help you set up GitHub OAuth authentication for the LFYS platform alongside Google OAuth.

## Prerequisites

1. A GitHub account
2. Access to GitHub Developer Settings

## Step 1: Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click on "OAuth Apps" in the left sidebar
3. Click "New OAuth App" or "Register a new application"

## Step 2: Configure OAuth App Settings

Fill in the following information:

### Application Details:
- **Application name**: `LFYS Learning Platform`
- **Homepage URL**: `http://localhost:4200` (for development)
- **Application description**: `Learning platform with coding challenges and tutorials`
- **Authorization callback URL**: `http://localhost:3000/api/v1/auth/github/callback`

### Important Notes:
- The callback URL must exactly match the one configured in your backend
- For development, use `http://localhost:3000/api/v1/auth/github/callback`
- For production, update with your actual domain

## Step 3: Get OAuth Credentials

After creating the OAuth app:

1. You'll see your **Client ID** immediately
2. Click "Generate a new client secret" to get your **Client Secret**
3. **Important**: Copy the Client Secret immediately - it won't be shown again

## Step 4: Configure Environment Variables

Add the GitHub OAuth configuration to your `.env` file in the `api` directory:

```env
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:3000/api/v1/auth/github/callback

# Frontend URL for redirects (should already exist)
CLIENT_URL=http://localhost:4200
```

## Step 5: Test the Integration

1. Start the backend server:
   ```bash
   cd api
   npm run dev
   ```

2. Start the frontend server:
   ```bash
   cd cli
   ng serve
   ```

3. Navigate to `http://localhost:4200/auth/login`
4. Click the "GitHub" button to test the OAuth flow

## Production Setup

For production deployment:

1. **Update OAuth App Settings**:
   - Homepage URL: `https://yourdomain.com`
   - Authorization callback URL: `https://yourdomain.com/api/v1/auth/github/callback`

2. **Update Environment Variables**:
   ```env
   GITHUB_CALLBACK_URL=https://yourdomain.com/api/v1/auth/github/callback
   CLIENT_URL=https://yourdomain.com
   ```

## OAuth Scopes

The GitHub OAuth integration requests the following scopes:
- `user:email` - Access to read user's email addresses
- `read:user` - Access to user profile information

These scopes are sufficient for:
- Getting the user's primary email address (even if private)
- Accessing verified email addresses via GitHub API
- Accessing basic profile information (name, avatar)
- Creating/updating user accounts

**Note**: The system can retrieve email addresses even if the user has enabled "Keep my email addresses private" in GitHub settings.

## API Endpoints

The following endpoints are available for GitHub OAuth:

- `GET /api/v1/auth/github` - Initiate GitHub OAuth flow
- `GET /api/v1/auth/github/callback` - Handle GitHub OAuth callback
- `GET /api/v1/auth/github/failure` - Handle GitHub OAuth failure

## User Experience Flow

1. **User clicks GitHub button** → Loading state shown
2. **Redirect to GitHub** → OAuth authorization screen
3. **User authorizes** → GitHub redirects back to callback
4. **Backend processes** → Creates/updates user, generates JWT
5. **Frontend callback** → Processes token, updates auth state
6. **Dashboard redirect** → User successfully logged in

## Troubleshooting

### Common Issues

#### 1. "The redirect_uri MUST match the registered callback URL"
**Solution:** 
- Check that your callback URL in GitHub OAuth app settings exactly matches
- Include the full path: `/api/v1/auth/github/callback`
- Ensure protocol (http/https) matches

#### 2. "Bad verification code"
**Solution:**
- Verify your Client ID and Client Secret are correct
- Check for extra spaces or characters in environment variables
- Regenerate Client Secret if needed

#### 3. "No email found in GitHub profile"
**Solution:**
- **Most common**: User needs to verify their email in GitHub Settings > Emails
- System will attempt to retrieve email via GitHub API even if it's private
- User must have at least one verified email address in their GitHub account
- See `GITHUB_OAUTH_EMAIL_TROUBLESHOOTING.md` for detailed troubleshooting steps

#### 4. OAuth app not found
**Solution:**
- Ensure the OAuth app is active in GitHub settings
- Check that Client ID is correct
- Verify the app hasn't been deleted or suspended

### Debug Information

Enable debug logging by setting:
```env
NODE_ENV=development
```

Check backend logs for:
```
GitHub OAuth Profile: { id, username, email, name }
Existing user found: user@email.com
New user created from GitHub OAuth: user@email.com
GitHub OAuth successful, redirecting to: ...
```

## Security Considerations

1. **Client Secret Security**:
   - Never commit the Client Secret to version control
   - Use different OAuth apps for development and production
   - Rotate Client Secret periodically in production

2. **Email Verification**:
   - GitHub OAuth users don't need separate email verification
   - GitHub handles email verification for their users
   - Users must have a verified email on GitHub

3. **Rate Limiting**:
   - GitHub has rate limits for OAuth requests
   - Monitor usage in GitHub Settings > Applications

## Comparison with Google OAuth

| Feature | GitHub OAuth | Google OAuth |
|---------|--------------|--------------|
| **Setup Complexity** | Simpler | More complex |
| **User Base** | Developers | General users |
| **Required Scopes** | `user:email` | `profile`, `email` |
| **Email Access** | May require public email | Always available |
| **Profile Data** | Username, name, avatar | Name, email, avatar |
| **Rate Limits** | GitHub API limits | Google API limits |

## Integration Benefits

### For Users:
- ✅ **Quick registration** for developers
- ✅ **Familiar OAuth flow** for GitHub users
- ✅ **Developer-friendly** login option
- ✅ **Single sign-on** with GitHub account

### For Platform:
- ✅ **Developer audience** alignment
- ✅ **Professional credibility** 
- ✅ **Reduced friction** for coding-focused users
- ✅ **Multiple OAuth options** increase conversion

## Testing Checklist

- [ ] GitHub OAuth app created and configured
- [ ] Environment variables set correctly
- [ ] Backend server starts without errors
- [ ] Frontend loads login/register pages
- [ ] GitHub button redirects to GitHub OAuth
- [ ] User can authorize the application
- [ ] Callback processes successfully
- [ ] User is logged in and redirected
- [ ] User data is stored in database
- [ ] JWT token is valid and persistent

This setup provides a complete GitHub OAuth integration that works seamlessly alongside your existing Google OAuth implementation!
