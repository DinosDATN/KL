const express = require('express');
const courseAdminController = require('../controllers/courseAdminController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const {
  validateCourseCreation,
  validateCourseUpdate,
  validateCourseId,
  validateStatusUpdate,
  validateBulkUpdate,
  validateBulkDelete,
  validateBulkRestore,
  validateExport
} = require('../middleware/courseAdminValidation');

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken);

// Apply admin role requirement to all routes
router.use(requireRole(['admin']));

/**
 * Course CRUD Operations (Admin Only)
 */

// POST /api/admin/courses - Create a new course
router.post('/', validateCourseCreation, courseAdminController.createCourse);

// GET /api/admin/courses - Get all courses with admin filters
router.get('/', courseAdminController.getAllCoursesForAdmin);

// GET /api/admin/courses/statistics - Get course statistics
router.get('/statistics', courseAdminController.getCourseStatistics);

// GET /api/admin/courses/deleted - Get soft-deleted courses
router.get('/deleted', courseAdminController.getDeletedCourses);

// GET /api/admin/courses/export - Export courses data
router.get('/export', validateExport, courseAdminController.exportCourses);

/**
 * Bulk Operations (Admin Only)
 * IMPORTANT: These routes must be defined BEFORE routes with :id parameter
 * to avoid route matching conflicts (e.g., /bulk/restore vs /:id/restore)
 */

// PATCH /api/admin/courses/bulk/update - Bulk update courses
router.patch('/bulk/update', validateBulkUpdate, courseAdminController.bulkUpdateCourses);

// POST /api/admin/courses/bulk/delete - Bulk delete courses
router.post('/bulk/delete', validateBulkDelete, courseAdminController.bulkDeleteCourses);

// POST /api/admin/courses/bulk/restore - Bulk restore courses
router.post('/bulk/restore', validateBulkRestore, courseAdminController.bulkRestoreCourses);

/**
 * Course CRUD Operations with ID (Admin Only)
 * These routes must be defined AFTER specific routes like /bulk/*
 */

// GET /api/admin/courses/:id - Get single course by ID (admin view)
router.get('/:id', validateCourseId, courseAdminController.getCourseByIdForAdmin);

// PUT /api/admin/courses/:id - Update a course
router.put('/:id', validateCourseUpdate, courseAdminController.updateCourse);

// DELETE /api/admin/courses/:id - Soft delete a course
router.delete('/:id', validateCourseId, courseAdminController.deleteCourse);

/**
 * Advanced Course Management Operations (Admin Only)
 */

// PATCH /api/admin/courses/:id/status - Update course status
router.patch('/:id/status', validateStatusUpdate, courseAdminController.updateCourseStatus);

// POST /api/admin/courses/:id/restore - Restore a soft-deleted course
router.post('/:id/restore', validateCourseId, courseAdminController.restoreCourse);

// DELETE /api/admin/courses/:id/permanent - Permanently delete a course
router.delete('/:id/permanent', validateCourseId, courseAdminController.permanentlyDeleteCourse);

module.exports = router;