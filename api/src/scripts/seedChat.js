require('dotenv').config();
const { sequelize } = require('../config/sequelize');
const { seedChatData } = require('../seeders/chatSeeder');

// Import models to ensure they are registered
require('../models');

const runSeeder = async () => {
  try {
    console.log('🚀 Starting chat database seeding...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync database (create tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');
    
    // Run chat seeder
    await seedChatData();
    
    console.log('🎉 Chat seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// Run the seeder
runSeeder();
