const express = require('express');
const courseController = require('../controllers/courseController');

const router = express.Router();

// Course CRUD operations
router.get('/', courseController.getAllCourses);
router.get('/featured', courseController.getFeaturedCourses);
router.get('/:id', courseController.getCourseById);

// Course filtering and grouping
router.get('/instructor/:instructor_id', courseController.getCoursesByInstructor);
router.get('/category/:category_id', courseController.getCoursesByCategory);

module.exports = router;
