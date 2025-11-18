const express = require('express');
const courseEnrollmentController = require('../controllers/courseEnrollmentController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// All enrollment routes require authentication
router.use(authenticateToken);

// Enrollment management
router.post('/:courseId/enroll', courseEnrollmentController.enrollCourse);
router.get('/my-enrollments', courseEnrollmentController.getMyEnrollments);
router.get('/:courseId/check', courseEnrollmentController.checkEnrollment);
router.get('/:courseId/progress', courseEnrollmentController.getCourseProgress);

// Lesson completion
router.post('/:courseId/lessons/:lessonId/complete', courseEnrollmentController.completeLesson);

// Learning dashboard
router.get('/dashboard', courseEnrollmentController.getLearningDashboard);

module.exports = router;
