const express = require('express');
const courseController = require('../controllers/courseController');

const router = express.Router();

// Course CRUD operations
router.get('/', courseController.getAllCourses);
router.get('/featured', courseController.getFeaturedCourses);
router.get('/categories', courseController.getCourseCategories);
router.get('/instructors', courseController.getInstructors);

// Course filtering and grouping
router.get('/instructor/:instructor_id', courseController.getCoursesByInstructor);
router.get('/category/:category_id', courseController.getCoursesByCategory);

// Course details endpoints
router.get('/:id', courseController.getCourseById);
router.get('/:id/details', courseController.getCourseDetails);
router.get('/:id/modules', courseController.getCourseModules);
router.get('/:id/lessons', courseController.getCourseLessons);
router.get('/:id/reviews', courseController.getCourseReviews);

// Lesson endpoints
router.get('/lessons/:lessonId', courseController.getLessonById);

module.exports = router;
