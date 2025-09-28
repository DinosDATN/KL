const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');

// JWT Strategy for API authentication
passport.use('jwt', new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
  ignoreExpiration: false
}, async (payload, done) => {
  try {
    const user = await User.findByPk(payload.userId);
    if (user && user.is_active) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

// Google OAuth Strategy
passport.use('google', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/v1/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google OAuth Profile:', {
      id: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName
    });

    const email = profile.emails?.[0]?.value;
    
    if (!email) {
      return done(new Error('No email found in Google profile'), null);
    }

    // Check if user already exists
    let user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (user) {
      // Update existing user with Google info if needed
      if (!user.avatar_url && profile.photos?.[0]?.value) {
        await user.update({
          avatar_url: profile.photos[0].value,
          last_seen_at: new Date()
        });
      }
      
      console.log('Existing user found:', user.email);
      return done(null, user);
    } else {
      // Create new user from Google profile
      user = await User.create({
        name: profile.displayName || profile.name?.givenName || 'Google User',
        email: email.toLowerCase(),
        avatar_url: profile.photos?.[0]?.value || null,
        role: 'user',
        is_active: true,
        subscription_status: 'free',
        // No password for OAuth users
        password: null
      });
      
      console.log('New user created from Google OAuth:', user.email);
      return done(null, user);
    }
  } catch (error) {
    console.error('Google OAuth Strategy Error:', error);
    return done(error, null);
  }
}));

// GitHub OAuth Strategy
passport.use('github', new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL || '/api/v1/auth/github/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('GitHub OAuth Profile:', {
      id: profile.id,
      username: profile.username,
      email: profile.emails?.[0]?.value,
      name: profile.displayName || profile.username
    });

    let email = profile.emails?.[0]?.value;
    
    // If no email in profile, try to fetch it from GitHub API
    if (!email) {
      try {
        const axios = require('axios');
        const response = await axios.get('https://api.github.com/user/emails', {
          headers: {
            'Authorization': `token ${accessToken}`,
            'User-Agent': 'LFYS-Platform'
          }
        });
        
        // Find primary email or first verified email
        const emails = response.data;
        const primaryEmail = emails.find(e => e.primary && e.verified);
        const verifiedEmail = emails.find(e => e.verified);
        
        email = primaryEmail?.email || verifiedEmail?.email;
        
        console.log('GitHub emails from API:', emails.map(e => ({ email: e.email, primary: e.primary, verified: e.verified })));
      } catch (apiError) {
        console.error('Error fetching GitHub emails:', apiError.message);
      }
    }
    
    if (!email) {
      return done(new Error('No verified email found in GitHub profile. Please make sure your GitHub account has a verified email address and the email scope is granted.'), null);
    }

    // Check if user already exists
    let user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (user) {
      // Update existing user with GitHub info if needed
      if (!user.avatar_url && profile.photos?.[0]?.value) {
        await user.update({
          avatar_url: profile.photos[0].value,
          last_seen_at: new Date()
        });
      }
      
      console.log('Existing user found:', user.email);
      return done(null, user);
    } else {
      // Create new user from GitHub profile
      user = await User.create({
        name: profile.displayName || profile.username || 'GitHub User',
        email: email.toLowerCase(),
        avatar_url: profile.photos?.[0]?.value || null,
        role: 'user',
        is_active: true,
        subscription_status: 'free',
        // No password for OAuth users
        password: null
      });
      
      console.log('New user created from GitHub OAuth:', user.email);
      return done(null, user);
    }
  } catch (error) {
    console.error('GitHub OAuth Strategy Error:', error);
    return done(error, null);
  }
}));

// Serialize user for session (not used for JWT but required by Passport)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session (not used for JWT but required by Passport)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
