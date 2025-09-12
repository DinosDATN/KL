const jwt = require('jsonwebtoken');
const { ChatRoom, ChatMessage, ChatRoomMember, ChatReaction, User } = require('../models');

// Store active users
const activeUsers = new Map();
const typingUsers = new Map();

// Authenticate socket connection
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user.id;
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

// Handle socket connection
const handleConnection = (io) => {
  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.name} connected (${socket.id})`);

    // Store user connection
    activeUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      lastSeen: new Date()
    });

    // Update user online status in database
    User.update(
      { is_online: true, last_seen_at: new Date() },
      { where: { id: socket.userId } }
    );

    // Join user to their rooms
    joinUserRooms(socket);

    // Notify others that user is online
    socket.broadcast.emit('user_online', {
      userId: socket.userId,
      username: socket.user.name
    });

    // Handle joining a room
    socket.on('join_room', async (roomId) => {
      try {
        const isMember = await ChatRoomMember.findOne({
          where: {
            room_id: roomId,
            user_id: socket.userId
          }
        });

        if (isMember) {
          socket.join(`room_${roomId}`);
          socket.emit('joined_room', { roomId, success: true });
        } else {
          socket.emit('error', { message: 'Not a member of this room' });
        }
      } catch (error) {
        socket.emit('error', { message: 'Error joining room' });
      }
    });

    // Handle leaving a room
    socket.on('leave_room', (roomId) => {
      socket.leave(`room_${roomId}`);
      socket.emit('left_room', { roomId });
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { roomId, content, type = 'text', replyTo = null } = data;

        if (!content || !content.trim()) {
          return socket.emit('error', { message: 'Message content is required' });
        }

        // Check if user is member of the room
        const isMember = await ChatRoomMember.findOne({
          where: {
            room_id: roomId,
            user_id: socket.userId
          }
        });

        if (!isMember) {
          return socket.emit('error', { message: 'Not a member of this room' });
        }

        // Create the message
        const message = await ChatMessage.create({
          room_id: roomId,
          sender_id: socket.userId,
          content: content.trim(),
          type: type,
          reply_to: replyTo
        });

        // Update room's last message
        await ChatRoom.update(
          {
            last_message_id: message.id,
            updated_at: new Date()
          },
          {
            where: { id: roomId }
          }
        );

        // Fetch complete message with sender info
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

        // Broadcast message to all room members
        io.to(`room_${roomId}`).emit('new_message', completeMessage);

        // Stop typing indicator for this user
        clearTyping(socket, roomId);

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Error sending message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', async (data) => {
      const { roomId } = data;
      
      if (!typingUsers.has(roomId)) {
        typingUsers.set(roomId, new Set());
      }
      
      typingUsers.get(roomId).add(socket.userId);
      
      // Broadcast typing to other users in the room
      socket.to(`room_${roomId}`).emit('user_typing', {
        userId: socket.userId,
        username: socket.user.name,
        roomId
      });
    });

    socket.on('typing_stop', (data) => {
      const { roomId } = data;
      clearTyping(socket, roomId);
    });

    // Handle reactions
    socket.on('add_reaction', async (data) => {
      try {
        const { messageId, reactionType } = data;

        if (!['like', 'love', 'laugh', 'sad', 'angry'].includes(reactionType)) {
          return socket.emit('error', { message: 'Invalid reaction type' });
        }

        // Check if message exists and user has access
        const message = await ChatMessage.findByPk(messageId, {
          include: [{
            model: ChatRoom,
            as: 'Room',
            include: [{
              model: User,
              as: 'Members',
              where: { id: socket.userId },
              required: true
            }]
          }]
        });

        if (!message) {
          return socket.emit('error', { message: 'Message not found or access denied' });
        }

        // Check existing reaction
        const existingReaction = await ChatReaction.findOne({
          where: {
            message_id: messageId,
            user_id: socket.userId
          }
        });

        let action;
        if (existingReaction) {
          if (existingReaction.reaction_type === reactionType) {
            // Remove reaction
            await existingReaction.destroy();
            action = 'removed';
          } else {
            // Update reaction
            await existingReaction.update({ reaction_type: reactionType });
            action = 'updated';
          }
        } else {
          // Add new reaction
          await ChatReaction.create({
            message_id: messageId,
            user_id: socket.userId,
            reaction_type: reactionType
          });
          action = 'added';
        }

        // Broadcast reaction update to room members
        io.to(`room_${message.room_id}`).emit('reaction_update', {
          messageId,
          userId: socket.userId,
          username: socket.user.name,
          reactionType,
          action
        });

      } catch (error) {
        console.error('Error handling reaction:', error);
        socket.emit('error', { message: 'Error handling reaction' });
      }
    });

    // Handle room creation
    socket.on('create_room', async (data) => {
      try {
        const { name, description, type = 'group', isPublic = true, memberIds = [] } = data;

        if (!name || !name.trim()) {
          return socket.emit('error', { message: 'Room name is required' });
        }

        const room = await ChatRoom.create({
          name: name.trim(),
          description: description?.trim(),
          type: type,
          is_public: isPublic,
          created_by: socket.userId
        });

        // Add creator as admin member
        await ChatRoomMember.create({
          room_id: room.id,
          user_id: socket.userId,
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

        // Join creator to room
        socket.join(`room_${room.id}`);

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

        // Notify all members about the new room
        const allMemberIds = [socket.userId, ...memberIds];
        allMemberIds.forEach(memberId => {
          const userSocket = Array.from(io.sockets.sockets.values())
            .find(s => s.userId === memberId);
          if (userSocket) {
            userSocket.join(`room_${room.id}`);
            userSocket.emit('room_created', completeRoom);
          }
        });

      } catch (error) {
        console.error('Error creating room:', error);
        socket.emit('error', { message: 'Error creating room' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.name} disconnected`);
      
      // Remove from active users
      activeUsers.delete(socket.userId);
      
      // Clear typing indicators
      typingUsers.forEach((users, roomId) => {
        if (users.has(socket.userId)) {
          users.delete(socket.userId);
          socket.to(`room_${roomId}`).emit('user_stop_typing', {
            userId: socket.userId,
            roomId
          });
        }
      });

      // Update user offline status
      User.update(
        { is_online: false, last_seen_at: new Date() },
        { where: { id: socket.userId } }
      );

      // Notify others that user is offline
      socket.broadcast.emit('user_offline', {
        userId: socket.userId,
        username: socket.user.name
      });
    });
  });
};

// Helper function to join user to their rooms
const joinUserRooms = async (socket) => {
  try {
    const userRooms = await ChatRoomMember.findAll({
      where: { user_id: socket.userId },
      attributes: ['room_id']
    });

    userRooms.forEach(({ room_id }) => {
      socket.join(`room_${room_id}`);
    });
  } catch (error) {
    console.error('Error joining user rooms:', error);
  }
};

// Helper function to clear typing indicator
const clearTyping = (socket, roomId) => {
  if (typingUsers.has(roomId)) {
    const roomTypingUsers = typingUsers.get(roomId);
    if (roomTypingUsers.has(socket.userId)) {
      roomTypingUsers.delete(socket.userId);
      socket.to(`room_${roomId}`).emit('user_stop_typing', {
        userId: socket.userId,
        roomId
      });
    }
  }
};

// Get active users
const getActiveUsers = () => {
  return Array.from(activeUsers.values()).map(({ user, lastSeen }) => ({
    id: user.id,
    username: user.name,
    lastSeen
  }));
};

module.exports = {
  handleConnection,
  getActiveUsers
};
