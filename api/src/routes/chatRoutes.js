const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getUserChatRooms,
  getRoomMessages,
  sendMessage,
  createChatRoom,
  addReaction,
  getRoomMembers,
  searchUsers,
  getOnlineUsers,
  validateRoomMembers
} = require('../controllers/chatController');

// All chat routes require authentication
router.use(authenticateToken);

// Chat room routes
router.get('/rooms', getUserChatRooms);
router.post('/rooms', createChatRoom);

// Room-specific routes
router.get('/rooms/:roomId/messages', getRoomMessages);
router.post('/rooms/:roomId/messages', sendMessage);
router.get('/rooms/:roomId/members', getRoomMembers);

// Message reactions
router.post('/messages/:messageId/reactions', addReaction);

// User search and management routes
router.get('/users/search', searchUsers);
router.get('/users/online', getOnlineUsers);
router.post('/rooms/validate-members', validateRoomMembers);

module.exports = router;
