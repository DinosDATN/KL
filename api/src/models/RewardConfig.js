const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const RewardConfig = sequelize.define('RewardConfig', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  config_key: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false,
  },
  config_value: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'reward_config',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['config_key'] },
    { fields: ['is_active'] }
  ]
});

// Cache for config values
let configCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Static methods
RewardConfig.getConfig = async function(key) {
  const config = await this.findOne({
    where: {
      config_key: key,
      is_active: true
    }
  });
  
  return config ? config.config_value : null;
};

RewardConfig.getAllConfigs = async function(useCache = true) {
  const now = Date.now();
  
  // Return cached data if valid
  if (useCache && configCache && cacheTimestamp && (now - cacheTimestamp < CACHE_TTL)) {
    return configCache;
  }

  const configs = await this.findAll({
    where: { is_active: true }
  });

  const configMap = {};
  configs.forEach(config => {
    configMap[config.config_key] = config.config_value;
  });

  // Update cache
  configCache = configMap;
  cacheTimestamp = now;

  return configMap;
};

RewardConfig.updateConfig = async function(key, value) {
  const config = await this.findOne({ where: { config_key: key } });
  
  if (config) {
    await config.update({ config_value: value });
  } else {
    await this.create({ config_key: key, config_value: value });
  }

  // Invalidate cache
  configCache = null;
  cacheTimestamp = null;

  return config;
};

RewardConfig.clearCache = function() {
  configCache = null;
  cacheTimestamp = null;
};

module.exports = RewardConfig;
