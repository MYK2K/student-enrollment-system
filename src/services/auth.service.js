/**
 * Authentication Service
 * Business logic for authentication operations
 */

import { prisma } from '../models/index.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.utils.js';
import { generateTokens } from '../utils/jwt.utils.js';
import { logger } from '../utils/logger.js';
import { ERROR_MESSAGES, USER_ROLES } from '../config/constants.js';

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} User and tokens
 */
export const register = async (userData) => {
  const { email, password, role, name, collegeId, studentNumber } = userData;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new Error(ERROR_MESSAGES.USER_ALREADY_EXISTS);
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Start transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role.toUpperCase(),
      }
    });

    // Create role-specific profile
    if (role === USER_ROLES.STUDENT.toLowerCase()) {
      await tx.student.create({
        data: {
          userId: user.id,
          collegeId,
          name,
          studentNumber
        }
      });
    } else if (role === USER_ROLES.COLLEGE_ADMIN.toLowerCase()) {
      await tx.collegeAdmin.create({
        data: {
          userId: user.id,
          collegeId
        }
      });
    }

    return user;
  });

  // Generate tokens
  const tokens = generateTokens(result);

  logger.info(`New user registered: ${email} with role ${role}`);

  return {
    user: {
      id: result.id,
      email: result.email,
      role: result.role
    },
    ...tokens
  };
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User and tokens
 */
export const login = async (email, password) => {
  // Find user with profile
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      student: {
        include: {
          college: true
        }
      },
      collegeAdmin: {
        include: {
          college: true
        }
      }
    }
  });

  if (!user || !user.isActive) {
    throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  // Generate tokens
  const tokens = generateTokens(user);

  // Prepare user data
  const userData = {
    id: user.id,
    email: user.email,
    role: user.role,
    profile: user.role === USER_ROLES.STUDENT ? {
      name: user.student.name,
      studentNumber: user.student.studentNumber,
      college: user.student.college.name
    } : {
      college: user.collegeAdmin.college.name
    }
  };

  logger.info(`User logged in: ${email}`);

  return {
    user: userData,
    ...tokens
  };
};

/**
 * Refresh tokens
 * @param {number} userId - User ID
 * @returns {Promise<Object>} New tokens
 */
export const refreshTokens = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || !user.isActive) {
    throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
  }

  const tokens = generateTokens(user);
  
  logger.info(`Tokens refreshed for user: ${user.email}`);
  
  return tokens;
};

/**
 * Get current user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User data
 */
export const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      student: {
        select: {
          id: true,
          name: true,
          studentNumber: true,
          college: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      },
      collegeAdmin: {
        select: {
          id: true,
          college: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      }
    }
  });

  if (!user) {
    throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
  }

  return user;
};

/**
 * Change password
 * @param {number} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
  }

  // Verify current password
  const isPasswordValid = await comparePassword(currentPassword, user.password);
  if (!isPasswordValid) {
    throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  logger.info(`Password changed for user: ${user.email}`);
};
