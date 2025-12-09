const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const CreatorBankAccount = sequelize.define('CreatorBankAccount', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  bank_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  account_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  account_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  branch: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'creator_bank_accounts',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'], unique: true },
    { fields: ['is_verified'] },
    { fields: ['is_active'] }
  ]
});

// Instance methods
CreatorBankAccount.prototype.toJSON = function() {
  const values = { ...this.get() };
  // Mask account number for security (show only last 4 digits)
  if (values.account_number && values.account_number.length > 4) {
    const lastFour = values.account_number.slice(-4);
    values.account_number_masked = '*'.repeat(values.account_number.length - 4) + lastFour;
  }
  return values;
};

CreatorBankAccount.prototype.getFullInfo = function() {
  return {
    id: this.id,
    bank_name: this.bank_name,
    account_number: this.account_number,
    account_name: this.account_name,
    branch: this.branch,
    is_verified: this.is_verified,
    is_active: this.is_active
  };
};

// Class methods
CreatorBankAccount.findByUserId = function(userId) {
  return this.findOne({ where: { user_id: userId, is_active: true } });
};

CreatorBankAccount.findVerified = function() {
  return this.findAll({ 
    where: { 
      is_verified: true,
      is_active: true 
    } 
  });
};

module.exports = CreatorBankAccount;
