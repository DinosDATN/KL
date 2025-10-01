const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const PrivateConversation = sequelize.define('PrivateConversation', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  participant1_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  participant2_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  last_message_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'private_messages',
      key: 'id'
    }
  },
  last_activity_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  }
}, {
  tableName: 'private_conversations',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['participant1_id', 'participant2_id'],
      name: 'unique_conversation'
    },
    {
      fields: ['participant1_id'],
    },
    {
      fields: ['participant2_id'],
    },
    {
      fields: ['last_activity_at'],
    },
    {
      fields: ['is_active'],
    }
  ]
});

// Class methods for conversation management
PrivateConversation.findConversation = function(userId1, userId2) {
  // Always store participant IDs in ascending order
  const [smallerId, largerId] = [Math.min(userId1, userId2), Math.max(userId1, userId2)];
  
  return this.findOne({
    where: {
      participant1_id: smallerId,
      participant2_id: largerId
    }
  });
};

PrivateConversation.findOrCreateConversation = async function(userId1, userId2) {
  // Always store participant IDs in ascending order
  const [smallerId, largerId] = [Math.min(userId1, userId2), Math.max(userId1, userId2)];
  
  const [conversation, created] = await this.findOrCreate({
    where: {
      participant1_id: smallerId,
      participant2_id: largerId
    },
    defaults: {
      participant1_id: smallerId,
      participant2_id: largerId,
      is_active: true
    }
  });
  
  return { conversation, created };
};

PrivateConversation.getUserConversations = function(userId, options = {}) {
  const { 
    limit = 20, 
    offset = 0, 
    includeArchived = false,
    orderBy = 'last_activity_at',
    orderDirection = 'DESC'
  } = options;

  const where = {
    [sequelize.Sequelize.Op.or]: [
      { participant1_id: userId },
      { participant2_id: userId }
    ],
    is_active: true
  };

  return this.findAndCountAll({
    where,
    order: [[orderBy, orderDirection]],
    limit,
    offset
  });
};

// Instance methods
PrivateConversation.prototype.getOtherParticipant = function(currentUserId) {
  return this.participant1_id === currentUserId ? 
    this.participant2_id : this.participant1_id;
};

PrivateConversation.prototype.updateLastActivity = async function(messageId = null) {
  this.last_activity_at = new Date();
  if (messageId) {
    this.last_message_id = messageId;
  }
  await this.save();
  return this;
};

PrivateConversation.prototype.isParticipant = function(userId) {
  return this.participant1_id === userId || this.participant2_id === userId;
};

PrivateConversation.prototype.archive = async function() {
  this.is_active = false;
  await this.save();
  return this;
};

PrivateConversation.prototype.restore = async function() {
  this.is_active = true;
  await this.save();
  return this;
};

module.exports = PrivateConversation;
