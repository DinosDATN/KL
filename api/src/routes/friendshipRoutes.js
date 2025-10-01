const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  sendFriendRequest,
  respondToFriendRequest,
  getFriends,
  getPendingRequests,
  getSentRequests,
  removeFriend,
  blockUser,
  unblockUser,
  getBlockedUsers,
  getFriendshipStatus
} = require('../controllers/friendshipController');

// All friendship routes require authentication
router.use(authenticateToken);

// Friend request routes
router.post('/requests', sendFriendRequest);
router.put('/requests/:friendshipId/respond', respondToFriendRequest);
router.get('/requests/pending', getPendingRequests);
router.get('/requests/sent', getSentRequests);

// Friends management routes
router.get('/friends', getFriends);
router.delete('/friends/:friendId', removeFriend);
router.get('/status/:userId', getFriendshipStatus);

// User blocking routes
router.post('/block/:userId', blockUser);
router.delete('/block/:userId', unblockUser);
router.get('/blocked', getBlockedUsers);

module.exports = router;
