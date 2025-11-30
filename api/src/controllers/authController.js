const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

// Generate JWT token
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  
  return jwt.sign(
    { userId },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
};

const authController = {
  // User registration
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // Validation
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and password are required',
          errors: {
            name: !name ? 'Name is required' : null,
            email: !email ? 'Email is required' : null,
            password: !password ? 'Password is required' : null
          }
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format',
          errors: { email: 'Please provide a valid email address' }
        });
      }

      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long',
          errors: { password: 'Password must be at least 6 characters long' }
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists',
          errors: { email: 'Email address is already registered' }
        });
      }

      // Create new user
      const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        role: 'user',
        is_active: true,
        subscription_status: 'free'
      });

      // Generate token
      const token = generateToken(user.id);

      // ✅ Set HttpOnly cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days (1 month)
        path: '/'
      });

      console.log('✅ Registration successful, cookie set for user:', user.email);

      // ✅ Return user data only (no token)
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: user.toAuthJSON()
          // ❌ No token in response
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle Sequelize validation errors
      if (error.name === 'SequelizeValidationError') {
        const errors = {};
        error.errors.forEach(err => {
          errors[err.path] = err.message;
        });
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error during registration',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // User login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
          errors: {
            email: !email ? 'Email is required' : null,
            password: !password ? 'Password is required' : null
          }
        });
      }

      // Find user by email
      const user = await User.findOne({
        where: { 
          email: email.toLowerCase().trim(),
          is_active: true 
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
          errors: { credentials: 'Email or password is incorrect' }
        });
      }

      // Check if user has a password (not OAuth user)
      if (!user.password) {
        return res.status(401).json({
          success: false,
          message: 'This account uses social login. Please sign in with your social provider.',
          errors: { auth_method: 'Social login required' }
        });
      }

      // Validate password
      const isValidPassword = await user.validatePassword(password);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
          errors: { credentials: 'Email or password is incorrect' }
        });
      }

      // Update last seen
      await user.update({ 
        last_seen_at: new Date(),
        is_online: true 
      });

      // Generate token
      const token = generateToken(user.id);

      // ✅ Set HttpOnly cookie instead of returning token
      res.cookie('auth_token', token, {
        httpOnly: true,        // Cannot be accessed by JavaScript
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'lax',       // CSRF protection (changed from 'strict' for OAuth compatibility)
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days (1 month)
        path: '/'
      });

      console.log('✅ Login successful, cookie set for user:', user.email);

      // ✅ Return user data only (no token in response body)
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.toAuthJSON()
          // ❌ No token in response
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error during login',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get current user profile
  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: { user: user.toAuthJSON() }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Logout (mainly for updating online status)
  logout: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Update user's online status
      await User.update(
        { is_online: false },
        { where: { id: userId } }
      );

      // ✅ Clear HttpOnly cookie
      res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });

      console.log('✅ Logout successful, cookie cleared for user:', userId);

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('Logout error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to logout',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Google OAuth callback handler
  googleCallback: async (req, res) => {
    try {
      const user = req.user;
      
      if (!user) {
        console.error('No user found in Google OAuth callback');
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:4200'}/auth/login?error=oauth_failed`);
      }

      // Update user's online status
      await user.update({ 
        is_online: true,
        last_seen_at: new Date()
      });

      // Generate JWT token
      const token = generateToken(user.id);

      // ✅ Set HttpOnly cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days (1 month)
        path: '/',
        domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined
      });

      console.log('✅ Google OAuth successful, cookie set for user:', user.email);
      console.log('🍪 Cookie settings:', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : 'localhost'
      });

      // ✅ Redirect to frontend with success flag
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:4200';
      const redirectUrl = `${clientUrl}/auth/callback?success=true`;
      
      console.log('Google OAuth successful, redirecting to:', redirectUrl);
      res.redirect(redirectUrl);

    } catch (error) {
      console.error('Google OAuth callback error:', error);
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:4200';
      res.redirect(`${clientUrl}/auth/login?error=oauth_failed`);
    }
  },

  // Google OAuth failure handler
  googleFailure: (req, res) => {
    console.error('Google OAuth authentication failed');
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:4200';
    res.redirect(`${clientUrl}/auth/login?error=oauth_failed`);
  },

  // GitHub OAuth callback handler
  githubCallback: async (req, res) => {
    try {
      const user = req.user;
      
      if (!user) {
        console.error('No user found in GitHub OAuth callback');
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:4200'}/auth/login?error=oauth_failed`);
      }

      // Update user's online status
      await user.update({ 
        is_online: true,
        last_seen_at: new Date()
      });

      // Generate JWT token
      const token = generateToken(user.id);

      // ✅ Set HttpOnly cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days (1 month)
        path: '/',
        domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined
      });

      console.log('✅ GitHub OAuth successful, cookie set for user:', user.email);
      console.log('🍪 Cookie settings:', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : 'localhost'
      });

      // ✅ Redirect to frontend with success flag
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:4200';
      const redirectUrl = `${clientUrl}/auth/callback?success=true`;
      
      console.log('GitHub OAuth successful, redirecting to:', redirectUrl);
      res.redirect(redirectUrl);

    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:4200';
      res.redirect(`${clientUrl}/auth/login?error=oauth_failed`);
    }
  },

  // GitHub OAuth failure handler
  githubFailure: (req, res) => {
    console.error('GitHub OAuth authentication failed');
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:4200';
    res.redirect(`${clientUrl}/auth/login?error=github_oauth_failed&message=GitHub authentication failed. Please ensure your GitHub account has a verified email address.`);
  }
};

module.exports = authController;
