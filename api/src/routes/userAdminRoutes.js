const express = require('express');
const userAdminController = require('../controllers/userAdminController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken);

// Apply admin role requirement to all routes
router.use(requireRole(['admin']));

/**
 * User CRUD Operations (Admin Only)
 */

// POST /api/admin/users - Create a new user
router.post('/', userAdminController.createUser);

// GET /api/admin/users - Get all users with admin filters
router.get('/', userAdminController.getAllUsersForAdmin);

// GET /api/admin/users/statistics - Get user statistics
router.get('/statistics', userAdminController.getUserStatistics);

// GET /api/admin/users/export - Export users data
router.get('/export', userAdminController.exportUsers);

// GET /api/admin/users/:id - Get single user by ID (admin view)
router.get('/:id', userAdminController.getUserByIdForAdmin);

// GET /api/admin/users/:id/deletion-info - Get user deletion info
router.get('/:id/deletion-info', userAdminController.getUserDeletionInfo);

// PUT /api/admin/users/:id - Update a user
router.put('/:id', userAdminController.updateUser);

// DELETE /api/admin/users/:id - Delete a user
router.delete('/:id', userAdminController.deleteUser);

/**
 * User Management Operations (Admin Only)
 */

// PATCH /api/admin/users/:id/role - Update user role
router.patch('/:id/role', userAdminController.updateUserRole);

// PATCH /api/admin/users/:id/status - Activate/Deactivate user
router.patch('/:id/status', userAdminController.toggleUserStatus);

// GET /api/admin/users/:id/activity - Get user activity log
router.get('/:id/activity', userAdminController.getUserActivityLog);

/**
 * Bulk Operations (Admin Only)
 */

// PATCH /api/admin/users/bulk/update - Bulk update users
router.patch('/bulk/update', userAdminController.bulkUpdateUsers);

module.exports = router;