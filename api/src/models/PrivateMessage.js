const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const PrivateMessage = sequelize.define('PrivateMessage', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  conversation_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'private_conversations',
      key: 'id'
    }
  },
  sender_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  receiver_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  message_type: {
    type: DataTypes.ENUM('text', 'image', 'file', 'voice', 'video'),
    allowNull: false,
    defaultValue: 'text',
  },
  file_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  reply_to_message_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'private_messages',
      key: 'id'
    }
  },
  is_edited: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  edited_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'private_messages',
  timestamps: true,
  underscored: true,
  createdAt: 'sent_at',
  indexes: [
    {
      fields: ['conversation_id'],
    },
    {
      fields: ['sender_id'],
    },
    {
      fields: ['receiver_id'],
    },
    {
      fields: ['sent_at'],
    },
    {
      fields: ['is_deleted'],
    },
    {
      fields: ['message_type'],
    }
  ]
});

// Class methods
PrivateMessage.getConversationMessages = function(conversationId, options = {}) {
  const {
    limit = 50,
    offset = 0,
    includeDeleted = false,
    orderDirection = 'DESC'
  } = options;

  const where = {
    conversation_id: conversationId
  };

  if (!includeDeleted) {
    where.is_deleted = false;
  }

  return this.findAndCountAll({
    where,
    order: [['sent_at', orderDirection]],
    limit,
    offset
  });
};

PrivateMessage.getUnreadCount = function(conversationId, userId) {
  return this.count({
    where: {
      conversation_id: conversationId,
      receiver_id: userId,
      is_deleted: false
    },
    include: [{
      model: sequelize.models.PrivateMessageStatus,
      as: 'MessageStatus',
      where: {
        user_id: userId,
        status: ['sent', 'delivered']
      },
      required: false
    }]
  });
};

// Instance methods
PrivateMessage.prototype.markAsEdited = async function(newContent) {
  this.content = newContent;
  this.is_edited = true;
  this.edited_at = new Date();
  await this.save();
  return this;
};

PrivateMessage.prototype.softDelete = async function() {
  this.is_deleted = true;
  this.deleted_at = new Date();
  await this.save();
  return this;
};

PrivateMessage.prototype.restore = async function() {
  this.is_deleted = false;
  this.deleted_at = null;
  await this.save();
  return this;
};

PrivateMessage.prototype.isFileMessage = function() {
  return ['image', 'file', 'voice', 'video'].includes(this.message_type);
};

PrivateMessage.prototype.canBeEditedBy = function(userId) {
  return this.sender_id === userId && !this.is_deleted && !this.isFileMessage();
};

PrivateMessage.prototype.canBeDeletedBy = function(userId) {
  return this.sender_id === userId && !this.is_deleted;
};

module.exports = PrivateMessage;
