const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Contest = sequelize.define('Contest', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Title cannot be empty'
      },
      len: {
        args: [3, 255],
        msg: 'Title must be between 3 and 255 characters'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: {
        msg: 'Start time must be a valid date'
      },
      isAfter: {
        args: new Date().toISOString(),
        msg: 'Start time must be in the future'
      }
    }
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: {
        msg: 'End time must be a valid date'
      },
      isAfterStartTime(value) {
        if (value <= this.start_time) {
          throw new Error('End time must be after start time');
        }
      }
    }
  },
  created_by: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'contests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['start_time']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['start_time', 'end_time']
    }
  ],
  scopes: {
    active: {
      where: {
        start_time: {
          [sequelize.Sequelize.Op.lte]: new Date()
        },
        end_time: {
          [sequelize.Sequelize.Op.gt]: new Date()
        }
      }
    },
    upcoming: {
      where: {
        start_time: {
          [sequelize.Sequelize.Op.gt]: new Date()
        }
      },
      order: [['start_time', 'ASC']]
    },
    past: {
      where: {
        end_time: {
          [sequelize.Sequelize.Op.lt]: new Date()
        }
      },
      order: [['end_time', 'DESC']]
    }
  }
});

// Virtual fields
Contest.prototype.getStatus = function() {
  const now = new Date();
  if (now < this.start_time) {
    return 'upcoming';
  } else if (now >= this.start_time && now <= this.end_time) {
    return 'active';
  } else {
    return 'completed';
  }
};

Contest.prototype.getDuration = function() {
  return Math.floor((this.end_time - this.start_time) / (1000 * 60)); // Duration in minutes
};

Contest.prototype.getTimeRemaining = function() {
  const now = new Date();
  if (this.getStatus() === 'completed') {
    return 0;
  }
  const targetTime = this.getStatus() === 'upcoming' ? this.start_time : this.end_time;
  return Math.max(0, Math.floor((targetTime - now) / (1000 * 60))); // Time in minutes
};

// Static methods
Contest.findActive = function() {
  return this.scope('active').findAll({
    order: [['start_time', 'ASC']]
  });
};

Contest.findUpcoming = function() {
  return this.scope('upcoming').findAll();
};

Contest.findPast = function() {
  return this.scope('past').findAll();
};

module.exports = Contest;
