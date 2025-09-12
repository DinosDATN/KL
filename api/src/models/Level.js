const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Level = sequelize.define('Level', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  level: {
    type: DataTypes.INTEGER,
    unique: true,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  xp_required: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  xp_to_next: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  color: {
    type: DataTypes.STRING(50), // Allow for longer color codes and CSS classes
    allowNull: true
  },
  icon: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'levels',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['level'] },
    { fields: ['xp_required'] }
  ]
});

// Class methods
Level.findByLevel = function(level) {
  return this.findOne({ where: { level } });
};

Level.findLevelForXp = function(xp) {
  return this.findOne({
    where: {
      xp_required: {
        [sequelize.Sequelize.Op.lte]: xp
      }
    },
    order: [['level', 'DESC']]
  });
};

Level.getAllLevels = function() {
  return this.findAll({
    order: [['level', 'ASC']]
  });
};

module.exports = Level;
