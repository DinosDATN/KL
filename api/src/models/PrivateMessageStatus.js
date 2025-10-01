const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const PrivateMessageStatus = sequelize.define('PrivateMessageStatus', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  message_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'private_messages',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('sent', 'delivered', 'read'),
    allowNull: false,
    defaultValue: 'sent',
  },
  status_updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'private_message_status',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['message_id', 'user_id'],
      name: 'unique_message_user_status'
    },
    {
      fields: ['message_id'],
    },
    {
      fields: ['user_id'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['status_updated_at'],
    }
  ]
});

// Class methods
PrivateMessageStatus.updateStatus = async function(messageId, userId, newStatus) {
  const [statusRecord, created] = await this.findOrCreate({
    where: {
      message_id: messageId,
      user_id: userId
    },
    defaults: {
      message_id: messageId,
      user_id: userId,
      status: newStatus,
      status_updated_at: new Date()
    }
  });

  if (!created && statusRecord.status !== newStatus) {
    statusRecord.status = newStatus;
    statusRecord.status_updated_at = new Date();
    await statusRecord.save();
  }

  return statusRecord;
};

PrivateMessageStatus.markAsDelivered = function(messageId, userId) {
  return this.updateStatus(messageId, userId, 'delivered');
};

PrivateMessageStatus.markAsRead = function(messageId, userId) {
  return this.updateStatus(messageId, userId, 'read');
};

PrivateMessageStatus.markMultipleAsRead = async function(messageIds, userId) {
  const promises = messageIds.map(messageId => 
    this.updateStatus(messageId, userId, 'read')
  );
  return Promise.all(promises);
};

PrivateMessageStatus.getUnreadMessages = function(userId, conversationId = null) {
  const where = {
    user_id: userId,
    status: ['sent', 'delivered']
  };

  const include = [{
    model: sequelize.models.PrivateMessage,
    as: 'Message',
    where: {
      is_deleted: false
    }
  }];

  if (conversationId) {
    include[0].where.conversation_id = conversationId;
  }

  return this.findAll({
    where,
    include,
    order: [['status_updated_at', 'DESC']]
  });
};

PrivateMessageStatus.getConversationReadStatus = function(conversationId, userId) {
  return this.findAll({
    where: {
      user_id: userId
    },
    include: [{
      model: sequelize.models.PrivateMessage,
      as: 'Message',
      where: {
        conversation_id: conversationId,
        is_deleted: false
      }
    }],
    order: [[sequelize.models.PrivateMessage, 'sent_at', 'DESC']]
  });
};

// Instance methods
PrivateMessageStatus.prototype.updateToStatus = async function(newStatus) {
  if (this.status !== newStatus) {
    this.status = newStatus;
    this.status_updated_at = new Date();
    await this.save();
  }
  return this;
};

module.exports = PrivateMessageStatus;
