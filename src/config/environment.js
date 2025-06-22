/**
 * Environment Variables Validation
 * Ensures all required environment variables are present
 */

import { logger } from '../utils/logger.js';

/**
 * Required environment variables
 */
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'JWT_REFRESH_SECRET',
  'JWT_REFRESH_EXPIRES_IN',
];

/**
 * Optional environment variables with defaults
 */
const optionalEnvVars = {
  BCRYPT_SALT_ROUNDS: '10',
  CORS_ORIGIN: '*',
  CORS_CREDENTIALS: 'true',
  RATE_LIMIT_WINDOW_MS: '900000', // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: '100',
  LOG_LEVEL: 'info',
  API_PREFIX: '/api',
  API_VERSION: 'v1',
  TZ: 'Asia/Kolkata',
  DEFAULT_PAGE_SIZE: '20',
  MAX_PAGE_SIZE: '100',
};

/**
 * Validate environment variables
 * @throws {Error} If required variables are missing
 */
export const validateEnv = () => {
  const missingVars = [];

  // Check required variables
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // Set defaults for optional variables
  Object.entries(optionalEnvVars).forEach(([varName, defaultValue]) => {
    if (!process.env[varName]) {
      process.env[varName] = defaultValue;
      logger.debug(`Using default value for ${varName}: ${defaultValue}`);
    }
  });

  // Throw error if required variables are missing
  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  // Validate specific variable formats
  validateDatabaseUrl();
  validateNumericVars();

  logger.info('✅ Environment variables validated successfully');
};

/**
 * Validate DATABASE_URL format
 */
const validateDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl.startsWith('mysql://')) {
    throw new Error('DATABASE_URL must be a valid MySQL connection string starting with mysql://');
  }
};

/**
 * Validate numeric environment variables
 */
const validateNumericVars = () => {
  const numericVars = [
    'PORT',
    'BCRYPT_SALT_ROUNDS',
    'RATE_LIMIT_WINDOW_MS',
    'RATE_LIMIT_MAX_REQUESTS',
    'DEFAULT_PAGE_SIZE',
    'MAX_PAGE_SIZE'
  ];

  numericVars.forEach(varName => {
    const value = process.env[varName];
    if (value && isNaN(parseInt(value))) {
      throw new Error(`${varName} must be a valid number`);
    }
  });
};

/**
 * Get environment variable with type conversion
 */
export const getEnv = {
  /**
   * Get string environment variable
   * @param {string} key 
   * @param {string} defaultValue 
   * @returns {string}
   */
  string: (key, defaultValue = '') => process.env[key] || defaultValue,

  /**
   * Get number environment variable
   * @param {string} key 
   * @param {number} defaultValue 
   * @returns {number}
   */
  number: (key, defaultValue = 0) => {
    const value = process.env[key];
    return value ? parseInt(value) : defaultValue;
  },

  /**
   * Get boolean environment variable
   * @param {string} key 
   * @param {boolean} defaultValue 
   * @returns {boolean}
   */
  boolean: (key, defaultValue = false) => {
    const value = process.env[key];
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
  },

  /**
   * Get array environment variable (comma-separated)
   * @param {string} key 
   * @param {Array} defaultValue 
   * @returns {Array}
   */
  array: (key, defaultValue = []) => {
    const value = process.env[key];
    if (!value) return defaultValue;
    return value.split(',').map(item => item.trim());
  }
};
