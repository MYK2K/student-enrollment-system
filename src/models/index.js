/**
 * Models Index
 * Exports Prisma client instance for use throughout the application
 */

// Re-export Prisma client from database config
export { prisma, testConnection } from '../config/database.js';

// Export Prisma namespace for types (if needed)
export { Prisma } from '@prisma/client';

// * Note: All database models are accessed through the prisma client
// * Example usage:
// * import { prisma } from './models/index.js';
// * const users = await prisma.user.findMany();
