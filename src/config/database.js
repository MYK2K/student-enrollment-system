/**
 * Database Configuration
 * Prisma client initialization and configuration
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

// ! Important: Configure Prisma to log queries in development
const prismaClientConfig = {
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
};

// Create Prisma client instance
const prisma = new PrismaClient(prismaClientConfig);

// * Handle Prisma query events in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug('Query: ' + e.query);
    logger.debug('Duration: ' + e.duration + 'ms');
  });
}

// * Middleware to log query execution time
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  logger.debug(`Query ${params.model}.${params.action} took ${after - before}ms`);
  
  return result;
});

/**
 * Test database connection
 * @returns {Promise<boolean>}
 */
export const testConnection = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connection test successful');
    return true;
  } catch (error) {
    logger.error('Database connection test failed:', error);
    return false;
  }
};

export { prisma };
export default prisma;
