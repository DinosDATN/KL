const express = require('express');
const router = express.Router();

// Controllers
const ChatSettingsController = require('../controllers/chatSettingsController');
const ChatController = require('../controllers/chatController');

// Middleware
const authMiddleware = require('../middleware/authMiddleware');
const ChatSettingsValidation = require('../middleware/chatSettingsValidation');

// Apply authentication to all chat routes
router.use(authMiddleware);

/**
 * Chat Settings Routes
 * All routes require authentication
 */

// Room Settings Management
router.get('/rooms/:id/settings', 
  ChatSettingsValidation.roomOperation(),
  ChatSettingsController.getRoomSettings
);

router.put('/rooms/:id/settings', 
  ChatSettingsValidation.updateRoomSettings(),
  ChatSettingsController.updateRoomSettings
);

// Room Management
router.delete('/rooms/:id', 
  ChatSettingsValidation.roomOperation(),
  ChatSettingsController.deleteRoom
);

router.post('/rooms/:id/leave', 
  ChatSettingsValidation.roomOperation(),
  ChatSettingsController.leaveRoom
);

// Member Management
router.post('/rooms/:id/members', 
  ChatSettingsValidation.addMember(),
  ChatSettingsController.addMember
);

router.delete('/rooms/:id/members/:userId', 
  ChatSettingsValidation.removeMember(),
  ChatSettingsController.removeMember
);

router.put('/rooms/:id/members/:userId/role', 
  ChatSettingsValidation.updateMemberRole(),
  ChatSettingsController.updateMemberRole
);

// User Search and Management
router.get('/users/search', 
  ChatSettingsValidation.searchUsers(),
  ChatSettingsController.searchUsers
);

router.get('/users/online', 
  ChatSettingsController.getOnlineUsers
);

// Member validation for room creation
router.post('/rooms/validate-members', 
  ChatSettingsValidation.validateMembers(),
  async (req, res) => {
    try {
      const { memberIds } = req.body;
      const { User } = require('../models');
      
      const users = await User.findAll({
        where: {
          id: memberIds,
          is_active: true
        },
        attributes: ['id', 'name', 'email', 'avatar_url', 'is_online']
      });
      
      const validMemberIds = users.map(user => user.id);
      const invalidMemberIds = memberIds.filter(id => !validMemberIds.includes(id));
      
      res.json({
        success: true,
        data: {
          validMembers: users,
          invalidMembers: invalidMemberIds
        }
      });
    } catch (error) {
      console.error('Error validating members:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
);

/**
 * Enhanced Chat Routes (existing functionality with improvements)
 */

// Get user's chat rooms
router.get('/rooms', ChatController.getUserRooms);

// Create new chat room
router.post('/rooms', 
  ChatSettingsValidation.createRoom(),
  ChatController.createRoom
);

// Get room messages with pagination
router.get('/rooms/:id/messages', 
  ChatSettingsValidation.getRoomMessages(),
  ChatController.getRoomMessages
);

// Get room members
router.get('/rooms/:id/members', 
  ChatSettingsValidation.roomOperation(),
  ChatController.getRoomMembers
);

// Send message (HTTP endpoint for fallback)
router.post('/messages', 
  ChatSettingsValidation.sendMessage(),
  ChatController.sendMessage
);

// Add reaction to message
router.post('/reactions', 
  ChatSettingsValidation.addReaction(),
  ChatController.addReaction
);

// Remove reaction from message
router.delete('/reactions/:messageId/:reactionType', 
  async (req, res) => {
    try {
      const { messageId, reactionType } = req.params;
      const userId = req.user.id;
      
      const { ChatReaction } = require('../models');
      
      const reaction = await ChatReaction.findOne({
        where: {
          message_id: parseInt(messageId),
          user_id: userId,
          reaction_type: reactionType
        }
      });
      
      if (reaction) {
        await reaction.destroy();
      }
      
      res.json({
        success: true,
        message: 'Reaction removed successfully'
      });
      
    } catch (error) {
      console.error('Error removing reaction:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
);

// Get message reactions
router.get('/messages/:id/reactions', 
  async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const { ChatReaction, User } = require('../models');
      
      const reactions = await ChatReaction.findAll({
        where: { message_id: messageId },
        include: [{
          model: User,
          attributes: ['id', 'name', 'avatar_url']
        }],
        order: [['created_at', 'ASC']]
      });
      
      res.json({
        success: true,
        data: reactions
      });
      
    } catch (error) {
      console.error('Error getting reactions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
);

// Mark messages as read
router.post('/rooms/:id/mark-read', 
  ChatSettingsValidation.roomOperation(),
  async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const { ChatRoomMember } = require('../models');
      
      // Update last read timestamp for user in this room
      await ChatRoomMember.update(
        { last_read_at: new Date() },
        { 
          where: { 
            room_id: roomId, 
            user_id: userId 
          } 
        }
      );
      
      res.json({
        success: true,
        message: 'Messages marked as read'
      });
      
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
);

// Get user's notification preferences
router.get('/users/:id/notification-preferences', 
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user is requesting their own preferences or is admin
      if (userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      const { User } = require('../models');
      
      const user = await User.findByPk(userId, {
        attributes: ['id', 'notification_preferences']
      });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      res.json({
        success: true,
        data: {
          userId: user.id,
          preferences: user.notification_preferences || {}
        }
      });
      
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
);

// Update user's notification preferences
router.put('/users/:id/notification-preferences', 
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { preferences } = req.body;
      
      // Check if user is updating their own preferences
      if (userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      const { User } = require('../models');
      
      await User.update(
        { notification_preferences: preferences },
        { where: { id: userId } }
      );
      
      res.json({
        success: true,
        message: 'Notification preferences updated successfully'
      });
      
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Chat Settings Routes Error:', error);
  
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }
  
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference to related resource'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

module.exports = router;
