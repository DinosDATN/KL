const {
  ChatRoom,
  ChatMessage,
  ChatRoomMember,
  ChatReaction,
  User,
  PrivateConversation,
  PrivateMessage,
  PrivateMessageStatus,
} = require("../models");
const {
  authenticateSocket,
  handleAuthError,
} = require("../middleware/socketAuthMiddleware");

// Store active users
const activeUsers = new Map();
const typingUsers = new Map();

// Handle socket connection
const handleConnection = (io) => {
  // Apply authentication middleware with error handling
  io.use(authenticateSocket);

  // Handle authentication errors
  io.engine.on("connection_error", (err) => {
    console.error("🚫 Socket.IO connection error:", err.message);
    console.error("🔍 Error details:", err.context);
  });

  io.on("connection", (socket) => {
    console.log(
      `🔗 User ${socket.user.name} (ID: ${socket.userId}) connected (Socket ID: ${socket.id})`
    );
    console.log(`📊 Active users count: ${activeUsers.size + 1}`);

    // Check if user already has an active connection
    const existingConnection = activeUsers.get(socket.userId);
    if (existingConnection) {
      console.log(`⚠️ User ${socket.user.name} already has an active connection (Socket ID: ${existingConnection.socketId})`);
      console.log(`🔄 Disconnecting old socket and replacing with new one`);
      
      // Find and disconnect the old socket
      const oldSocket = io.sockets.sockets.get(existingConnection.socketId);
      if (oldSocket) {
        oldSocket.disconnect(true);
      }
    }

    // Store user connection
    activeUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      lastSeen: new Date(),
    });

    // Update user online status in database
    User.update(
      { is_online: true, last_seen_at: new Date() },
      { where: { id: socket.userId } }
    );

    // Join user to their personal notification room
    socket.join(`user_${socket.userId}`);
    console.log(`✅ User ${socket.user.name} (Socket ID: ${socket.id}) joined personal notification room: user_${socket.userId}`);
    
    // Log how many sockets are in this room
    const roomSockets = io.sockets.adapter.rooms.get(`user_${socket.userId}`);
    console.log(`📊 Total sockets in room user_${socket.userId}: ${roomSockets ? roomSockets.size : 0}`);

    // Join user to their group chat rooms
    joinUserRooms(socket);

    // Join user to their private conversation rooms
    joinUserPrivateConversations(socket);

    // Notify others that user is online
    socket.broadcast.emit("user_online", {
      userId: socket.userId,
      username: socket.user.name,
    });

    // Handle joining a room
    socket.on("join_room", async (roomId) => {
      try {
        console.log(
          `🚪 User ${socket.user.name} trying to join room ${roomId}`
        );
        const isMember = await ChatRoomMember.findOne({
          where: {
            room_id: roomId,
            user_id: socket.userId,
          },
        });

        if (isMember) {
          socket.join(`room_${roomId}`);
          socket.emit("joined_room", { roomId, success: true });
          console.log(
            `✅ User ${socket.user.name} successfully joined room ${roomId}`
          );
        } else {
          console.log(
            `❌ User ${socket.user.name} not a member of room ${roomId}`
          );
          socket.emit("error", { message: "Not a member of this room" });
        }
      } catch (error) {
        console.error(`❌ Error joining room ${roomId}:`, error);
        socket.emit("error", { message: "Error joining room" });
      }
    });

    // Handle leaving a room
    socket.on("leave_room", (roomId) => {
      socket.leave(`room_${roomId}`);
      socket.emit("left_room", { roomId });
    });

    // Handle joining a private conversation room
    socket.on("join_private_conversation", async (data) => {
      try {
        const { conversationId } = data;
        console.log(
          `😪 User ${socket.user.name} trying to join private conversation ${conversationId}`
        );

        // Verify user is a participant in the conversation
        const conversation = await PrivateConversation.findByPk(conversationId);
        if (!conversation || !conversation.isParticipant(socket.userId)) {
          console.log(
            `❌ User ${socket.user.name} not a participant of conversation ${conversationId}`
          );
          return socket.emit("error", {
            message: "Not a participant in this conversation",
          });
        }

        const conversationRoomId = `private_conversation_${conversationId}`;
        socket.join(conversationRoomId);
        socket.emit("joined_private_conversation", {
          conversationId,
          success: true,
        });
        console.log(
          `✅ User ${socket.user.name} successfully joined private conversation room ${conversationRoomId}`
        );
      } catch (error) {
        console.error(
          `❌ Error joining private conversation ${data?.conversationId}:`,
          error
        );
        socket.emit("error", { message: "Error joining private conversation" });
      }
    });

    // Handle leaving a private conversation room
    socket.on("leave_private_conversation", (data) => {
      const { conversationId } = data;
      const conversationRoomId = `private_conversation_${conversationId}`;
      socket.leave(conversationRoomId);
      socket.emit("left_private_conversation", { conversationId });
      console.log(
        `✅ User ${socket.user.name} left private conversation room ${conversationRoomId}`
      );
    });

    // Handle sending messages
    socket.on("send_message", async (data) => {
      try {
        console.log(`💬 Message received from user ${socket.user.name}:`, data);
        const {
          roomId,
          content,
          type = "text",
          replyTo = null,
          file_url = null,
          file_name = null,
          file_size = null,
        } = data;

        // Content is required unless it's a file/image message
        if (!content && !file_url) {
          console.log("❌ Empty message content and no file");
          return socket.emit("error", {
            message: "Message content or file is required",
          });
        }

        // Check if user is member of the room
        const isMember = await ChatRoomMember.findOne({
          where: {
            room_id: roomId,
            user_id: socket.userId,
          },
        });

        if (!isMember) {
          console.log(
            `❌ User ${socket.user.name} not member of room ${roomId}`
          );
          return socket.emit("error", { message: "Not a member of this room" });
        }

        // Create the message
        const message = await ChatMessage.create({
          room_id: roomId,
          sender_id: socket.userId,
          content: content ? content.trim() : file_name || "Đã gửi file",
          type: type,
          reply_to: replyTo,
          file_url: file_url,
          file_name: file_name,
          file_size: file_size,
        });

        // Update room's last message
        await ChatRoom.update(
          {
            last_message_id: message.id,
            updated_at: new Date(),
          },
          {
            where: { id: roomId },
          }
        );

        // Fetch complete message with sender info
        const completeMessage = await ChatMessage.findByPk(message.id, {
          include: [
            {
              model: User,
              as: "Sender",
              attributes: ["id", "name", "email", "is_online", "last_seen_at"],
            },
            {
              model: ChatMessage,
              as: "ReplyToMessage",
              include: [
                {
                  model: User,
                  as: "Sender",
                  attributes: ["id", "name"],
                },
              ],
            },
          ],
        });

        // Broadcast message to all room members
        console.log(
          `🚀 Broadcasting message to room_${roomId}:`,
          completeMessage.id
        );
        io.to(`room_${roomId}`).emit("new_message", completeMessage);

        // Stop typing indicator for this user
        clearTyping(socket, roomId);

        console.log(
          `✅ Message ${completeMessage.id} sent successfully by ${socket.user.name}`
        );
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Error sending message" });
      }
    });

    // Handle typing indicators
    socket.on("typing_start", async (data) => {
      const { roomId } = data;

      if (!typingUsers.has(roomId)) {
        typingUsers.set(roomId, new Set());
      }

      typingUsers.get(roomId).add(socket.userId);

      // Broadcast typing to other users in the room
      socket.to(`room_${roomId}`).emit("user_typing", {
        userId: socket.userId,
        username: socket.user.name,
        roomId,
      });
    });

    socket.on("typing_stop", (data) => {
      const { roomId } = data;
      clearTyping(socket, roomId);
    });

    // Handle reactions
    socket.on("add_reaction", async (data) => {
      try {
        const { messageId, reactionType } = data;

        if (!["like", "love", "laugh", "sad", "angry"].includes(reactionType)) {
          return socket.emit("error", { message: "Invalid reaction type" });
        }

        // Check if message exists and user has access
        const message = await ChatMessage.findByPk(messageId, {
          include: [
            {
              model: ChatRoom,
              as: "Room",
              include: [
                {
                  model: User,
                  as: "Members",
                  where: { id: socket.userId },
                  required: true,
                },
              ],
            },
          ],
        });

        if (!message) {
          return socket.emit("error", {
            message: "Message not found or access denied",
          });
        }

        // Check existing reaction
        const existingReaction = await ChatReaction.findOne({
          where: {
            message_id: messageId,
            user_id: socket.userId,
          },
        });

        let action;
        if (existingReaction) {
          if (existingReaction.reaction_type === reactionType) {
            // Remove reaction
            await existingReaction.destroy();
            action = "removed";
          } else {
            // Update reaction
            await existingReaction.update({ reaction_type: reactionType });
            action = "updated";
          }
        } else {
          // Add new reaction
          await ChatReaction.create({
            message_id: messageId,
            user_id: socket.userId,
            reaction_type: reactionType,
          });
          action = "added";
        }

        // Broadcast reaction update to room members
        io.to(`room_${message.room_id}`).emit("reaction_update", {
          messageId,
          userId: socket.userId,
          username: socket.user.name,
          reactionType,
          action,
        });
      } catch (error) {
        console.error("Error handling reaction:", error);
        socket.emit("error", { message: "Error handling reaction" });
      }
    });

    // Handle private message sending
    socket.on("send_private_message", async (data) => {
      try {
        console.log(
          `💬 Private message received from user ${socket.user.name}:`,
          data
        );
        const { 
          conversationId, 
          content,
          message_type = "text",
          file_url = null,
          file_name = null,
          file_size = null
        } = data;

        // Content is required unless it's a file/image message
        if (!content && !file_url) {
          console.log("❌ Empty private message content and no file");
          return socket.emit("error", {
            message: "Message content or file is required",
          });
        }

        // Find conversation and verify user is a participant
        const conversation = await PrivateConversation.findByPk(conversationId);
        if (!conversation) {
          console.log(`❌ Conversation ${conversationId} not found`);
          return socket.emit("error", { message: "Conversation not found" });
        }

        if (!conversation.isParticipant(socket.userId)) {
          console.log(
            `❌ User ${socket.user.name} not participant of conversation ${conversationId}`
          );
          return socket.emit("error", {
            message: "You are not a participant in this conversation",
          });
        }

        const receiverId = conversation.getOtherParticipant(socket.userId);

        // Create the message
        const message = await PrivateMessage.create({
          conversation_id: conversationId,
          sender_id: socket.userId,
          receiver_id: receiverId,
          content: content ? content.trim() : (file_name || "Đã gửi file"),
          message_type: message_type,
          file_url: file_url,
          file_name: file_name,
          file_size: file_size,
        });

        // Update conversation last activity
        await conversation.updateLastActivity(message.id);

        // Create message status for receiver
        await PrivateMessageStatus.create({
          message_id: message.id,
          user_id: receiverId,
          status: "sent",
        });

        // Fetch complete message with sender info
        const completeMessage = await PrivateMessage.findByPk(message.id, {
          include: [
            {
              model: User,
              as: "Sender",
              attributes: [
                "id",
                "name",
                "email",
                "avatar_url",
                "is_online",
                "last_seen_at",
              ],
            },
          ],
        });

        // Use room-based broadcasting like group chat for better reliability
        const conversationRoomId = `private_conversation_${conversationId}`;

        // Broadcast to all participants in the conversation room
        io.to(conversationRoomId).emit("new_private_message", completeMessage);

        // Stop typing indicator for this user in this conversation
        socket.to(conversationRoomId).emit("private_user_stop_typing", {
          userId: socket.userId,
          conversationId,
        });

        console.log(
          `✅ Private message ${completeMessage.id} sent successfully by ${socket.user.name} to room ${conversationRoomId}`
        );
      } catch (error) {
        console.error("Error sending private message:", error);
        socket.emit("error", { message: "Error sending private message" });
      }
    });

    // Handle private chat typing indicators
    socket.on("private_typing_start", async (data) => {
      try {
        const { conversationId } = data;

        // Verify user is participant
        const conversation = await PrivateConversation.findByPk(conversationId);
        if (!conversation || !conversation.isParticipant(socket.userId)) {
          return socket.emit("error", { message: "Invalid conversation" });
        }

        // Use room-based broadcasting like group chat
        const conversationRoomId = `private_conversation_${conversationId}`;

        // Broadcast typing indicator to other participants in the conversation room
        socket.to(conversationRoomId).emit("private_user_typing", {
          userId: socket.userId,
          username: socket.user.name,
          conversationId,
        });
      } catch (error) {
        console.error("Error handling private typing:", error);
      }
    });

    socket.on("private_typing_stop", async (data) => {
      try {
        const { conversationId } = data;

        // Verify user is participant
        const conversation = await PrivateConversation.findByPk(conversationId);
        if (!conversation || !conversation.isParticipant(socket.userId)) {
          return socket.emit("error", { message: "Invalid conversation" });
        }

        // Use room-based broadcasting like group chat
        const conversationRoomId = `private_conversation_${conversationId}`;

        // Broadcast stop typing indicator to other participants in the conversation room
        socket.to(conversationRoomId).emit("private_user_stop_typing", {
          userId: socket.userId,
          conversationId,
        });
      } catch (error) {
        console.error("Error handling private stop typing:", error);
      }
    });

    // Handle room creation
    socket.on("create_room", async (data) => {
      try {
        const {
          name,
          description,
          type = "group",
          isPublic = true,
          memberIds = [],
        } = data;

        if (!name || !name.trim()) {
          return socket.emit("error", { message: "Room name is required" });
        }

        // Validate member IDs
        let validMemberIds = [];
        if (memberIds && memberIds.length > 0) {
          const uniqueMemberIds = [
            ...new Set(memberIds.filter((id) => id !== socket.userId)),
          ];

          const validUsers = await User.findAll({
            where: {
              id: { [require("sequelize").Op.in]: uniqueMemberIds },
              is_active: true,
            },
            attributes: ["id"],
          });

          validMemberIds = validUsers.map((user) => user.id);
        }

        const room = await ChatRoom.create({
          name: name.trim(),
          description: description?.trim(),
          type: type,
          is_public: isPublic,
          created_by: socket.userId,
        });

        // Add creator as admin member
        await ChatRoomMember.create({
          room_id: room.id,
          user_id: socket.userId,
          is_admin: true,
        });

        // Add validated members
        if (validMemberIds.length > 0) {
          const memberData = validMemberIds.map((memberId) => ({
            room_id: room.id,
            user_id: memberId,
            is_admin: false,
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
              as: "Creator",
              attributes: ["id", "name", "email", "avatar_url"],
            },
            {
              model: User,
              as: "Members",
              attributes: ["id", "name", "email", "avatar_url", "is_online"],
              through: { attributes: ["is_admin"] },
            },
          ],
        });

        // Notify creator first
        socket.emit("room_created", {
          ...completeRoom.toJSON(),
          isCreator: true,
          memberCount: validMemberIds.length + 1,
        });

        // Notify all members about the new room
        validMemberIds.forEach((memberId) => {
          const userSocket = Array.from(io.sockets.sockets.values()).find(
            (s) => s.userId === memberId
          );
          if (userSocket) {
            userSocket.join(`room_${room.id}`);
            userSocket.emit("room_created", {
              ...completeRoom.toJSON(),
              isCreator: false,
              memberCount: validMemberIds.length + 1,
            });
            userSocket.emit("notification", {
              type: "room_invite",
              message: `You've been added to ${room.name} by ${socket.user.name}`,
              roomId: room.id,
              timestamp: new Date().toISOString(),
            });
          }
        });

        // Send welcome message to room
        const welcomeMessage = await ChatMessage.create({
          room_id: room.id,
          sender_id: socket.userId,
          content: `🎉 Welcome to ${room.name}! ${
            validMemberIds.length > 0
              ? "Let's start chatting!"
              : "Invite some friends to join!"
          }`,
          type: "text",
        });

        // Broadcast welcome message
        io.to(`room_${room.id}`).emit("new_message", welcomeMessage);
      } catch (error) {
        console.error("Error creating room:", error);
        socket.emit("error", {
          message: "Error creating room",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      console.log(`User ${socket.user.name} disconnected`);

      // Remove from active users
      activeUsers.delete(socket.userId);

      // Clear group chat typing indicators
      typingUsers.forEach((users, roomId) => {
        if (users.has(socket.userId)) {
          users.delete(socket.userId);
          socket.to(`room_${roomId}`).emit("user_stop_typing", {
            userId: socket.userId,
            roomId,
          });
        }
      });

      // Clear private conversation typing indicators
      try {
        const userConversations = await PrivateConversation.findAll({
          where: {
            [require("sequelize").Op.or]: [
              { participant1_id: socket.userId },
              { participant2_id: socket.userId },
            ],
          },
          attributes: ["id"],
        });

        userConversations.forEach(({ id }) => {
          const conversationRoomId = `private_conversation_${id}`;
          socket.to(conversationRoomId).emit("private_user_stop_typing", {
            userId: socket.userId,
            conversationId: id,
          });
        });
      } catch (error) {
        console.error(
          "Error cleaning up private conversation typing indicators:",
          error
        );
      }

      // Update user offline status
      User.update(
        { is_online: false, last_seen_at: new Date() },
        { where: { id: socket.userId } }
      );

      // Notify others that user is offline
      socket.broadcast.emit("user_offline", {
        userId: socket.userId,
        username: socket.user.name,
      });
    });
  });
};

// Helper function to join user to their group chat rooms
const joinUserRooms = async (socket) => {
  try {
    const userRooms = await ChatRoomMember.findAll({
      where: { user_id: socket.userId },
      attributes: ["room_id"],
    });

    userRooms.forEach(({ room_id }) => {
      socket.join(`room_${room_id}`);
    });
  } catch (error) {
    console.error("Error joining user rooms:", error);
  }
};

// Helper function to join user to their private conversation rooms
const joinUserPrivateConversations = async (socket) => {
  try {
    const userConversations = await PrivateConversation.findAll({
      where: {
        [require("sequelize").Op.or]: [
          { participant1_id: socket.userId },
          { participant2_id: socket.userId },
        ],
      },
      attributes: ["id"],
    });

    userConversations.forEach(({ id }) => {
      const conversationRoomId = `private_conversation_${id}`;
      socket.join(conversationRoomId);
      console.log(
        `✅ User ${socket.user.name} joined private conversation room ${conversationRoomId}`
      );
    });
  } catch (error) {
    console.error("Error joining user private conversations:", error);
  }
};

// Helper function to clear typing indicator
const clearTyping = (socket, roomId) => {
  if (typingUsers.has(roomId)) {
    const roomTypingUsers = typingUsers.get(roomId);
    if (roomTypingUsers.has(socket.userId)) {
      roomTypingUsers.delete(socket.userId);
      socket.to(`room_${roomId}`).emit("user_stop_typing", {
        userId: socket.userId,
        roomId,
      });
    }
  }
};

// Get active users
const getActiveUsers = () => {
  return Array.from(activeUsers.values()).map(({ user, lastSeen }) => ({
    id: user.id,
    username: user.name,
    lastSeen,
  }));
};

module.exports = {
  handleConnection,
  getActiveUsers,
};
