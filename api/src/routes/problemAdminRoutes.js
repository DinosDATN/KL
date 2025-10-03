const express = require('express');
const problemAdminController = require('../controllers/problemAdminController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken);

// Apply admin role requirement to all routes except basic CRUD operations (which check permissions internally)
router.use(requireRole(['admin', 'creator']));

/**
 * Problem CRUD Operations (Admin/Creator)
 */

// POST /api/admin/problems - Create a new problem
router.post('/', problemAdminController.createProblem);

// GET /api/admin/problems - Get all problems with admin filters
router.get('/', problemAdminController.getAllProblemsForAdmin);

// GET /api/admin/problems/statistics - Get problem statistics
router.get('/statistics', requireRole(['admin']), problemAdminController.getProblemStatistics);

// GET /api/admin/problems/:id - Get single problem by ID (admin view)
router.get('/:id', problemAdminController.getProblemByIdForAdmin);

// PUT /api/admin/problems/:id - Update a problem
router.put('/:id', problemAdminController.updateProblem);

// DELETE /api/admin/problems/:id - Soft delete a problem
router.delete('/:id', problemAdminController.deleteProblem);

/**
 * Advanced Problem Management Operations (Admin Only)
 */

// POST /api/admin/problems/:id/restore - Restore a soft-deleted problem
router.post('/:id/restore', requireRole(['admin']), problemAdminController.restoreProblem);

// DELETE /api/admin/problems/:id/permanent - Permanently delete a problem
router.delete('/:id/permanent', requireRole(['admin']), problemAdminController.permanentlyDeleteProblem);

/**
 * Bulk Operations (Admin Only)
 */

// PATCH /api/admin/problems/bulk/update - Bulk update problems
router.patch('/bulk/update', requireRole(['admin']), problemAdminController.bulkUpdateProblems);

/**
 * Problem Category Management (Admin Only)
 */

// POST /api/admin/problems/categories - Create a new problem category
router.post('/categories', requireRole(['admin']), problemAdminController.createProblemCategory);

// PUT /api/admin/problems/categories/:id - Update a problem category
router.put('/categories/:id', requireRole(['admin']), problemAdminController.updateProblemCategory);

// DELETE /api/admin/problems/categories/:id - Delete a problem category
router.delete('/categories/:id', requireRole(['admin']), problemAdminController.deleteProblemCategory);

/**
 * Tag Management (Admin Only)
 */

// POST /api/admin/problems/tags - Create a new tag
router.post('/tags', requireRole(['admin']), problemAdminController.createTag);

// PUT /api/admin/problems/tags/:id - Update a tag
router.put('/tags/:id', requireRole(['admin']), problemAdminController.updateTag);

// DELETE /api/admin/problems/tags/:id - Delete a tag
router.delete('/tags/:id', requireRole(['admin']), problemAdminController.deleteTag);

module.exports = router;