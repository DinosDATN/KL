const express = require('express');
const dashboardAdminController = require('../controllers/dashboardAdminController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken);

// Apply admin role requirement to all routes
router.use(requireRole(['admin']));

/**
 * Dashboard Statistics (Admin Only)
 */

// GET /api/admin/dashboard/stats - Get comprehensive dashboard statistics
router.get('/stats', dashboardAdminController.getDashboardStats);

// GET /api/admin/dashboard/analytics - Get platform analytics
router.get('/analytics', dashboardAdminController.getPlatformAnalytics);

module.exports = router;