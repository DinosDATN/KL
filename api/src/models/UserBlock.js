const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const UserBlock = sequelize.define('UserBlock', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  blocker_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  blocked_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  blocked_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'user_blocks',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['blocker_id', 'blocked_id'],
      name: 'unique_block'
    },
    {
      fields: ['blocker_id'],
    },
    {
      fields: ['blocked_id'],
    },
    {
      fields: ['blocked_at'],
    }
  ]
});

// Class methods
UserBlock.isBlocked = async function(blockerId, blockedId) {
  const block = await this.findOne({
    where: {
      blocker_id: blockerId,
      blocked_id: blockedId
    }
  });
  return !!block;
};

UserBlock.areBlocked = async function(userId1, userId2) {
  const block = await this.findOne({
    where: {
      [sequelize.Sequelize.Op.or]: [
        { blocker_id: userId1, blocked_id: userId2 },
        { blocker_id: userId2, blocked_id: userId1 }
      ]
    }
  });
  return !!block;
};

UserBlock.getBlockedUsers = function(blockerId) {
  return this.findAll({
    where: {
      blocker_id: blockerId
    },
    order: [['blocked_at', 'DESC']]
  });
};

UserBlock.getBlockingUsers = function(blockedId) {
  return this.findAll({
    where: {
      blocked_id: blockedId
    },
    order: [['blocked_at', 'DESC']]
  });
};

module.exports = UserBlock;
