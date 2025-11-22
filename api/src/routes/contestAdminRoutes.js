const express = require('express');
const contestAdminController = require('../controllers/contestAdminController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken);

// Apply admin role requirement to all routes except basic CRUD operations (which check permissions internally)
router.use(requireRole(['admin', 'creator']));

/**
 * Contest CRUD Operations (Admin/Creator)
 */

// POST /api/admin/contests - Create a new contest
router.post('/', contestAdminController.createContest);

// GET /api/admin/contests - Get all contests with admin filters
router.get('/', contestAdminController.getAllContestsForAdmin);

// GET /api/admin/contests/statistics - Get contest statistics
router.get('/statistics', requireRole(['admin']), contestAdminController.getContestStatistics);

// GET /api/admin/contests/export - Export contests data
router.get('/export', requireRole(['admin']), contestAdminController.exportContests);

// GET /api/admin/contests/:id - Get single contest by ID (admin view)
router.get('/:id', contestAdminController.getContestByIdForAdmin);

// PUT /api/admin/contests/:id - Update a contest
router.put('/:id', contestAdminController.updateContest);

// DELETE /api/admin/contests/:id - Delete a contest (soft delete)
router.delete('/:id', requireRole(['admin']), contestAdminController.deleteContest);

// POST /api/admin/contests/:id/restore - Restore a soft-deleted contest
router.post('/:id/restore', requireRole(['admin']), contestAdminController.restoreContest);

// DELETE /api/admin/contests/:id/permanent - Permanently delete a contest
router.delete('/:id/permanent', requireRole(['admin']), contestAdminController.permanentlyDeleteContest);

/**
 * Contest Problem Management (Admin/Creator)
 */

// POST /api/admin/contests/:id/problems - Add problem to contest
router.post('/:id/problems', contestAdminController.addProblemToContest);

// DELETE /api/admin/contests/:id/problems/:problem_id - Remove problem from contest
router.delete('/:id/problems/:problem_id', contestAdminController.removeProblemFromContest);

/**
 * Contest Participant Management (Admin Only)
 */

// GET /api/admin/contests/:id/participants - Get contest participants
router.get('/:id/participants', requireRole(['admin']), contestAdminController.getContestParticipants);

/**
 * Bulk Operations (Admin Only)
 */

// PATCH /api/admin/contests/bulk/update - Bulk update contests
router.patch('/bulk/update', requireRole(['admin']), contestAdminController.bulkUpdateContests);

module.exports = router;