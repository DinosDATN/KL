const { Op } = require('sequelize');

/**
 * Database Query Validation Utilities
 * Prevents undefined values and provides safe query operations
 */

class DatabaseValidator {
  /**
   * Validate that a value is safe for database operations
   * @param {any} value - Value to validate
   * @param {string} fieldName - Name of the field (for error messages)
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  static validateValue(value, fieldName = 'field', options = {}) {
    const { 
      allowNull = false, 
      allowEmpty = false, 
      type = 'any',
      min = null,
      max = null 
    } = options;

    const result = {
      valid: false,
      value: null,
      error: null,
      sanitized: false
    };

    // Check for undefined
    if (value === undefined) {
      result.error = `${fieldName} cannot be undefined`;
      return result;
    }

    // Check for null
    if (value === null) {
      if (allowNull) {
        result.valid = true;
        result.value = null;
        return result;
      } else {
        result.error = `${fieldName} cannot be null`;
        return result;
      }
    }

    // Check for empty strings
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '' && !allowEmpty) {
        result.error = `${fieldName} cannot be empty`;
        return result;
      }
      result.value = trimmed;
      result.sanitized = trimmed !== value;
    } else {
      result.value = value;
    }

    // Type validation
    switch (type) {
      case 'number':
      case 'id':
        const num = Number(result.value);
        if (isNaN(num)) {
          result.error = `${fieldName} must be a valid number`;
          return result;
        }
        if (type === 'id' && num <= 0) {
          result.error = `${fieldName} must be a positive number`;
          return result;
        }
        if (min !== null && num < min) {
          result.error = `${fieldName} must be at least ${min}`;
          return result;
        }
        if (max !== null && num > max) {
          result.error = `${fieldName} must be at most ${max}`;
          return result;
        }
        result.value = num;
        break;

      case 'string':
        if (typeof result.value !== 'string') {
          result.error = `${fieldName} must be a string`;
          return result;
        }
        if (min !== null && result.value.length < min) {
          result.error = `${fieldName} must be at least ${min} characters long`;
          return result;
        }
        if (max !== null && result.value.length > max) {
          result.error = `${fieldName} must be at most ${max} characters long`;
          return result;
        }
        break;

      case 'boolean':
        if (typeof result.value !== 'boolean') {
          result.error = `${fieldName} must be a boolean`;
          return result;
        }
        break;

      case 'array':
        if (!Array.isArray(result.value)) {
          result.error = `${fieldName} must be an array`;
          return result;
        }
        break;
    }

    result.valid = true;
    return result;
  }

  /**
   * Validate user ID for database operations
   * @param {any} userId - User ID to validate
   * @returns {Object} Validation result
   */
  static validateUserId(userId) {
    return this.validateValue(userId, 'userId', { 
      type: 'id',
      allowNull: false 
    });
  }

  /**
   * Validate room ID for database operations
   * @param {any} roomId - Room ID to validate
   * @returns {Object} Validation result
   */
  static validateRoomId(roomId) {
    return this.validateValue(roomId, 'roomId', { 
      type: 'id',
      allowNull: false 
    });
  }

  /**
   * Build safe WHERE clause for Sequelize queries
   * @param {Object} conditions - Raw conditions object
   * @param {Object} fieldValidations - Field validation rules
   * @returns {Object} Safe WHERE clause or error
   */
  static buildSafeWhereClause(conditions, fieldValidations = {}) {
    const result = {
      valid: false,
      where: {},
      errors: [],
      warnings: []
    };

    if (!conditions || typeof conditions !== 'object') {
      result.errors.push('Conditions must be a valid object');
      return result;
    }

    for (const [field, value] of Object.entries(conditions)) {
      // Get validation rules for this field
      const validation = fieldValidations[field] || { type: 'any' };
      
      // Validate the value
      const valueCheck = this.validateValue(value, field, validation);
      
      if (!valueCheck.valid) {
        result.errors.push(valueCheck.error);
        continue;
      }

      // Add to safe WHERE clause
      result.where[field] = valueCheck.value;

      // Add warning if value was sanitized
      if (valueCheck.sanitized) {
        result.warnings.push(`${field} value was sanitized`);
      }
    }

    result.valid = result.errors.length === 0;
    return result;
  }

  /**
   * Execute safe Sequelize findByPk operation
   * @param {Object} model - Sequelize model
   * @param {any} id - Primary key value
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Query result
   */
  static async safeFindByPk(model, id, options = {}) {
    const result = {
      success: false,
      data: null,
      error: null
    };

    try {
      // Validate ID
      const idValidation = this.validateValue(id, 'id', { type: 'id' });
      
      if (!idValidation.valid) {
        result.error = `Invalid ID: ${idValidation.error}`;
        return result;
      }

      // Execute query
      const data = await model.findByPk(idValidation.value, options);
      
      result.success = true;
      result.data = data;
      return result;

    } catch (error) {
      result.error = `Database query failed: ${error.message}`;
      console.error(`Safe findByPk error for ${model.name}:`, error);
      return result;
    }
  }

