const express = require('express');
const adminLessonController = require('../controllers/adminLessonController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken);

// Apply admin role requirement to all routes
router.use(requireRole(['admin']));

/**
 * Lesson CRUD Operations (Admin Only)
 */

// GET /api/admin/lessons/statistics - Get lesson statistics
router.get('/statistics', adminLessonController.getLessonStatistics);

// POST /api/admin/lessons/bulk/delete - Bulk delete lessons
router.post('/bulk/delete', adminLessonController.bulkDeleteLessons);

// GET /api/admin/lessons - Get all lessons with admin filters
router.get('/', adminLessonController.getAllLessonsForAdmin);

// GET /api/admin/lessons/:id - Get single lesson by ID (admin view)
router.get('/:id', adminLessonController.getLessonByIdForAdmin);

// POST /api/admin/lessons - Create a new lesson
router.post('/', adminLessonController.createLesson);

// PUT /api/admin/lessons/:id - Update a lesson
router.put('/:id', adminLessonController.updateLesson);

// DELETE /api/admin/lessons/:id - Delete a lesson
router.delete('/:id', adminLessonController.deleteLesson);

module.exports = router;

