const express = require('express');
const userAnalyticsController = require('../controllers/userAnalyticsController');
const { requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply admin role requirement to all routes
router.use(requireRole(['admin']));

/**
 * User Analytics Routes (Admin Only)
 */

// GET /api/admin/users/analytics/overview - Get comprehensive analytics overview
router.get('/overview', userAnalyticsController.getAnalyticsOverview);

// GET /api/admin/users/analytics/engagement - Get user engagement metrics
router.get('/engagement', userAnalyticsController.getEngagementMetrics);

// GET /api/admin/users/analytics/retention - Get user retention analysis
router.get('/retention', userAnalyticsController.getRetentionAnalysis);

// GET /api/admin/users/analytics/behavior - Get user behavior insights
router.get('/behavior', userAnalyticsController.getBehaviorInsights);

// GET /api/admin/users/analytics/time-based - Get time-based analytics
router.get('/time-based', userAnalyticsController.getTimeBasedAnalytics);

module.exports = router;

