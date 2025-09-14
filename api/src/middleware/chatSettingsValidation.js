const { body, param, query } = require('express-validator');

/**
 * Validation middleware for chat settings operations
 */
class ChatSettingsValidation {

  /**
   * Validation for updating room settings
   */
  static updateRoomSettings() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('Room ID must be a positive integer'),
      
      body('roomName')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Room name must be between 1 and 100 characters'),
      
      body('description')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must not exceed 500 characters'),
      
      body('isPrivate')
        .optional()
        .isBoolean()
        .withMessage('isPrivate must be a boolean'),
      
      body('allowInvites')
        .optional()
        .isBoolean()
        .withMessage('allowInvites must be a boolean'),
      
      body('autoDeleteMessages')
        .optional()
        .isBoolean()
        .withMessage('autoDeleteMessages must be a boolean'),
      
      body('autoDeleteDays')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('autoDeleteDays must be between 1 and 365')
    ];
  }

  /**
   * Validation for adding member to room
   */
  static addMember() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('Room ID must be a positive integer'),
      
      body('userId')
        .isInt({ min: 1 })
        .withMessage('User ID must be a positive integer')
    ];
  }

  /**
   * Validation for removing member from room
   */
  static removeMember() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('Room ID must be a positive integer'),
      
      param('userId')
        .isInt({ min: 1 })
        .withMessage('User ID must be a positive integer')
    ];
  }

  /**
   * Validation for updating member role
   */
  static updateMemberRole() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('Room ID must be a positive integer'),
      
      param('userId')
        .isInt({ min: 1 })
        .withMessage('User ID must be a positive integer'),
      
      body('isAdmin')
        .isBoolean()
        .withMessage('isAdmin must be a boolean')
    ];
  }

  /**
   * Validation for room operations (delete, leave, get settings)
   */
  static roomOperation() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('Room ID must be a positive integer')
    ];
  }

  /**
   * Validation for user search
   */
  static searchUsers() {
    return [
      query('q')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1 and 100 characters')
    ];
  }

  /**
   * Validation for creating chat room
   */
  static createRoom() {
    return [
      body('name')
        .isString()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Room name is required and must be between 1 and 100 characters'),
      
      body('description')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must not exceed 500 characters'),
      
      body('type')
        .optional()
        .isIn(['global', 'group', 'course', 'private'])
        .withMessage('Type must be one of: global, group, course, private'),
      
      body('is_public')
        .optional()
        .isBoolean()
        .withMessage('is_public must be a boolean'),
      
      body('memberIds')
        .optional()
        .isArray()
        .withMessage('memberIds must be an array'),
      
      body('memberIds.*')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Each member ID must be a positive integer')
    ];
  }

  /**
   * Validation for sending messages
   */
  static sendMessage() {
    return [
      body('roomId')
        .isInt({ min: 1 })
        .withMessage('Room ID must be a positive integer'),
      
      body('content')
        .isString()
        .trim()
        .isLength({ min: 1, max: 2000 })
        .withMessage('Message content is required and must be between 1 and 2000 characters'),
      
      body('type')
        .optional()
        .isIn(['text', 'image', 'file'])
        .withMessage('Message type must be one of: text, image, file'),
      
      body('replyTo')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Reply to message ID must be a positive integer')
    ];
  }

  /**
   * Validation for reaction operations
   */
  static addReaction() {
    return [
      body('messageId')
        .isInt({ min: 1 })
        .withMessage('Message ID must be a positive integer'),
      
      body('reactionType')
        .isIn(['like', 'love', 'laugh', 'sad', 'angry'])
        .withMessage('Reaction type must be one of: like, love, laugh, sad, angry')
    ];
  }

  /**
   * Validation for getting room messages
   */
  static getRoomMessages() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('Room ID must be a positive integer'),
      
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
      
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
    ];
  }

  /**
   * Validation for batch member operations
   */
  static validateMembers() {
    return [
      body('memberIds')
        .isArray({ min: 1 })
        .withMessage('memberIds must be a non-empty array'),
      
      body('memberIds.*')
        .isInt({ min: 1 })
        .withMessage('Each member ID must be a positive integer')
    ];
  }

  /**
   * Custom validation helper for checking if user exists
   */
  static async checkUserExists(userId) {
    const { User } = require('../models');
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return true;
  }

  /**
   * Custom validation helper for checking if room exists
   */
  static async checkRoomExists(roomId) {
    const { ChatRoom } = require('../models');
    const room = await ChatRoom.findByPk(roomId);
    if (!room) {
      throw new Error('Chat room not found');
    }
    return true;
  }

  /**
   * Custom validation helper for checking if user is room member
   */
  static async checkRoomMembership(roomId, userId) {
    const { ChatRoom, ChatRoomMember } = require('../models');
    
    const room = await ChatRoom.findByPk(roomId);
    if (!room) {
      throw new Error('Chat room not found');
    }
    
    // Check if user is creator
    if (room.created_by === userId) {
      return true;
    }
    
    // Check if user is member
    const membership = await ChatRoomMember.findOne({
      where: { room_id: roomId, user_id: userId }
    });
    
    if (!membership) {
      throw new Error('User is not a member of this room');
    }
    
    return true;
  }

  /**
   * Sanitize input data
   */
  static sanitizeInput(data) {
    const sanitized = {};
    
    // Remove any potential XSS or injection attacks
    for (const key in data) {
      if (typeof data[key] === 'string') {
        // Basic sanitization - in production, use a library like DOMPurify
        sanitized[key] = data[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+=/gi, '');
      } else {
        sanitized[key] = data[key];
      }
    }
    
    return sanitized;
  }

  /**
   * Rate limiting configuration for chat operations
   */
  static getRateLimitConfig() {
    return {
      sendMessage: {
        windowMs: 60 * 1000, // 1 minute
        max: 60, // 60 messages per minute
        message: 'Too many messages sent, please slow down'
      },
      createRoom: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10, // 10 rooms per hour
        message: 'Too many rooms created, please wait before creating more'
      },
      addMember: {
        windowMs: 60 * 1000, // 1 minute
        max: 20, // 20 member additions per minute
        message: 'Too many member additions, please slow down'
      },
      reaction: {
        windowMs: 60 * 1000, // 1 minute
        max: 100, // 100 reactions per minute
        message: 'Too many reactions, please slow down'
      }
    };
  }
}

module.exports = ChatSettingsValidation;
