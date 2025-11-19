const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");
const bcrypt = require("bcrypt");

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
      validate: {
        len: {
          args: [6, 255],
          msg: "Password must be between 6 and 255 characters long",
        },
      },
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
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const saltRounds = 12;
          user.password = await bcrypt.hash(user.password, saltRounds);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password") && user.password) {
          const saltRounds = 12;
          user.password = await bcrypt.hash(user.password, saltRounds);
        }
      },
    },
  }
);

// Instance methods
User.prototype.getDisplayName = function () {
  return this.name;
};

// Password validation method
User.prototype.validatePassword = async function (candidatePassword) {
  if (!this.password) {
    throw new Error("User has no password set");
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function () {
  const values = { ...this.get() };
  // Exclude sensitive fields from JSON output
  delete values.password;
  return values;
};

// Method to get safe user data for auth responses
User.prototype.toAuthJSON = function () {
  return {
    id: this.id,
    name: this.name,
    email: this.email,
    avatar_url: this.avatar_url,
    role: this.role,
    subscription_status: this.subscription_status,
    is_active: this.is_active,
    is_online: this.is_online,
    last_seen_at: this.last_seen_at,
  };
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
