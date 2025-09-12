const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const ChatRoomMember = sequelize.define('ChatRoomMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  room_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'chat_rooms',
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
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  is_admin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'chat_room_members',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['room_id', 'user_id']
    }
  ]
});

module.exports = ChatRoomMember;
