const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true, // NULL for OAuth users
    },
    avatar_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM("user", "creator", "admin"),
      defaultValue: "user",
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    is_online: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    last_seen_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    subscription_status: {
      type: DataTypes.ENUM("free", "premium"),
      defaultValue: "free",
      allowNull: false,
    },
    subscription_end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["email"],
      },
      {
        fields: ["role"],
      },
      {
        fields: ["is_active"],
      },
      {
        fields: ["subscription_status"],
      },
    ],
  }
);

// Instance methods
User.prototype.getDisplayName = function () {
  return this.name;
};

User.prototype.toJSON = function () {
  const values = { ...this.get() };
  // Exclude sensitive fields
  delete values.password;
  return values;
};

User.prototype.isPremium = function () {
  return (
    this.subscription_status === "premium" &&
    (!this.subscription_end_date ||
      new Date(this.subscription_end_date) > new Date())
  );
};

// Class methods
User.findByEmail = function (email) {
  return this.findOne({ where: { email } });
};

User.findActiveUsers = function () {
  return this.findAll({ where: { is_active: true } });
};

User.findCreators = function () {
  return this.findAll({
    where: {
      role: "creator",
      is_active: true,
    },
  });
};

User.findOnlineUsers = function () {
  return this.findAll({
    where: {
      is_online: true,
      is_active: true,
    },
  });
};

module.exports = User;
