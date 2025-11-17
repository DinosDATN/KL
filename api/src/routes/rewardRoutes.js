const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/rewardController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public routes
router.get('/config', rewardController.getRewardConfig);

// Protected routes (require authentication)
router.get('/points', authenticateToken, rewardController.getCurrentPoints);
router.get('/history', authenticateToken, rewardController.getRewardHistory);
router.get('/stats', authenticateToken, rewardController.getRewardStats);

// Admin routes
router.put('/config', authenticateToken, rewardController.updateRewardConfig);
router.post('/manual', authenticateToken, rewardController.addManualReward);

module.exports = router;
