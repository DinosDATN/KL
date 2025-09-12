const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', authController.register);     // POST /api/v1/auth/register
router.post('/login', authController.login);           // POST /api/v1/auth/login

// Protected routes (require authentication)
router.get('/profile', authenticateToken, authController.getProfile);   // GET /api/v1/auth/profile
router.post('/logout', authenticateToken, authController.logout);       // POST /api/v1/auth/logout

module.exports = router;