  /**
   * Execute safe Sequelize findOne operation
   * @param {Object} model - Sequelize model
   * @param {Object} whereConditions - WHERE conditions
   * @param {Object} fieldValidations - Field validation rules
   * @param {Object} options - Additional query options
   * @returns {Promise<Object>} Query result
   */
  static async safeFindOne(model, whereConditions, fieldValidations = {}, options = {}) {
    const result = {
      success: false,
      data: null,
      error: null,
      warnings: []
    };

    try {
      // Build safe WHERE clause
      const whereClause = this.buildSafeWhereClause(whereConditions, fieldValidations);
      
      if (!whereClause.valid) {
        result.error = `Invalid WHERE conditions: ${whereClause.errors.join(', ')}`;
        return result;
      }

      // Merge warnings
      result.warnings = whereClause.warnings;

      // Execute query
      const data = await model.findOne({
        where: whereClause.where,
        ...options
      });
      
      result.success = true;
      result.data = data;
      return result;

    } catch (error) {
      result.error = `Database query failed: ${error.message}`;
      console.error(`Safe findOne error for ${model.name}:`, error);
      return result;
    }
  }

  /**
   * Execute safe Sequelize findAll operation
   * @param {Object} model - Sequelize model
   * @param {Object} whereConditions - WHERE conditions
   * @param {Object} fieldValidations - Field validation rules
   * @param {Object} options - Additional query options
   * @returns {Promise<Object>} Query result
   */
  static async safeFindAll(model, whereConditions = {}, fieldValidations = {}, options = {}) {
    const result = {
      success: false,
      data: [],
      error: null,
      warnings: [],
      count: 0
    };

    try {
      // Build safe WHERE clause if conditions provided
      let whereClause = {};
      if (Object.keys(whereConditions).length > 0) {
        const safeWhere = this.buildSafeWhereClause(whereConditions, fieldValidations);
        
        if (!safeWhere.valid) {
          result.error = `Invalid WHERE conditions: ${safeWhere.errors.join(', ')}`;
          return result;
        }

        whereClause = safeWhere.where;
        result.warnings = safeWhere.warnings;
      }

      // Execute query
      const data = await model.findAll({
        where: whereClause,
        ...options
      });
      
      result.success = true;
      result.data = data || [];
      result.count = result.data.length;
      return result;

    } catch (error) {
      result.error = `Database query failed: ${error.message}`;
      console.error(`Safe findAll error for ${model.name}:`, error);
      return result;
    }
  }

  /**
   * Execute safe Sequelize update operation
   * @param {Object} model - Sequelize model
   * @param {Object} updates - Update values
   * @param {Object} whereConditions - WHERE conditions
   * @param {Object} fieldValidations - Field validation rules
   * @param {Object} options - Additional query options
   * @returns {Promise<Object>} Update result
   */
  static async safeUpdate(model, updates, whereConditions, fieldValidations = {}, options = {}) {
    const result = {
      success: false,
      affectedRows: 0,
      error: null,
      warnings: []
    };

    try {
      // Validate update values
      const updateValidation = this.buildSafeWhereClause(updates, fieldValidations);
      if (!updateValidation.valid) {
        result.error = `Invalid update values: ${updateValidation.errors.join(', ')}`;
        return result;
      }

      // Validate WHERE conditions
      const whereValidation = this.buildSafeWhereClause(whereConditions, fieldValidations);
      if (!whereValidation.valid) {
        result.error = `Invalid WHERE conditions: ${whereValidation.errors.join(', ')}`;
        return result;
      }

      // Execute update
      const [affectedRows] = await model.update(
        updateValidation.where, // Update values
        {
          where: whereValidation.where, // WHERE conditions
          ...options
        }
      );
      
      result.success = true;
      result.affectedRows = affectedRows;
      result.warnings = [...updateValidation.warnings, ...whereValidation.warnings];
      return result;

    } catch (error) {
      result.error = `Database update failed: ${error.message}`;
      console.error(`Safe update error for ${model.name}:`, error);
      return result;
    }
  }

  /**
   * Execute safe Sequelize create operation
   * @param {Object} model - Sequelize model
   * @param {Object} data - Data to create
   * @param {Object} fieldValidations - Field validation rules
   * @param {Object} options - Additional query options
   * @returns {Promise<Object>} Create result
   */
  static async safeCreate(model, data, fieldValidations = {}, options = {}) {
    const result = {
      success: false,
      data: null,
      error: null,
      warnings: []
    };

    try {
      // Validate data
      const dataValidation = this.buildSafeWhereClause(data, fieldValidations);
      if (!dataValidation.valid) {
        result.error = `Invalid data: ${dataValidation.errors.join(', ')}`;
        return result;
      }

      // Execute create
      const createdData = await model.create(dataValidation.where, options);
      
      result.success = true;
      result.data = createdData;
      result.warnings = dataValidation.warnings;
      return result;

    } catch (error) {
      result.error = `Database create failed: ${error.message}`;
      console.error(`Safe create error for ${model.name}:`, error);
      return result;
    }
  }

  /**
   * Log database operation for debugging
   * @param {string} operation - Operation name
   * @param {string} modelName - Model name
   * @param {Object} conditions - Query conditions
   * @param {Object} result - Operation result
   */
  static logDatabaseOperation(operation, modelName, conditions, result) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n📊 DB Operation: ${operation} on ${modelName}`);
      console.log('Conditions:', conditions);
      console.log('Success:', result.success ? '✅' : '❌');
      
      if (result.error) {
        console.log('Error:', result.error);
      }
      
      if (result.warnings && result.warnings.length > 0) {
        console.log('Warnings:', result.warnings);
      }
      
      if (result.data) {
        console.log('Result count:', Array.isArray(result.data) ? result.data.length : 'single record');
      }
    }
  }
}

module.exports = DatabaseValidator;
