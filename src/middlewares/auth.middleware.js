/**
 * Authentication Middleware
 * JWT token verification and user authentication
 */

import { verifyAccessToken, verifyRefreshToken, extractTokenFromHeader } from '../utils/jwt.utils.js';
import { sendUnauthorized } from '../utils/response.utils.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Authenticate user via JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return sendUnauthorized(res, 'No token provided');
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      return sendUnauthorized(res, 'Invalid or expired token');
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.id,
        isActive: true 
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return sendUnauthorized(res, 'User not found or inactive');
    }

    // Attach user to request object
    req.user = user;
    
    // Log successful authentication
    logger.debug(`User ${user.email} authenticated successfully`);
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return sendUnauthorized(res, 'Authentication failed');
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const decoded = verifyAccessToken(token);
      
      if (decoded) {
        const user = await prisma.user.findUnique({
          where: { 
            id: decoded.id,
            isActive: true 
          },
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true
          }
        });

        if (user) {
          req.user = user;
        }
      }
    }
    
    next();
  } catch (error) {
    // Silent fail - continue without user
    logger.debug('Optional auth failed:', error.message);
    next();
  }
};

/**
 * Refresh token middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authenticateRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return sendUnauthorized(res, 'No refresh token provided');
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    if (!decoded) {
      return sendUnauthorized(res, 'Invalid or expired refresh token');
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.id,
        isActive: true 
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return sendUnauthorized(res, 'User not found or inactive');
    }

    // Attach user to request object
    req.user = user;
    
    next();
  } catch (error) {
    logger.error('Refresh token authentication error:', error);
    return sendUnauthorized(res, 'Refresh token authentication failed');
  }
};
