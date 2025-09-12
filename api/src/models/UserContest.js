const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const UserContest = sequelize.define('UserContest', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  contest_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'contests',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  joined_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_contests',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['contest_id', 'user_id']
    },
    {
      fields: ['contest_id']
    },
    {
      fields: ['user_id']
    }
  ]
});

module.exports = UserContest;
