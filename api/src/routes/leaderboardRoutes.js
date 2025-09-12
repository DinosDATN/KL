const express = require('express');
const leaderboardController = require('../controllers/leaderboardController');

const router = express.Router();

// Main leaderboard endpoint - comprehensive data
router.get('/', leaderboardController.getLeaderboard);

// Individual data endpoints
router.get('/profiles', leaderboardController.getUserProfiles);
router.get('/stats', leaderboardController.getUserStats);
router.get('/levels', leaderboardController.getLevels);
router.get('/badges', leaderboardController.getBadges);
router.get('/user-badges', leaderboardController.getUserBadges);
router.get('/entries', leaderboardController.getLeaderboardEntries);

module.exports = router;
