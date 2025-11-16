const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const GameLevel = sequelize.define(
  "GameLevel",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    game_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "games",
        key: "id",
      },
    },
    level_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    difficulty: {
      type: DataTypes.ENUM("easy", "medium", "hard"),
      defaultValue: "easy",
      allowNull: false,
    },
  },
  {
    tableName: "game_levels",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false, // Bảng không có updated_at
    underscored: true,
    indexes: [
      {
        fields: ["game_id"],
      },
      {
        fields: ["difficulty"],
      },
      {
        unique: true,
        fields: ["game_id", "level_number"],
      },
    ],
  }
);

// Class methods
GameLevel.findByGame = function (gameId) {
  return this.findAll({
    where: { game_id: gameId },
    order: [["level_number", "ASC"]],
  });
};

GameLevel.findByGameAndDifficulty = function (gameId, difficulty) {
  return this.findAll({
    where: { game_id: gameId, difficulty },
    order: [["level_number", "ASC"]],
  });
};

GameLevel.findByGameAndLevel = function (gameId, levelNumber) {
  return this.findOne({
    where: { game_id: gameId, level_number: levelNumber },
  });
};

module.exports = GameLevel;
