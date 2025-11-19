const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const UserGoal = sequelize.define(
  "UserGoal",
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    target: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    current: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    deadline: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM("learning", "practice", "achievement"),
      allowNull: false,
    },
  },
  {
    tableName: "user_goals",
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ["user_id"] }, { fields: ["category"] }],
  }
);

module.exports = UserGoal;
