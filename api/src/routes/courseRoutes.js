const express = require('express');
const courseController = require('../controllers/courseController');
const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Course CRUD operations
router.get('/', courseController.getAllCourses);
router.get('/featured', courseController.getFeaturedCourses);
router.get('/categories', courseController.getCourseCategories);
router.get('/instructors', courseController.getInstructors);

// Course filtering and grouping
router.get('/instructor/:instructor_id', courseController.getCoursesByInstructor);
router.get('/category/:category_id', courseController.getCoursesByCategory);

// Course details endpoints (public)
router.get('/:id', courseController.getCourseById);
router.get('/:id/details', optionalAuth, courseController.getCourseDetails);
router.get('/:id/reviews', courseController.getCourseReviews);

// Protected learning endpoints - require enrollment
router.get('/:id/modules', authenticateToken, courseController.getCourseModules);
router.get('/:id/lessons', authenticateToken, courseController.getCourseLessons);
router.get('/lessons/:lessonId', authenticateToken, courseController.getLessonById);

module.exports = router;
