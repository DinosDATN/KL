const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lfysdb',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  });

  try {
    console.log('🔌 Connected to database');

    // Đọc file migration
    const migrationFile = path.join(__dirname, 'migrations', 'create_creator_bank_accounts_table.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('📝 Running migration: create_creator_bank_accounts_table.sql');
    
    await connection.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Table "creator_bank_accounts" has been created');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await connection.end();
    console.log('🔌 Database connection closed');
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
