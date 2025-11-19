const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const UserActivityLog = sequelize.define(
  "UserActivityLog",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    type: {
      type: DataTypes.ENUM(
        "course_started",
        "course_completed",
        "quiz_taken",
        "problem_solved",
        "badge_earned",
        "course_published"
      ),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
      },
    },
  },
  {
    tableName: "user_activity_log",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["type"] },
      { fields: ["user_id", "type"] },
    ],
  }
);

module.exports = UserActivityLog;
