const { ChatRoom, ChatRoomMember, User } = require('../models');
const { validationResult } = require('express-validator');

/**
 * Chat Settings Controller
 * Handles chat room configuration, member management, and permissions
 */
class ChatSettingsController {

  /**
   * Update chat room settings
   * PUT /api/v1/chat/rooms/:id/settings
   */
  static async updateRoomSettings(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const roomId = parseInt(req.params.id);
      const userId = req.user.id;
      const {
        roomName,
        description,
        isPrivate,
        allowInvites,
        autoDeleteMessages,
        autoDeleteDays
      } = req.body;

      // Find the room
      const room = await ChatRoom.findByPk(roomId);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Chat room not found'
        });
      }

      // Check if user is admin of the room
      const membership = await ChatRoomMember.findOne({
        where: { room_id: roomId, user_id: userId }
      });

      const isAdmin = membership?.is_admin || room.created_by === userId;
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only room administrators can update settings'
        });
      }

      // Update room settings
      const updates = {};
      if (roomName !== undefined) updates.name = roomName;
      if (description !== undefined) updates.description = description;
      if (isPrivate !== undefined) updates.type = isPrivate ? 'private' : 'group';
      if (allowInvites !== undefined) updates.allow_invites = allowInvites;
      if (autoDeleteMessages !== undefined) updates.auto_delete_messages = autoDeleteMessages;
      if (autoDeleteDays !== undefined) updates.auto_delete_days = autoDeleteDays;

      await room.update(updates);

      // Fetch updated room with associations
      const updatedRoom = await ChatRoom.findByPk(roomId, {
        include: [
          {
            model: User,
            as: 'Creator',
            attributes: ['id', 'name', 'email', 'avatar_url']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Room settings updated successfully',
        data: updatedRoom
      });

    } catch (error) {
      console.error('Error updating room settings:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Add member to chat room
   * POST /api/v1/chat/rooms/:id/members
   */
  static async addMember(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const roomId = parseInt(req.params.id);
      const userId = req.user.id;
      const { userId: newMemberId } = req.body;

      // Find the room
      const room = await ChatRoom.findByPk(roomId);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Chat room not found'
        });
      }

      // Check if requesting user is admin
      const membership = await ChatRoomMember.findOne({
        where: { room_id: roomId, user_id: userId }
      });

      const isAdmin = membership?.is_admin || room.created_by === userId;
      if (!isAdmin && !room.allow_invites) {
        return res.status(403).json({
          success: false,
          message: 'Only room administrators can add members'
        });
      }

      // Check if new member exists
      const newMember = await User.findByPk(newMemberId);
      if (!newMember) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user is already a member
      const existingMembership = await ChatRoomMember.findOne({
        where: { room_id: roomId, user_id: newMemberId }
      });

      if (existingMembership) {
        return res.status(409).json({
          success: false,
          message: 'User is already a member of this room'
        });
      }

      // Add member
      await ChatRoomMember.create({
        room_id: roomId,
        user_id: newMemberId,
        is_admin: false,
        joined_at: new Date()
      });

      // Return the new member's data
      const memberData = await User.findByPk(newMemberId, {
        attributes: ['id', 'name', 'email', 'avatar_url', 'is_online']
      });

      res.json({
        success: true,
        message: 'Member added successfully',
        data: memberData
      });

    } catch (error) {
      console.error('Error adding member:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Remove member from chat room
   * DELETE /api/v1/chat/rooms/:id/members/:userId
   */
  static async removeMember(req, res) {
    try {
      const roomId = parseInt(req.params.id);
      const memberUserId = parseInt(req.params.userId);
      const requesterId = req.user.id;

      // Find the room
      const room = await ChatRoom.findByPk(roomId);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Chat room not found'
        });
      }

      // Can't remove room creator
      if (room.created_by === memberUserId) {
        return res.status(403).json({
          success: false,
          message: 'Cannot remove room creator'
        });
      }

      // Check if requesting user is admin or removing themselves
      const requesterMembership = await ChatRoomMember.findOne({
        where: { room_id: roomId, user_id: requesterId }
      });

      const isAdmin = requesterMembership?.is_admin || room.created_by === requesterId;
      const isSelf = requesterId === memberUserId;

      if (!isAdmin && !isSelf) {
        return res.status(403).json({
          success: false,
          message: 'Only room administrators can remove members'
        });
      }

      // Find and remove membership
      const membership = await ChatRoomMember.findOne({
        where: { room_id: roomId, user_id: memberUserId }
      });

      if (!membership) {
        return res.status(404).json({
          success: false,
          message: 'User is not a member of this room'
        });
      }

      await membership.destroy();

      res.json({
        success: true,
        message: 'Member removed successfully'
      });

    } catch (error) {
      console.error('Error removing member:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Update member role (promote/demote admin)
   * PUT /api/v1/chat/rooms/:id/members/:userId/role
   */
  static async updateMemberRole(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const roomId = parseInt(req.params.id);
      const memberUserId = parseInt(req.params.userId);
      const requesterId = req.user.id;
      const { isAdmin } = req.body;

      // Find the room
      const room = await ChatRoom.findByPk(roomId);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Chat room not found'
        });
      }

      // Only room creator can change admin roles
      if (room.created_by !== requesterId) {
        return res.status(403).json({
          success: false,
          message: 'Only room creator can change member roles'
        });
      }

      // Can't change role of room creator
      if (room.created_by === memberUserId) {
        return res.status(403).json({
          success: false,
          message: 'Cannot change room creator role'
        });
      }

      // Find membership
      const membership = await ChatRoomMember.findOne({
        where: { room_id: roomId, user_id: memberUserId }
      });

      if (!membership) {
        return res.status(404).json({
          success: false,
          message: 'User is not a member of this room'
        });
      }

      // Update role
      await membership.update({ is_admin: isAdmin });

      res.json({
        success: true,
        message: `Member ${isAdmin ? 'promoted to' : 'demoted from'} admin successfully`
      });

    } catch (error) {
      console.error('Error updating member role:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Delete chat room
   * DELETE /api/v1/chat/rooms/:id
   */
  static async deleteRoom(req, res) {
    try {
      const roomId = parseInt(req.params.id);
      const userId = req.user.id;

      // Find the room
      const room = await ChatRoom.findByPk(roomId);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Chat room not found'
        });
      }

      // Only room creator can delete room
      if (room.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Only room creator can delete room'
        });
      }

      // Delete room (cascade will handle members and messages)
      await room.destroy();

      res.json({
        success: true,
        message: 'Room deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting room:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Leave chat room
   * POST /api/v1/chat/rooms/:id/leave
   */
  static async leaveRoom(req, res) {
    try {
      const roomId = parseInt(req.params.id);
      const userId = req.user.id;

      // Find the room
      const room = await ChatRoom.findByPk(roomId);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Chat room not found'
        });
      }

      // Room creator cannot leave (must delete room instead)
      if (room.created_by === userId) {
        return res.status(403).json({
          success: false,
          message: 'Room creator cannot leave room. Delete room instead.'
        });
      }

      // Find membership
      const membership = await ChatRoomMember.findOne({
        where: { room_id: roomId, user_id: userId }
      });

      if (!membership) {
        return res.status(404).json({
          success: false,
          message: 'You are not a member of this room'
        });
      }

      // Remove membership
      await membership.destroy();

      res.json({
        success: true,
        message: 'Left room successfully'
      });

    } catch (error) {
      console.error('Error leaving room:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get room settings (for admins)
   * GET /api/v1/chat/rooms/:id/settings
   */
  static async getRoomSettings(req, res) {
    try {
      const roomId = parseInt(req.params.id);
      const userId = req.user.id;

      // Find the room
      const room = await ChatRoom.findByPk(roomId, {
        include: [
          {
            model: User,
            as: 'Creator',
            attributes: ['id', 'name', 'email', 'avatar_url']
          }
        ]
      });

      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Chat room not found'
        });
      }

      // Check if user is member
      const membership = await ChatRoomMember.findOne({
        where: { room_id: roomId, user_id: userId }
      });

      if (!membership && room.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Return room settings
      const settings = {
        id: room.id,
        name: room.name,
        description: room.description,
        type: room.type,
        isPrivate: room.type === 'private',
        allowInvites: room.allow_invites || false,
        autoDeleteMessages: room.auto_delete_messages || false,
        autoDeleteDays: room.auto_delete_days || 30,
        createdBy: room.created_by,
        createdAt: room.created_at,
        Creator: room.Creator,
        isAdmin: membership?.is_admin || room.created_by === userId
      };

      res.json({
        success: true,
        data: settings
      });

    } catch (error) {
      console.error('Error getting room settings:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Search users for adding to room
   * GET /api/v1/chat/users/search?q=searchTerm
   */
  static async searchUsers(req, res) {
    try {
      const { q: searchTerm } = req.query;

      if (!searchTerm || searchTerm.length < 2) {
        return res.json({
          success: true,
          data: []
        });
      }

      const users = await User.findAll({
        where: {
          [require('sequelize').Op.or]: [
            {
              name: {
                [require('sequelize').Op.like]: `%${searchTerm}%`
              }
            },
            {
              email: {
                [require('sequelize').Op.like]: `%${searchTerm}%`
              }
            }
          ],
          is_active: true
        },
        attributes: ['id', 'name', 'email', 'avatar_url', 'is_online'],
        limit: 50,
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: users
      });

    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get online users
   * GET /api/v1/chat/users/online
   */
  static async getOnlineUsers(req, res) {
    try {
      const users = await User.findAll({
        where: {
          is_online: true,
          is_active: true
        },
        attributes: ['id', 'name', 'email', 'avatar_url', 'last_seen_at'],
        order: [['name', 'ASC']],
        limit: 100
      });

      res.json({
        success: true,
        data: users
      });

    } catch (error) {
      console.error('Error getting online users:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = ChatSettingsController;
