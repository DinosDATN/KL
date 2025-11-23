const express = require('express');
const notificationAdminController = require('../controllers/notificationAdminController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken);

// Apply admin role requirement to all routes
router.use(requireRole(['admin']));

/**
 * Admin Notification Management Routes
 */

// GET /api/admin/notifications - Get all notifications (with filters)
router.get('/', notificationAdminController.getAllNotifications);

// GET /api/admin/notifications/statistics - Get notification statistics
router.get('/statistics', notificationAdminController.getNotificationStatistics);

// GET /api/admin/notifications/:notificationId - Get notification by ID
router.get('/:notificationId', notificationAdminController.getNotificationById);

// POST /api/admin/notifications/send - Send notification to specific user(s)
router.post('/send', notificationAdminController.sendNotification);

// POST /api/admin/notifications/broadcast - Send broadcast notification to all users
router.post('/broadcast', notificationAdminController.sendBroadcastNotification);

// PUT /api/admin/notifications/:notificationId/status - Update notification read status
router.put('/:notificationId/status', notificationAdminController.updateNotificationStatus);

// DELETE /api/admin/notifications/:notificationId - Delete notification
router.delete('/:notificationId', notificationAdminController.deleteNotification);

// POST /api/admin/notifications/bulk-delete - Bulk delete notifications
router.post('/bulk-delete', notificationAdminController.bulkDeleteNotifications);

module.exports = router;

