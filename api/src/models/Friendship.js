const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Friendship = sequelize.define('Friendship', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  requester_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  addressee_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'declined', 'blocked'),
    allowNull: false,
    defaultValue: 'pending',
  },
  requested_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  responded_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'friendships',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['requester_id', 'addressee_id'],
      name: 'unique_friendship'
    },
    {
      fields: ['requester_id'],
    },
    {
      fields: ['addressee_id'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['requested_at'],
    }
  ]
});

// Class methods for common queries
Friendship.findFriendship = function(userId1, userId2) {
  return this.findOne({
    where: {
      [sequelize.Sequelize.Op.or]: [
        { requester_id: userId1, addressee_id: userId2 },
        { requester_id: userId2, addressee_id: userId1 }
      ]
    }
  });
};

Friendship.findUserFriends = function(userId, status = 'accepted') {
  return this.findAll({
    where: {
      [sequelize.Sequelize.Op.or]: [
        { requester_id: userId, status },
        { addressee_id: userId, status }
      ]
    }
  });
};

Friendship.findPendingRequests = function(userId) {
  return this.findAll({
    where: {
      addressee_id: userId,
      status: 'pending'
    }
  });
};

Friendship.findSentRequests = function(userId) {
  return this.findAll({
    where: {
      requester_id: userId,
      status: 'pending'
    }
  });
};

Friendship.areFriends = async function(userId1, userId2) {
  const friendship = await this.findFriendship(userId1, userId2);
  return friendship && friendship.status === 'accepted';
};

Friendship.getFriendshipStatus = async function(userId1, userId2) {
  const friendship = await this.findFriendship(userId1, userId2);
  if (!friendship) return null;
  
  return {
    status: friendship.status,
    isRequester: friendship.requester_id === userId1,
    requestedAt: friendship.requested_at,
    respondedAt: friendship.responded_at
  };
};

// Instance methods
Friendship.prototype.accept = async function() {
  this.status = 'accepted';
  this.responded_at = new Date();
  await this.save();
  return this;
};

Friendship.prototype.decline = async function() {
  this.status = 'declined';
  this.responded_at = new Date();
  await this.save();
  return this;
};

Friendship.prototype.block = async function() {
  this.status = 'blocked';
  this.responded_at = new Date();
  await this.save();
  return this;
};

module.exports = Friendship;
