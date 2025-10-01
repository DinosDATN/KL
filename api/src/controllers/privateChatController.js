const { PrivateConversation, PrivateMessage, PrivateMessageStatus, User, Friendship, UserBlock } = require('../models');
const { Op } = require('sequelize');

// Get all private conversations for a user
const getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, includeArchived = false } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      [Op.or]: [
        { participant1_id: userId },
        { participant2_id: userId }
      ]
    };

    if (!includeArchived) {
      whereClause.is_active = true;
    }

    const conversations = await PrivateConversation.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'Participant1',
          attributes: ['id', 'name', 'email', 'avatar_url', 'is_online', 'last_seen_at']
        },
        {
          model: User,
          as: 'Participant2',
          attributes: ['id', 'name', 'email', 'avatar_url', 'is_online', 'last_seen_at']
        },
        {
          model: PrivateMessage,
          as: 'LastMessage',
          required: false,
          include: [{
            model: User,
            as: 'Sender',
            attributes: ['id', 'name']
          }]
        }
      ],
      order: [['last_activity_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    // Transform data to include other participant info
    const conversationsData = await Promise.all(
      conversations.rows.map(async (conversation) => {
        const otherParticipant = conversation.participant1_id === userId ? 
          conversation.Participant2 : conversation.Participant1;

        // Get unread count for this conversation
        const unreadCount = await PrivateMessageStatus.count({
          where: {
            user_id: userId,
            status: ['sent', 'delivered']
          },
          include: [{
            model: PrivateMessage,
            as: 'Message',
            where: {
              conversation_id: conversation.id,
              is_deleted: false
            }
          }]
        });

        return {
          id: conversation.id,
          other_participant: otherParticipant,
          last_message: conversation.LastMessage,
          last_activity_at: conversation.last_activity_at,
          is_active: conversation.is_active,
          unread_count: unreadCount
        };
      })
    );

    res.json({
      success: true,
      data: {
        conversations: conversationsData,
        totalCount: conversations.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(conversations.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations'
    });
  }
};

// Get or create a conversation with another user
const getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    if (userId === parseInt(otherUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create conversation with yourself'
      });
    }

    // Check if the other user exists and is active
    const otherUser = await User.findByPk(otherUserId);
    if (!otherUser || !otherUser.is_active) {
      return res.status(404).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Check if users are blocked
    const areBlocked = await UserBlock.areBlocked(userId, otherUserId);
    if (areBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot create conversation with this user'
      });
    }

    // Check if users are friends (optional requirement)
    const areFriends = await Friendship.areFriends(userId, otherUserId);
    if (!areFriends) {
      return res.status(403).json({
        success: false,
        message: 'You must be friends with this user to start a conversation'
      });
    }

    // Get or create conversation
    const { conversation, created } = await PrivateConversation.findOrCreateConversation(userId, otherUserId);

    // Fetch complete conversation with participants
    const completeConversation = await PrivateConversation.findByPk(conversation.id, {
      include: [
        {
          model: User,
          as: 'Participant1',
          attributes: ['id', 'name', 'email', 'avatar_url', 'is_online', 'last_seen_at']
        },
        {
          model: User,
          as: 'Participant2',
          attributes: ['id', 'name', 'email', 'avatar_url', 'is_online', 'last_seen_at']
        }
      ]
    });

    const otherParticipant = completeConversation.participant1_id === userId ? 
      completeConversation.Participant2 : completeConversation.Participant1;

    res.status(created ? 201 : 200).json({
      success: true,
      message: created ? 'Conversation created successfully' : 'Conversation retrieved successfully',
      data: {
        id: completeConversation.id,
        other_participant: otherParticipant,
        last_activity_at: completeConversation.last_activity_at,
        is_active: completeConversation.is_active,
        created: created
      }
    });
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting/creating conversation'
    });
  }
};

