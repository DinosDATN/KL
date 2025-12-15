const express = require('express');
const courseController = require('../controllers/courseController');
const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');
const { protectedPublicEndpoint } = require('../middleware/publicEndpointMiddleware');

const router = express.Router();

// Course CRUD operations - protected public endpoints
router.get('/', protectedPublicEndpoint, courseController.getAllCourses);
router.get('/featured', protectedPublicEndpoint, courseController.getFeaturedCourses);
router.get('/categories', courseController.getCourseCategories);
router.get('/instructors', courseController.getInstructors);

// Course filtering and grouping
router.get('/instructor/:instructor_id', protectedPublicEndpoint, courseController.getCoursesByInstructor);
router.get('/category/:category_id', protectedPublicEndpoint, courseController.getCoursesByCategory);

// Course details endpoints
router.get('/:id', protectedPublicEndpoint, courseController.getCourseById);
router.get('/:id/details', protectedPublicEndpoint, courseController.getCourseDetails);
router.get('/:id/reviews', protectedPublicEndpoint, courseController.getCourseReviews);

// Protected learning endpoints - require enrollment
router.get('/:id/modules', authenticateToken, courseController.getCourseModules);
router.get('/:id/lessons', authenticateToken, courseController.getCourseLessons);
router.get('/lessons/:lessonId', authenticateToken, courseController.getLessonById);

module.exports = router;
