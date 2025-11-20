const express = require('express');
const instructorAdminController = require('../controllers/instructorAdminController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken);

// Apply admin role requirement to all routes
router.use(requireRole(['admin']));

/**
 * Instructor CRUD Operations (Admin Only)
 */

// GET /api/v1/admin/instructors/statistics - Get instructor statistics
router.get('/statistics', instructorAdminController.getInstructorStatistics);

// GET /api/v1/admin/instructors - Get all instructors with admin filters
router.get('/', instructorAdminController.getAllInstructors);

// GET /api/v1/admin/instructors/:id - Get single instructor by ID (admin view)
router.get('/:id', instructorAdminController.getInstructorById);

// PUT /api/v1/admin/instructors/:id - Update an instructor
router.put('/:id', instructorAdminController.updateInstructor);

// PATCH /api/v1/admin/instructors/:id/status - Toggle instructor status (activate/deactivate)
router.patch('/:id/status', instructorAdminController.toggleInstructorStatus);

/**
 * Instructor Qualification Management (Admin Only)
 */

// POST /api/v1/admin/instructors/:id/qualifications - Create instructor qualification
router.post('/:id/qualifications', instructorAdminController.createQualification);

// PUT /api/v1/admin/instructors/:id/qualifications/:qualification_id - Update instructor qualification
router.put('/:id/qualifications/:qualification_id', instructorAdminController.updateQualification);

// DELETE /api/v1/admin/instructors/:id/qualifications/:qualification_id - Delete instructor qualification
router.delete('/:id/qualifications/:qualification_id', instructorAdminController.deleteQualification);

module.exports = router;


