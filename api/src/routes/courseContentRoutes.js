const express = require('express');
const courseContentController = require('../controllers/courseContentController');
const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * ==================== MODULE ROUTES ====================
 */

// POST /api/v1/course-content/courses/:course_id/modules - Create a new module
router.post('/courses/:course_id/modules', authenticateToken, courseContentController.createModule);

// GET /api/v1/course-content/courses/:course_id/modules - Get all modules for a course
router.get('/courses/:course_id/modules', courseContentController.getCourseModules);

// GET /api/v1/course-content/modules/:module_id - Get a single module by ID
router.get('/modules/:module_id', courseContentController.getModuleById);

// PUT /api/v1/course-content/modules/:module_id - Update a module
router.put('/modules/:module_id', authenticateToken, courseContentController.updateModule);

// DELETE /api/v1/course-content/modules/:module_id - Delete a module
router.delete('/modules/:module_id', authenticateToken, courseContentController.deleteModule);

// POST /api/v1/course-content/courses/:course_id/modules/reorder - Reorder modules
router.post('/courses/:course_id/modules/reorder', authenticateToken, courseContentController.reorderModules);

/**
 * ==================== LESSON ROUTES ====================
 */

// POST /api/v1/course-content/modules/:module_id/lessons - Create a new lesson
router.post('/modules/:module_id/lessons', authenticateToken, courseContentController.createLesson);

// GET /api/v1/course-content/modules/:module_id/lessons - Get all lessons for a module
router.get('/modules/:module_id/lessons', courseContentController.getModuleLessons);

// GET /api/v1/course-content/courses/:course_id/lessons - Get all lessons for a course
router.get('/courses/:course_id/lessons', courseContentController.getCourseLessons);

// GET /api/v1/course-content/lessons/:lesson_id - Get a single lesson by ID
router.get('/lessons/:lesson_id', optionalAuth, courseContentController.getLessonById);

// PUT /api/v1/course-content/lessons/:lesson_id - Update a lesson
router.put('/lessons/:lesson_id', authenticateToken, courseContentController.updateLesson);

// DELETE /api/v1/course-content/lessons/:lesson_id - Delete a lesson
router.delete('/lessons/:lesson_id', authenticateToken, courseContentController.deleteLesson);

// POST /api/v1/course-content/modules/:module_id/lessons/reorder - Reorder lessons within a module
router.post('/modules/:module_id/lessons/reorder', authenticateToken, courseContentController.reorderLessons);

/**
 * ==================== ENROLLMENT ROUTES ====================
 */

// POST /api/v1/course-content/courses/:course_id/enroll - Enroll in a course
router.post('/courses/:course_id/enroll', authenticateToken, courseContentController.enrollInCourse);

// GET /api/v1/course-content/enrollments - Get user's enrolled courses
router.get('/enrollments', authenticateToken, courseContentController.getUserEnrollments);

// PATCH /api/v1/course-content/courses/:course_id/progress - Update enrollment progress
router.patch('/courses/:course_id/progress', authenticateToken, courseContentController.updateEnrollmentProgress);

// DELETE /api/v1/course-content/courses/:course_id/enroll - Unenroll from a course
router.delete('/courses/:course_id/enroll', authenticateToken, courseContentController.unenrollFromCourse);

/**
 * ==================== REVIEW ROUTES ====================
 */

// POST /api/v1/course-content/courses/:course_id/reviews - Create or update a course review
router.post('/courses/:course_id/reviews', authenticateToken, courseContentController.createOrUpdateReview);

// GET /api/v1/course-content/courses/:course_id/reviews - Get course reviews
router.get('/courses/:course_id/reviews', courseContentController.getCourseReviews);

// PATCH /api/v1/course-content/reviews/:review_id/helpful - Mark review as helpful/not helpful
router.patch('/reviews/:review_id/helpful', authenticateToken, courseContentController.markReviewHelpful);

// DELETE /api/v1/course-content/courses/:course_id/reviews - Delete user's own review
router.delete('/courses/:course_id/reviews', authenticateToken, courseContentController.deleteReview);

/**
 * ==================== ANALYTICS AND DASHBOARD ROUTES ====================
 */

// GET /api/v1/course-content/courses/:course_id/structure - Get course structure with progress
router.get('/courses/:course_id/structure', optionalAuth, courseContentController.getCourseStructureWithProgress);

// POST /api/v1/course-content/courses/:course_id/progress - Calculate course progress
router.post('/courses/:course_id/progress', authenticateToken, courseContentController.calculateCourseProgress);

// GET /api/v1/course-content/dashboard - Get user learning dashboard
router.get('/dashboard', authenticateToken, courseContentController.getLearningDashboard);

// GET /api/v1/course-content/courses/:course_id/enrollment-stats - Get enrollment statistics (instructors/admins)
router.get('/courses/:course_id/enrollment-stats', authenticateToken, courseContentController.getCourseEnrollmentStats);

// GET /api/v1/course-content/courses/:course_id/students - Get course students (instructors/admins)
router.get('/courses/:course_id/students', authenticateToken, courseContentController.getCourseStudents);

// GET /api/v1/course-content/courses/:course_id/review-analytics - Get review analytics (instructors/admins)
router.get('/courses/:course_id/review-analytics', authenticateToken, courseContentController.getCourseReviewAnalytics);

// GET /api/v1/course-content/courses/:course_id/validate - Validate course structure (instructors/admins)
router.get('/courses/:course_id/validate', authenticateToken, courseContentController.validateCourseStructure);

module.exports = router;
