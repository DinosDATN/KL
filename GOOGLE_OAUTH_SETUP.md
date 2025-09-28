# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the LFYS platform.

## Prerequisites

1. A Google account
2. Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google OAuth2 API

## Step 2: Configure OAuth Consent Screen

1. In the Google Cloud Console, go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - **App name**: LFYS Learning Platform
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add authorized domains if needed (e.g., `localhost` for development)
5. Add scopes: `../auth/userinfo.email` and `../auth/userinfo.profile`

## Step 3: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Set up the configuration:
   - **Name**: LFYS OAuth Client
   - **Authorized JavaScript origins**: 
     - `http://localhost:4200` (frontend)
     - `http://localhost:3000` (backend)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/v1/auth/google/callback`

## Step 4: Configure Environment Variables

1. Copy the Client ID and Client Secret from the Google Cloud Console
2. Create or update your `.env` file in the `api` directory:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# Frontend URL for redirects
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
4. Click the "Google" button to test the OAuth flow

## Production Setup

For production deployment:

1. Update the authorized origins and redirect URIs in Google Cloud Console
2. Update the environment variables with your production URLs
3. Ensure your domain is verified in Google Cloud Console

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**: 
   - Check that your redirect URI exactly matches what's configured in Google Cloud Console
   - Include the protocol (http/https) and port if needed

2. **"invalid_client" error**:
   - Verify your Client ID and Client Secret are correct
   - Check that the OAuth consent screen is properly configured

3. **Scope errors**:
   - Ensure you've added the necessary scopes in the OAuth consent screen
   - Common scopes: `email`, `profile`, `openid`

4. **CORS errors**:
   - Make sure your frontend URL is added to authorized JavaScript origins
   - Check that CORS is properly configured in your backend

### Debug Mode

To enable debug logging for OAuth:

1. Set `NODE_ENV=development` in your `.env` file
2. Check the browser console and server logs for detailed error messages

## Security Notes

1. Never commit your `.env` file to version control
2. Use different OAuth clients for development and production
3. Regularly rotate your Client Secret in production
4. Monitor OAuth usage in Google Cloud Console
5. Implement proper error handling and logging

## API Endpoints

The following endpoints are available for Google OAuth:

- `GET /api/v1/auth/google` - Initiate OAuth flow
- `GET /api/v1/auth/google/callback` - Handle OAuth callback
- `GET /api/v1/auth/google/failure` - Handle OAuth failure

## Frontend Routes

- `/auth/login` - Login page with Google OAuth button
- `/auth/callback` - OAuth callback handler (automatically processes tokens)
- `/auth/register` - Registration page (also supports social login)

## User Experience Flow

1. User clicks "Google" button on login page
2. User is redirected to Google's OAuth consent screen
3. User grants permission
4. Google redirects back to `/api/v1/auth/google/callback`
5. Backend processes the OAuth response and generates JWT token
6. User is redirected to `/auth/callback` with token and user data
7. Frontend processes the callback and logs the user in
8. User is redirected to the main dashboard

This setup provides a seamless Google OAuth integration with proper error handling and security measures.
