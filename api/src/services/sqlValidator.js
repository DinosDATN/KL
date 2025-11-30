/**
 * SQL Validator Service
 * Đảm bảo SQL queries an toàn trước khi thực thi
 */

class SQLValidator {
  /**
   * Danh sách các từ khóa SQL nguy hiểm cần chặn
   */
  static DANGEROUS_KEYWORDS = [
    'DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE',
    'EXEC', 'EXECUTE', 'CREATE', 'GRANT', 'REVOKE', 'REPLACE',
    'MERGE', 'CALL', 'DECLARE', 'SET', 'USE', 'SHOW',
    'DESCRIBE', 'DESC', 'EXPLAIN', 'LOCK', 'UNLOCK',
    'COMMIT', 'ROLLBACK', 'SAVEPOINT', 'TRANSACTION'
  ];

  /**
   * Validate SQL query - chỉ cho phép SELECT queries
   * @param {string} sql - SQL query cần validate
   * @returns {Object} Validation result
   */
  static validateSQL(sql) {
    const result = {
      valid: false,
      error: null,
      sanitized: null,
      warnings: []
    };

    if (!sql || typeof sql !== 'string') {
      result.error = 'SQL query không hợp lệ';
      return result;
    }

    // Normalize SQL: loại bỏ comments, whitespace
    const normalizedSQL = sql
      .replace(/--.*$/gm, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .trim()
      .toUpperCase();

    if (normalizedSQL.length === 0) {
      result.error = 'SQL query không được để trống';
      return result;
    }

    // Kiểm tra phải bắt đầu bằng SELECT
    if (!normalizedSQL.startsWith('SELECT')) {
      result.error = 'Chỉ cho phép SELECT queries. Các loại query khác không được phép.';
      return result;
    }

    // Kiểm tra các từ khóa nguy hiểm
    for (const keyword of this.DANGEROUS_KEYWORDS) {
      // Sử dụng regex để tìm từ khóa như một từ riêng biệt
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(sql)) {
        result.error = `Từ khóa '${keyword}' không được phép trong query`;
        return result;
      }
    }

    // Kiểm tra các pattern nguy hiểm khác
    const dangerousPatterns = [
      /INTO\s+OUTFILE/i,
      /INTO\s+DUMPFILE/i,
      /LOAD_FILE/i,
      /INFORMATION_SCHEMA/i, // Có thể cho phép sau nếu cần
      /SYS\./i,
      /MYSQL\./i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(sql)) {
        result.error = 'Query chứa pattern không được phép';
        return result;
      }
    }

    // Kiểm tra và thêm LIMIT nếu chưa có (giới hạn kết quả)
    let sanitizedSQL = sql.trim();
    const hasLimit = /LIMIT\s+\d+/i.test(sanitizedSQL);
    
    if (!hasLimit) {
      // Thêm LIMIT 100 mặc định nếu chưa có
      sanitizedSQL = this.addLimitClause(sanitizedSQL, 100);
      result.warnings.push('Đã tự động thêm LIMIT 100 để giới hạn kết quả');
    } else {
      // Kiểm tra LIMIT không quá lớn
      const limitMatch = sanitizedSQL.match(/LIMIT\s+(\d+)/i);
      if (limitMatch) {
        const limitValue = parseInt(limitMatch[1], 10);
        if (limitValue > 1000) {
          sanitizedSQL = sanitizedSQL.replace(/LIMIT\s+\d+/i, 'LIMIT 1000');
          result.warnings.push('Đã giới hạn LIMIT xuống 1000 để bảo vệ hiệu năng');
        }
      }
    }

    result.valid = true;
    result.sanitized = sanitizedSQL;
    return result;
  }

  /**
   * Thêm LIMIT clause vào SQL query
   * @param {string} sql - SQL query
   * @param {number} limit - Giới hạn số bản ghi
   * @returns {string} SQL với LIMIT clause
   */
  static addLimitClause(sql, limit = 100) {
    // Loại bỏ semicolon ở cuối nếu có
    let cleanSQL = sql.trim().replace(/;+$/, '');
    
    // Kiểm tra xem đã có LIMIT chưa
    if (/LIMIT\s+\d+/i.test(cleanSQL)) {
      return cleanSQL;
    }

    // Thêm LIMIT vào cuối query
    return `${cleanSQL} LIMIT ${limit}`;
  }

  /**
   * Kiểm tra query có phải là SELECT đơn giản không
   * @param {string} sql - SQL query
   * @returns {boolean}
   */
  static isSimpleSelect(sql) {
    const normalized = sql.trim().toUpperCase();
    return normalized.startsWith('SELECT') && 
           !normalized.includes('UNION') &&
           !normalized.includes('JOIN');
  }

  /**
   * Extract table names từ SELECT query
   * @param {string} sql - SQL query
   * @returns {Array<string>} Danh sách tên bảng
   */
  static extractTableNames(sql) {
    const tables = [];
    const fromMatch = sql.match(/FROM\s+([^\s,]+)/i);
    if (fromMatch) {
      tables.push(fromMatch[1].replace(/`/g, ''));
    }
    
    // Tìm các JOIN tables
    const joinMatches = sql.matchAll(/JOIN\s+([^\s,]+)/gi);
    for (const match of joinMatches) {
      tables.push(match[1].replace(/`/g, ''));
    }

    return tables;
  }
}

module.exports = SQLValidator;

