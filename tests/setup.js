/**
 * Test Setup File
 * Global setup for all tests
 */

import { PrismaClient } from '@prisma/client';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

// Mock Prisma client for tests
const prisma = new PrismaClient();

// Global setup
beforeAll(async () => {
  // Clear database before tests
  await clearDatabase();
});

// Global teardown
afterAll(async () => {
  await prisma.$disconnect();
});

// Clear database function with proper foreign key handling
async function clearDatabase() {
  try {
    // Disable foreign key checks
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
    
    // Get all table names except migrations
    const tablenames = await prisma.$queryRaw`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME != '_prisma_migrations'
      AND TABLE_TYPE = 'BASE TABLE'
    `;

    // Truncate all tables
    for (const { TABLE_NAME } of tablenames) {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${TABLE_NAME}\``);
      } catch (error) {
        console.warn(`Warning: Could not truncate table ${TABLE_NAME}:`, error.message);
      }
    }
    
    // Re-enable foreign key checks
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
    
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
}

// Helper function to reset auto-increment
async function resetAutoIncrement(tableName, startValue = 1) {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE \`${tableName}\` AUTO_INCREMENT = ${startValue}`);
  } catch (error) {
    console.warn(`Could not reset auto-increment for ${tableName}:`, error.message);
  }
}

// Export utilities
export { prisma, clearDatabase, resetAutoIncrement };