// Get messages for a specific conversation
const getConversationMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { page = 1, limit = 50, includeDeleted = false } = req.query;
    const offset = (page - 1) * limit;

    // Find conversation and verify user is a participant
    const conversation = await PrivateConversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.isParticipant(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    const whereClause = {
      conversation_id: conversationId
    };

    if (!includeDeleted) {
      whereClause.is_deleted = false;
    }

    const messages = await PrivateMessage.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'Sender',
          attributes: ['id', 'name', 'email', 'avatar_url']
        },
        {
          model: PrivateMessage,
          as: 'ReplyToMessage',
          required: false,
          include: [{
            model: User,
            as: 'Sender',
            attributes: ['id', 'name']
          }]
        },
        {
          model: PrivateMessageStatus,
          as: 'MessageStatuses',
          where: { user_id: userId },
          required: false
        }
      ],
      order: [['sent_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    // Transform messages to include read status
    const messagesWithStatus = messages.rows.map(message => {
      const messageData = message.toJSON();
      const status = messageData.MessageStatuses?.[0]?.status || 'sent';
      
      return {
        ...messageData,
        read_status: status,
        MessageStatuses: undefined // Remove from response
      };
    });

    res.json({
      success: true,
      data: {
        messages: messagesWithStatus.reverse(), // Reverse to show oldest first
        totalCount: messages.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(messages.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
};

// Send a private message
const sendPrivateMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { conversationId } = req.params;
    const { 
      content, 
      message_type = 'text', 
      file_url = null, 
      file_name = null, 
      file_size = null,
      reply_to_message_id = null 
    } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Find conversation and verify user is a participant
    const conversation = await PrivateConversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.isParticipant(senderId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    const receiverId = conversation.getOtherParticipant(senderId);

    // Check if users are blocked
    const areBlocked = await UserBlock.areBlocked(senderId, receiverId);
    if (areBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot send message to this user'
      });
    }

    // Create the message
    const message = await PrivateMessage.create({
      conversation_id: conversationId,
      sender_id: senderId,
      receiver_id: receiverId,
      content: content.trim(),
      message_type,
      file_url,
      file_name,
      file_size,
      reply_to_message_id
    });

    // Update conversation last activity
    await conversation.updateLastActivity(message.id);

    // Create message status for receiver
    await PrivateMessageStatus.create({
      message_id: message.id,
      user_id: receiverId,
      status: 'sent'
    });

    // Fetch complete message with sender info
    const completeMessage = await PrivateMessage.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'Sender',
          attributes: ['id', 'name', 'email', 'avatar_url']
        },
        {
          model: PrivateMessage,
          as: 'ReplyToMessage',
          required: false,
          include: [{
            model: User,
            as: 'Sender',
            attributes: ['id', 'name']
          }]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: completeMessage
    });
  } catch (error) {
    console.error('Error sending private message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
};

// Mark messages as read
const markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { messageIds } = req.body; // Array of message IDs

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message IDs array is required'
      });
    }

    // Verify user is participant in conversation
    const conversation = await PrivateConversation.findByPk(conversationId);
    if (!conversation || !conversation.isParticipant(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    // Mark messages as read
    await PrivateMessageStatus.markMultipleAsRead(messageIds, userId);

    res.json({
      success: true,
      message: 'Messages marked as read successfully'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking messages as read'
    });
  }
};

// Edit a message
const editMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'New message content is required'
      });
    }

    const message = await PrivateMessage.findByPk(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (!message.canBeEditedBy(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You cannot edit this message'
      });
    }

    await message.markAsEdited(content.trim());

    res.json({
      success: true,
      message: 'Message edited successfully',
      data: message
    });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({
      success: false,
      message: 'Error editing message'
    });
  }
};

// Delete a message
const deleteMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message = await PrivateMessage.findByPk(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (!message.canBeDeletedBy(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You cannot delete this message'
      });
    }

    await message.softDelete();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting message'
    });
  }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.query;

    let unreadCount;
    
    if (conversationId) {
      // Get unread count for specific conversation
      unreadCount = await PrivateMessageStatus.count({
        where: {
          user_id: userId,
          status: ['sent', 'delivered']
        },
        include: [{
          model: PrivateMessage,
          as: 'Message',
          where: {
            conversation_id: conversationId,
            is_deleted: false
          }
        }]
      });
    } else {
      // Get total unread count across all conversations
      unreadCount = await PrivateMessageStatus.count({
        where: {
          user_id: userId,
          status: ['sent', 'delivered']
        },
        include: [{
          model: PrivateMessage,
          as: 'Message',
          where: {
            is_deleted: false
          }
        }]
      });
    }

    res.json({
      success: true,
      data: {
        unread_count: unreadCount,
        conversation_id: conversationId || null
      }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting unread count'
    });
  }
};

// Archive/Unarchive a conversation
const toggleConversationArchive = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const conversation = await PrivateConversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.isParticipant(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    if (conversation.is_active) {
      await conversation.archive();
    } else {
      await conversation.restore();
    }

    res.json({
      success: true,
      message: `Conversation ${conversation.is_active ? 'restored' : 'archived'} successfully`,
      data: {
        id: conversation.id,
        is_active: conversation.is_active
      }
    });
  } catch (error) {
    console.error('Error toggling conversation archive:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling conversation archive status'
    });
  }
};

module.exports = {
  getUserConversations,
  getOrCreateConversation,
  getConversationMessages,
  sendPrivateMessage,
  markMessagesAsRead,
  editMessage,
  deleteMessage,
  getUnreadCount,
  toggleConversationArchive
};
