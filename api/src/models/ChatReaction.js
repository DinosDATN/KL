const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const ChatReaction = sequelize.define('ChatReaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  message_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'chat_messages',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  reaction_type: {
    type: DataTypes.ENUM('like', 'love', 'laugh', 'sad', 'angry'),
    allowNull: false,
  },
  reacted_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'chat_reactions',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['message_id', 'user_id']
    }
  ]
});

module.exports = ChatReaction;
