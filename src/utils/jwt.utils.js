/**
 * JWT Utilities
 * Helper functions for JWT token generation and verification
 */

import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/constants.js';
import { logger } from './logger.js';

/**
 * Generate access token
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */
export const generateAccessToken = (payload) => {
  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: JWT_CONFIG.ISSUER,
    audience: JWT_CONFIG.AUDIENCE,
    algorithm: JWT_CONFIG.ALGORITHM,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

/**
 * Generate refresh token
 * @param {Object} payload - Token payload
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (payload) => {
  const options = {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    issuer: JWT_CONFIG.ISSUER,
    audience: JWT_CONFIG.AUDIENCE,
    algorithm: JWT_CONFIG.ALGORITHM,
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, options);
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} Tokens object
 */
export const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  };
};

/**
 * Verify access token
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token or null
 */
export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
      algorithms: [JWT_CONFIG.ALGORITHM],
    });
    return decoded;
  } catch (error) {
    logger.error('JWT verification failed:', error.message);
    return null;
  }
};

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token
 * @returns {Object|null} Decoded token or null
 */
export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
      algorithms: [JWT_CONFIG.ALGORITHM],
    });
    return decoded;
  } catch (error) {
    logger.error('Refresh token verification failed:', error.message);
    return null;
  }
};

/**
 * Decode token without verification (useful for debugging)
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token or null
 */
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('Token decode failed:', error.message);
    return null;
  }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if expired
 */
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

/**
 * Get token expiration time
 * @param {string} token - JWT token
 * @returns {Date|null} Expiration date or null
 */
export const getTokenExpiration = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return null;
  }
  
  return new Date(decoded.exp * 1000);
};
