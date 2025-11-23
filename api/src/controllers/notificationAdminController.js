const { Notification, User } = require('../models');
const { Op } = require('sequelize');

class NotificationAdminController {
  // Get all notifications across all users (admin view)
  async getAllNotifications(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const {
        user_id,
        type,
        is_read,
        search,
        start_date,
        end_date,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      // Build where clause
      const whereClause = {};

      if (user_id) {
        whereClause.user_id = user_id;
      }

      if (type) {
        whereClause.type = type;
      }

      if (is_read !== undefined) {
        whereClause.is_read = is_read === 'true';
      }

      // Date range filtering
      if (start_date || end_date) {
        whereClause.created_at = {};
        if (start_date) {
          whereClause.created_at[Op.gte] = new Date(start_date);
        }
        if (end_date) {
          whereClause.created_at[Op.lte] = new Date(end_date);
        }
      }

      // Search functionality (search in title and message)
      if (search && search.trim()) {
        const searchTerm = search.trim();
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${searchTerm}%` } },
          { message: { [Op.like]: `%${searchTerm}%` } }
        ];
      }

      // Validate sortBy
      const allowedSortFields = ['created_at', 'updated_at', 'is_read', 'type'];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
      const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const notifications = await Notification.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'name', 'email', 'avatar_url'],
            required: false
          }
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [[sortField, sortDirection]],
      });

      res.json({
        success: true,
        data: {
          notifications: notifications.rows,
          totalCount: notifications.count,
          currentPage: page,
          totalPages: Math.ceil(notifications.count / limit),
          itemsPerPage: parseInt(limit),
        },
      });
    } catch (error) {
      console.error('Error fetching all notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching notifications',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Get notification statistics
  async getNotificationStatistics(req, res) {
    try {
      const { start_date, end_date } = req.query;

      const whereClause = {};
      if (start_date || end_date) {
        whereClause.created_at = {};
        if (start_date) {
          whereClause.created_at[Op.gte] = new Date(start_date);
        }
        if (end_date) {
          whereClause.created_at[Op.lte] = new Date(end_date);
        }
      }

      const [
        totalNotifications,
        unreadNotifications,
        readNotifications,
        notificationsByType,
        recentNotifications
      ] = await Promise.all([
        Notification.count({ where: whereClause }),
        Notification.count({ where: { ...whereClause, is_read: false } }),
        Notification.count({ where: { ...whereClause, is_read: true } }),
        Notification.findAll({
          where: whereClause,
          attributes: [
            'type',
            [Notification.sequelize.fn('COUNT', Notification.sequelize.col('id')), 'count']
          ],
          group: ['type'],
          raw: true,
        }),
        Notification.findAll({
          where: whereClause,
          limit: 10,
          order: [['created_at', 'DESC']],
          include: [
            {
              model: User,
              as: 'User',
              attributes: ['id', 'name', 'email'],
              required: false
            }
          ]
        })
      ]);

      // Calculate read rate
      const readRate = totalNotifications > 0 
        ? ((readNotifications / totalNotifications) * 100).toFixed(2)
        : 0;

      res.json({
        success: true,
        data: {
          totalNotifications,
          unreadNotifications,
          readNotifications,
          readRate: parseFloat(readRate),
          notificationsByType: notificationsByType.map(item => ({
            type: item.type,
            count: parseInt(item.count)
          })),
          recentNotifications
        },
      });
    } catch (error) {
      console.error('Error fetching notification statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching notification statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Send notification to specific user(s)
  async sendNotification(req, res) {
    try {
      const { user_ids, type, title, message, data } = req.body;

      // Validate required fields
      if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'user_ids is required and must be a non-empty array',
        });
      }

      if (!title || !message) {
        return res.status(400).json({
          success: false,
          message: 'title and message are required',
        });
      }

      // Validate type
      const allowedTypes = [
        'friend_request',
        'friend_accepted',
        'friend_declined',
        'room_invite',
        'room_created',
        'message',
        'system',
        'achievement',
        'contest'
      ];
      const notificationType = type || 'system';

      if (!allowedTypes.includes(notificationType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid type. Allowed types: ${allowedTypes.join(', ')}`,
        });
      }

      // Verify all users exist
      const users = await User.findAll({
        where: {
          id: {
            [Op.in]: user_ids
          }
        },
        attributes: ['id', 'name', 'email']
      });

