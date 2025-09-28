const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const passport = require('../config/passport');

const router = express.Router();

// Public routes
router.post('/register', authController.register);     // POST /api/v1/auth/register
router.post('/login', authController.login);           // POST /api/v1/auth/login

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
); // GET /api/v1/auth/google

router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: '/api/v1/auth/google/failure'
  }),
  authController.googleCallback
); // GET /api/v1/auth/google/callback

router.get('/google/failure', authController.googleFailure); // GET /api/v1/auth/google/failure

// Protected routes (require authentication)
router.get('/profile', authenticateToken, authController.getProfile);   // GET /api/v1/auth/profile
router.post('/logout', authenticateToken, authController.logout);       // POST /api/v1/auth/logout

module.exports = router;
