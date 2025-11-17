const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM(
      'friend_request',
      'friend_accepted',
      'friend_declined',
      'room_invite',
      'room_created',
      'message',
      'system',
      'achievement',
      'contest'
    ),
    allowNull: false,
    defaultValue: 'system'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  data: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional data related to the notification (e.g., friendship_id, room_id)'
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'idx_user_id',
      fields: ['user_id']
    },
    {
      name: 'idx_user_is_read',
      fields: ['user_id', 'is_read']
    },
    {
      name: 'idx_created_at',
      fields: ['created_at']
    }
  ]
});

// Instance methods
Notification.prototype.markAsRead = async function() {
  this.is_read = true;
  await this.save();
  return this;
};

// Static methods
Notification.createNotification = async function(userId, type, title, message, data = null) {
  return await this.create({
    user_id: userId,
    type,
    title,
    message,
    data
  });
};

Notification.getUnreadCount = async function(userId) {
  return await this.count({
    where: {
      user_id: userId,
      is_read: false
    }
  });
};

Notification.markAllAsRead = async function(userId) {
  return await this.update(
    { is_read: true },
    {
      where: {
        user_id: userId,
        is_read: false
      }
    }
  );
};

module.exports = Notification;
