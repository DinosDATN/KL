const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const ChatRoom = sequelize.define('ChatRoom', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('course', 'global', 'group'),
    allowNull: false,
    defaultValue: 'group',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  avatar_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  unread_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  last_message_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'chat_rooms',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ChatRoom;
