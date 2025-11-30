/**
 * SQL Executor Service
 * Thực thi SQL queries một cách an toàn với timeout và error handling
 */

const { sequelize } = require('../config/sequelize');
const SQLValidator = require('./sqlValidator');

class SQLExecutor {
  /**
   * Thực thi SQL query an toàn
   * @param {string} sql - SQL query đã được validate
   * @param {Object} options - Options cho query
   * @returns {Promise<Object>} Kết quả query
   */
  static async executeQuery(sql, options = {}) {
    const {
      timeout = 10000, // 10 seconds default timeout
      maxRows = 1000,
      userId = null // Để log user thực hiện query
    } = options;

    const result = {
      success: false,
      data: [],
      rowCount: 0,
      executionTime: 0,
      error: null,
      query: sql
    };

    // Validate SQL trước khi thực thi
    const validation = SQLValidator.validateSQL(sql);
    if (!validation.valid) {
      result.error = validation.error;
      return result;
    }

    // Sử dụng validated SQL
    const validatedSQL = validation.sanitized;

    const startTime = Date.now();

    try {
      // Tạo promise với timeout
      const queryPromise = sequelize.query(validatedSQL, {
        type: sequelize.QueryTypes.SELECT,
        raw: true,
        nest: true
      });

      // Thêm timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Query timeout: Query mất quá nhiều thời gian để thực thi'));
        }, timeout);
      });

      // Race giữa query và timeout
      const queryResult = await Promise.race([queryPromise, timeoutPromise]);

      // Giới hạn số rows nếu cần
      let data = Array.isArray(queryResult) ? queryResult : [];
      if (data.length > maxRows) {
        data = data.slice(0, maxRows);
        result.warning = `Kết quả đã được giới hạn ở ${maxRows} bản ghi`;
      }

      const executionTime = Date.now() - startTime;

      result.success = true;
      result.data = data;
      result.rowCount = data.length;
      result.executionTime = executionTime;

      // Log query nếu cần (chỉ trong development)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[SQL Executor] Query executed in ${executionTime}ms, returned ${data.length} rows`);
        if (userId) {
          console.log(`[SQL Executor] Executed by user: ${userId}`);
        }
      }

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      result.error = error.message || 'Lỗi không xác định khi thực thi query';
      result.executionTime = executionTime;

      // Log error
      console.error('[SQL Executor] Error:', error.message);
      if (userId) {
        console.error(`[SQL Executor] Error for user: ${userId}`);
      }

      return result;
    }
  }

  /**
   * Format kết quả query thành text dễ đọc
   * @param {Object} queryResult - Kết quả từ executeQuery
   * @returns {string} Formatted text
   */
  static formatResult(queryResult) {
    if (!queryResult.success) {
      return `Lỗi: ${queryResult.error}`;
    }

    if (queryResult.rowCount === 0) {
      return 'Không tìm thấy kết quả nào.';
    }

    // Format dữ liệu thành bảng text
    const data = queryResult.data;
    if (data.length === 0) {
      return 'Không có dữ liệu.';
    }

    // Lấy tất cả keys từ tất cả objects
    const allKeys = new Set();
    data.forEach(row => {
      Object.keys(row).forEach(key => allKeys.add(key));
    });

    const keys = Array.from(allKeys);
    
    // Tạo header
    let output = `Tìm thấy ${queryResult.rowCount} bản ghi:\n\n`;
    
    // Format từng row (giới hạn 20 rows đầu để không quá dài)
    const displayRows = data.slice(0, 20);
    displayRows.forEach((row, index) => {
      output += `--- Bản ghi ${index + 1} ---\n`;
      keys.forEach(key => {
        const value = row[key];
        const displayValue = value === null ? '(null)' : 
                           value === undefined ? '(undefined)' :
                           typeof value === 'object' ? JSON.stringify(value) :
                           String(value);
        output += `${key}: ${displayValue}\n`;
      });
      output += '\n';
    });

    if (data.length > 20) {
      output += `... và ${data.length - 20} bản ghi khác.\n`;
    }

    if (queryResult.warning) {
      output += `\n⚠️ ${queryResult.warning}\n`;
    }

    return output;
  }

  /**
   * Format kết quả query thành JSON string
   * @param {Object} queryResult - Kết quả từ executeQuery
   * @returns {string} JSON string
   */
  static formatResultAsJSON(queryResult) {
    if (!queryResult.success) {
      return JSON.stringify({ error: queryResult.error }, null, 2);
    }

    return JSON.stringify({
      rowCount: queryResult.rowCount,
      data: queryResult.data,
      executionTime: queryResult.executionTime,
      warning: queryResult.warning || null
    }, null, 2);
  }
}

module.exports = SQLExecutor;

