const express = require('express');
const homepageController = require('../controllers/homepageController');

const router = express.Router();

// Homepage overview statistics
router.get('/overview', homepageController.getOverview);

// Featured content endpoints
router.get('/courses/featured', homepageController.getFeaturedCourses);
router.get('/documents/featured', homepageController.getFeaturedDocuments);
router.get('/problems/featured', homepageController.getFeaturedProblems);

// Leaderboard
router.get('/leaderboard', homepageController.getLeaderboard);

// Achievements
router.get('/achievements/featured', homepageController.getFeaturedAchievements);

// Testimonials
router.get('/testimonials', homepageController.getTestimonials);

module.exports = router;
