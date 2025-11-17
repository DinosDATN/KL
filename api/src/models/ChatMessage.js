const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const ChatMessage = sequelize.define(
  "ChatMessage",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "chat_rooms",
        key: "id",
      },
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    time_stamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    type: {
      type: DataTypes.ENUM("text", "image", "file"),
      defaultValue: "text",
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
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    is_edited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    reply_to: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "chat_messages",
        key: "id",
      },
    },
    sent_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "chat_messages",
    timestamps: true,
    createdAt: "sent_at",
    updatedAt: "time_stamp",
  }
);

module.exports = ChatMessage;
