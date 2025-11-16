const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const UserGameProcess = sequelize.define(
  "UserGameProcess",
  {
    id: {
      type: DataTypes.INTEGER,
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
    game_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "games",
        key: "id",
      },
    },
    level_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "game_levels",
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM("playing", "completed"),
      defaultValue: "playing",
      allowNull: false,
    },
    score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    time_spent: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0,
      },
      comment: "Time spent in seconds",
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "user_game_process",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false, // Bảng không có updated_at
    underscored: true,
    indexes: [
      {
        fields: ["user_id"],
      },
      {
        fields: ["game_id"],
      },
      {
        fields: ["level_id"],
      },
      {
        fields: ["status"],
      },
      // Removed unique constraint to allow multiple attempts per level
    ],
  }
);

// Instance methods
UserGameProcess.prototype.complete = function () {
  this.status = "completed";
  this.completed_at = new Date();
  return this.save();
};

UserGameProcess.prototype.updateScore = function (newScore) {
  this.score = Math.max(this.score, newScore);
  return this.save();
};

UserGameProcess.prototype.addTime = function (seconds) {
  this.time_spent += seconds;
  return this.save();
};

// Class methods
UserGameProcess.findByUser = function (userId) {
  return this.findAll({
    where: { user_id: userId },
    order: [["created_at", "DESC"]],
  });
};

UserGameProcess.findByUserAndGame = function (userId, gameId) {
  return this.findAll({
    where: { user_id: userId, game_id: gameId },
    order: [["created_at", "DESC"]],
  });
};

UserGameProcess.findByUserGameAndLevel = function (userId, gameId, levelId) {
  return this.findOne({
    where: { user_id: userId, game_id: gameId, level_id: levelId },
  });
};

UserGameProcess.findCompletedByUser = function (userId) {
  return this.findAll({
    where: { user_id: userId, status: "completed" },
    order: [["completed_at", "DESC"]],
  });
};

module.exports = UserGameProcess;
