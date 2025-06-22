/**
 * Bcrypt Utilities
 * Helper functions for password hashing and verification
 */

import bcrypt from 'bcryptjs';
import { logger } from './logger.js';

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password) => {
  try {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    logger.error('Password hashing failed:', error);
    throw new Error('Failed to hash password');
  }
};

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches
 */
export const comparePassword = async (password, hash) => {
  try {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    logger.error('Password comparison failed:', error);
    return false;
  }
};

// /**
//  * Validate password strength
//  * @param {string} password - Password to validate
//  * @returns {Object} Validation result
//  */
// export const validatePasswordStrength = (password) => {
//   const result = {
//     isValid: true,
//     errors: []
//   };

//   // Minimum length check
//   if (password.length < 8) {
//     result.isValid = false;
//     result.errors.push('Password must be at least 8 characters long');
//   }

//   // Maximum length check
//   if (password.length > 128) {
//     result.isValid = false;
//     result.errors.push('Password must not exceed 128 characters');
//   }

//   // Contains uppercase letter
//   if (!/[A-Z]/.test(password)) {
//     result.isValid = false;
//     result.errors.push('Password must contain at least one uppercase letter');
//   }

//   // Contains lowercase letter
//   if (!/[a-z]/.test(password)) {
//     result.isValid = false;
//     result.errors.push('Password must contain at least one lowercase letter');
//   }

//   // Contains number
//   if (!/[0-9]/.test(password)) {
//     result.isValid = false;
//     result.errors.push('Password must contain at least one number');
//   }

//   // Contains special character
//   if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
//     result.isValid = false;
//     result.errors.push('Password must contain at least one special character');
//   }

//   return result;
// };

// /**
//  * Generate random password
//  * @param {number} length - Password length
//  * @returns {string} Random password
//  */
// export const generateRandomPassword = (length = 12) => {
//   const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
//   const lowercase = 'abcdefghijklmnopqrstuvwxyz';
//   const numbers = '0123456789';
//   const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
//   const allChars = uppercase + lowercase + numbers + special;
//   let password = '';
  
//   // Ensure at least one character from each category
//   password += uppercase[Math.floor(Math.random() * uppercase.length)];
//   password += lowercase[Math.floor(Math.random() * lowercase.length)];
//   password += numbers[Math.floor(Math.random() * numbers.length)];
//   password += special[Math.floor(Math.random() * special.length)];
  
//   // Fill the rest randomly
//   for (let i = password.length; i < length; i++) {
//     password += allChars[Math.floor(Math.random() * allChars.length)];
//   }
  
//   // Shuffle the password
//   return password.split('').sort(() => Math.random() - 0.5).join('');
// };