      if (users.length !== user_ids.length) {
        return res.status(400).json({
          success: false,
          message: 'Some user IDs are invalid',
        });
      }

      // Create notifications for all users
      const notifications = await Promise.all(
        user_ids.map(userId =>
          Notification.create({
            user_id: userId,
            type: notificationType,
            title,
            message,
            data: data || null,
            is_read: false,
          })
        )
      );

      // Emit socket events for real-time notifications (if socket.io is available)
      if (req.io) {
        notifications.forEach(notification => {
          req.io.to(`user_${notification.user_id}`).emit('notification', {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            is_read: notification.is_read,
            created_at: notification.created_at,
          });
        });
      }

      res.json({
        success: true,
        message: `Notifications sent to ${notifications.length} user(s)`,
        data: {
          notifications: notifications,
          count: notifications.length,
        },
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).json({
        success: false,
        message: 'Error sending notification',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Send notification to all users
  async sendBroadcastNotification(req, res) {
    try {
      const { type, title, message, data, user_filter } = req.body;

      if (!title || !message) {
        return res.status(400).json({
          success: false,
          message: 'title and message are required',
        });
      }

      const notificationType = type || 'system';

      // Build user filter
      const userWhereClause = {};
      if (user_filter) {
        if (user_filter.role) {
          userWhereClause.role = user_filter.role;
        }
        if (user_filter.is_active !== undefined) {
          userWhereClause.is_active = user_filter.is_active;
        }
        if (user_filter.subscription_status) {
          userWhereClause.subscription_status = user_filter.subscription_status;
        }
      }

      // Get all users matching the filter
      const users = await User.findAll({
        where: userWhereClause,
        attributes: ['id']
      });

      if (users.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No users found matching the filter criteria',
        });
      }

      const user_ids = users.map(user => user.id);

      // Create notifications for all users
      const notifications = await Promise.all(
        user_ids.map(userId =>
          Notification.create({
            user_id: userId,
            type: notificationType,
            title,
            message,
            data: data || null,
            is_read: false,
          })
        )
      );

      // Emit socket events for real-time notifications
      if (req.io) {
        notifications.forEach(notification => {
          req.io.to(`user_${notification.user_id}`).emit('notification', {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            is_read: notification.is_read,
            created_at: notification.created_at,
          });
        });
      }

      res.json({
        success: true,
        message: `Broadcast notification sent to ${notifications.length} user(s)`,
        data: {
          count: notifications.length,
          userFilter: user_filter || 'all users',
        },
      });
    } catch (error) {
      console.error('Error sending broadcast notification:', error);
      res.status(500).json({
        success: false,
        message: 'Error sending broadcast notification',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Get notification by ID
  async getNotificationById(req, res) {
    try {
      const { notificationId } = req.params;

      const notification = await Notification.findByPk(notificationId, {
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'name', 'email', 'avatar_url'],
            required: false
          }
        ]
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found',
        });
      }

      res.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      console.error('Error fetching notification:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching notification',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Delete notification
  async deleteNotification(req, res) {
    try {
      const { notificationId } = req.params;

      const notification = await Notification.findByPk(notificationId);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found',
        });
      }

      await notification.destroy();

      res.json({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting notification',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Bulk delete notifications
  async bulkDeleteNotifications(req, res) {
    try {
      const { notification_ids } = req.body;

      if (!notification_ids || !Array.isArray(notification_ids) || notification_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'notification_ids is required and must be a non-empty array',
        });
      }

      const deletedCount = await Notification.destroy({
        where: {
          id: {
            [Op.in]: notification_ids
          }
        }
      });

      res.json({
        success: true,
        message: `${deletedCount} notification(s) deleted successfully`,
        data: {
          deletedCount,
          requestedCount: notification_ids.length,
        },
      });
    } catch (error) {
      console.error('Error bulk deleting notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Error bulk deleting notifications',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Mark notification as read/unread
  async updateNotificationStatus(req, res) {
    try {
      const { notificationId } = req.params;
      const { is_read } = req.body;

      if (typeof is_read !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'is_read must be a boolean value',
        });
      }

      const notification = await Notification.findByPk(notificationId);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found',
        });
      }

      notification.is_read = is_read;
      await notification.save();

      res.json({
        success: true,
        message: `Notification marked as ${is_read ? 'read' : 'unread'}`,
        data: notification,
      });
    } catch (error) {
      console.error('Error updating notification status:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating notification status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

module.exports = new NotificationAdminController();

