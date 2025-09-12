const { ChatRoom, ChatMessage, ChatRoomMember, ChatReaction, User } = require('../models');
const { Op } = require('sequelize');

// Get all chat rooms for a user
const getUserChatRooms = async (req, res) => {
  try {
    const userId = req.user.id;

    const userRooms = await ChatRoom.findAll({
      include: [
        {
          model: User,
          as: 'Members',
          where: { id: userId },
          through: { attributes: ['is_admin'] }
        },
        {
          model: User,
          as: 'Creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: ChatMessage,
          as: 'Messages',
          limit: 1,
          order: [['sent_at', 'DESC']],
          required: false,
          include: [{
            model: User,
            as: 'Sender',
            attributes: ['id', 'name']
          }]
        }
      ],
      order: [['updated_at', 'DESC']]
    });

    res.json({
      success: true,
      data: userRooms
    });
  } catch (error) {
    console.error('Error fetching user chat rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat rooms'
    });
  }
};

// Get messages for a specific chat room
const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    // Check if user is member of the room
    const isMember = await ChatRoomMember.findOne({
      where: {
        room_id: roomId,
        user_id: userId
      }
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this chat room'
      });
    }

    const offset = (page - 1) * limit;

    const messages = await ChatMessage.findAndCountAll({
      where: { room_id: roomId },
      include: [
        {
          model: User,
          as: 'Sender',
          attributes: ['id', 'name', 'email', 'is_online', 'last_seen_at']
        },
        {
          model: ChatReaction,
          as: 'Reactions',
          include: [{
            model: User,
            as: 'User',
            attributes: ['id', 'name']
          }]
        },
        {
          model: ChatMessage,
          as: 'ReplyToMessage',
          include: [{
            model: User,
            as: 'Sender',
            attributes: ['id', 'name']
          }]
        }
      ],
      order: [['sent_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: {
        messages: messages.rows.reverse(),
        totalCount: messages.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(messages.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching room messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
};

// Send a message to a chat room
const sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const { content, type = 'text', reply_to = null } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Check if user is member of the room
    const isMember = await ChatRoomMember.findOne({
      where: {
        room_id: roomId,
        user_id: userId
      }
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this chat room'
      });
    }

    const message = await ChatMessage.create({
      room_id: roomId,
      sender_id: userId,
      content: content.trim(),
      type: type,
      reply_to: reply_to
    });

    // Update room's last message and timestamp
    await ChatRoom.update(
      {
        last_message_id: message.id,
        updated_at: new Date()
      },
      {
        where: { id: roomId }
      }
    );

    // Fetch the complete message with sender info
    const completeMessage = await ChatMessage.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'Sender',
          attributes: ['id', 'name', 'email', 'is_online', 'last_seen_at']
        },
        {
          model: ChatMessage,
          as: 'ReplyToMessage',
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
      data: completeMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
};

// Create a new chat room
const createChatRoom = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, type = 'group', is_public = true, memberIds = [] } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Room name is required'
      });
    }

    const room = await ChatRoom.create({
      name: name.trim(),
      description: description?.trim(),
      type: type,
      is_public: is_public,
      created_by: userId
    });

    // Add creator as admin member
    await ChatRoomMember.create({
      room_id: room.id,
      user_id: userId,
      is_admin: true
    });

    // Add other members
    if (memberIds.length > 0) {
      const memberData = memberIds.map(memberId => ({
        room_id: room.id,
        user_id: memberId,
        is_admin: false
      }));
      await ChatRoomMember.bulkCreate(memberData);
    }

    // Fetch complete room info
    const completeRoom = await ChatRoom.findByPk(room.id, {
      include: [
        {
          model: User,
          as: 'Creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'Members',
          attributes: ['id', 'name', 'email', 'is_online'],
          through: { attributes: ['is_admin'] }
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: completeRoom
    });
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating chat room'
    });
  }
};

// Add reaction to a message
const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    const { reaction_type } = req.body;

    if (!['like', 'love', 'laugh', 'sad', 'angry'].includes(reaction_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reaction type'
      });
    }

    // Check if message exists and user has access
    const message = await ChatMessage.findByPk(messageId, {
      include: [{
        model: ChatRoom,
        as: 'Room',
        include: [{
          model: User,
          as: 'Members',
          where: { id: userId },
          required: true
        }]
      }]
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or access denied'
      });
    }

    // Check if user already reacted
    const existingReaction = await ChatReaction.findOne({
      where: {
        message_id: messageId,
        user_id: userId
      }
    });

    if (existingReaction) {
      if (existingReaction.reaction_type === reaction_type) {
        // Remove reaction
        await existingReaction.destroy();
        return res.json({
          success: true,
          data: { action: 'removed', reaction_type }
        });
      } else {
        // Update reaction
        await existingReaction.update({ reaction_type });
        return res.json({
          success: true,
          data: { action: 'updated', reaction_type }
        });
      }
    } else {
      // Add new reaction
      await ChatReaction.create({
        message_id: messageId,
        user_id: userId,
        reaction_type
      });
      return res.json({
        success: true,
        data: { action: 'added', reaction_type }
      });
    }
  } catch (error) {
    console.error('Error handling reaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error handling reaction'
    });
  }
};

// Get room members
const getRoomMembers = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // Check if user is member of the room
    const isMember = await ChatRoomMember.findOne({
      where: {
        room_id: roomId,
        user_id: userId
      }
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this chat room'
      });
    }

    const members = await ChatRoomMember.findAll({
      where: { room_id: roomId },
      include: [{
        model: User,
        as: 'User',
        attributes: ['id', 'name', 'email', 'is_online', 'last_seen_at']
      }],
      order: [['is_admin', 'DESC'], ['joined_at', 'ASC']]
    });

    res.json({
      success: true,
      data: members
    });
  } catch (error) {
    console.error('Error fetching room members:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching room members'
    });
  }
};

module.exports = {
  getUserChatRooms,
  getRoomMessages,
  sendMessage,
  createChatRoom,
  addReaction,
  getRoomMembers
};
