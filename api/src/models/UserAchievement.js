const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const UserAchievement = sequelize.define(
  "UserAchievement",
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
    achievement_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "achievements",
        key: "id",
      },
    },
    date_earned: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    tableName: "user_achievements",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["achievement_id"] },
      { unique: true, fields: ["user_id", "achievement_id"] },
    ],
  }
);

module.exports = UserAchievement;
