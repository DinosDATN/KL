const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getUserConversations,
  getOrCreateConversation,
  getConversationMessages,
  sendPrivateMessage,
  markMessagesAsRead,
  editMessage,
  deleteMessage,
  getUnreadCount,
  toggleConversationArchive
} = require('../controllers/privateChatController');

// All private chat routes require authentication
router.use(authenticateToken);

// Conversation management routes
router.get('/conversations', getUserConversations);
router.get('/conversations/with/:otherUserId', getOrCreateConversation);
router.post('/conversations/with/:otherUserId', getOrCreateConversation);
router.put('/conversations/:conversationId/archive', toggleConversationArchive);

// Message management routes
router.get('/conversations/:conversationId/messages', getConversationMessages);
router.post('/conversations/:conversationId/messages', sendPrivateMessage);
router.put('/conversations/:conversationId/messages/read', markMessagesAsRead);

// Individual message operations
router.put('/messages/:messageId/edit', editMessage);
router.delete('/messages/:messageId', deleteMessage);

// Utility routes
router.get('/unread-count', getUnreadCount);

module.exports = router;
