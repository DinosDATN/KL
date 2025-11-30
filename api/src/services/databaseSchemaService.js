/**
 * Database Schema Service
 * Cung cấp thông tin về database schema cho AI service
 */

const { sequelize } = require('../config/sequelize');

class DatabaseSchemaService {
  /**
   * Lấy schema của database dưới dạng text để gửi cho AI
   * @returns {Promise<string>} Schema description
   */
  static async getSchemaDescription() {
    try {
      // Lấy danh sách các bảng
      const [tables] = await sequelize.query(`
        SELECT TABLE_NAME, TABLE_COMMENT
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
      `);

      let schemaText = `# Database Schema\n\n`;
      schemaText += `Database: ${process.env.DB_NAME || 'lfysdb'}\n\n`;

      // Lấy thông tin chi tiết cho từng bảng
      for (const table of tables) {
        const tableName = table.TABLE_NAME;
        
        // Lấy columns
        const [columns] = await sequelize.query(`
          SELECT 
            COLUMN_NAME,
            DATA_TYPE,
            IS_NULLABLE,
            COLUMN_DEFAULT,
            COLUMN_KEY,
            COLUMN_COMMENT,
            CHARACTER_MAXIMUM_LENGTH
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          ORDER BY ORDINAL_POSITION
        `, {
          replacements: [tableName]
        });

        schemaText += `## Table: ${tableName}\n`;
        if (table.TABLE_COMMENT) {
          schemaText += `Comment: ${table.TABLE_COMMENT}\n`;
        }
        schemaText += `\nColumns:\n`;

        for (const col of columns) {
          let colDesc = `  - ${col.COLUMN_NAME} (${col.DATA_TYPE}`;
          
          if (col.CHARACTER_MAXIMUM_LENGTH) {
            colDesc += `(${col.CHARACTER_MAXIMUM_LENGTH})`;
          }
          
          if (col.COLUMN_KEY === 'PRI') {
            colDesc += ', PRIMARY KEY';
          }
          if (col.COLUMN_KEY === 'UNI') {
            colDesc += ', UNIQUE';
          }
          if (col.IS_NULLABLE === 'NO') {
            colDesc += ', NOT NULL';
          }
          if (col.COLUMN_DEFAULT !== null) {
            colDesc += `, DEFAULT: ${col.COLUMN_DEFAULT}`;
          }
          
          colDesc += ')';
          
          if (col.COLUMN_COMMENT) {
            colDesc += ` - ${col.COLUMN_COMMENT}`;
          }
          
          schemaText += colDesc + '\n';
        }

        // Lấy foreign keys
        const [foreignKeys] = await sequelize.query(`
          SELECT 
            COLUMN_NAME,
            REFERENCED_TABLE_NAME,
            REFERENCED_COLUMN_NAME
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
          WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND REFERENCED_TABLE_NAME IS NOT NULL
        `, {
          replacements: [tableName]
        });

        if (foreignKeys.length > 0) {
          schemaText += `\nForeign Keys:\n`;
          for (const fk of foreignKeys) {
            schemaText += `  - ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}\n`;
          }
        }

        schemaText += '\n';
      }

      return schemaText;

    } catch (error) {
      console.error('[DatabaseSchemaService] Error getting schema:', error);
      throw error;
    }
  }

  /**
   * Lấy schema dưới dạng JSON
   * @returns {Promise<Object>} Schema object
   */
  static async getSchemaJSON() {
    try {
      const [tables] = await sequelize.query(`
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
      `);

      const schema = {
        database: process.env.DB_NAME || 'lfysdb',
        tables: []
      };

      for (const table of tables) {
        const tableName = table.TABLE_NAME;
        
        const [columns] = await sequelize.query(`
          SELECT 
            COLUMN_NAME,
            DATA_TYPE,
            IS_NULLABLE,
            COLUMN_DEFAULT,
            COLUMN_KEY,
            COLUMN_COMMENT,
            CHARACTER_MAXIMUM_LENGTH
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          ORDER BY ORDINAL_POSITION
        `, {
          replacements: [tableName]
        });

        const [foreignKeys] = await sequelize.query(`
          SELECT 
            COLUMN_NAME,
            REFERENCED_TABLE_NAME,
            REFERENCED_COLUMN_NAME
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
          WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND REFERENCED_TABLE_NAME IS NOT NULL
        `, {
          replacements: [tableName]
        });

        schema.tables.push({
          name: tableName,
          columns: columns.map(col => ({
            name: col.COLUMN_NAME,
            type: col.DATA_TYPE,
            maxLength: col.CHARACTER_MAXIMUM_LENGTH,
            nullable: col.IS_NULLABLE === 'YES',
            default: col.COLUMN_DEFAULT,
            primaryKey: col.COLUMN_KEY === 'PRI',
            unique: col.COLUMN_KEY === 'UNI',
            comment: col.COLUMN_COMMENT
          })),
          foreignKeys: foreignKeys.map(fk => ({
            column: fk.COLUMN_NAME,
            referencesTable: fk.REFERENCED_TABLE_NAME,
            referencesColumn: fk.REFERENCED_COLUMN_NAME
          }))
        });
      }

      return schema;

    } catch (error) {
      console.error('[DatabaseSchemaService] Error getting schema JSON:', error);
      throw error;
    }
  }
}

module.exports = DatabaseSchemaService;

