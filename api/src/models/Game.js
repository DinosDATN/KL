const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const Game = sequelize.define(
  "Game",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "games",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["name"],
      },
    ],
  }
);

// Class methods
Game.findByName = function (name) {
  return this.findOne({ where: { name } });
};

Game.findAllActive = function () {
  return this.findAll({
    order: [["created_at", "DESC"]],
  });
};

module.exports = Game;
