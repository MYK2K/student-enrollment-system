/**
 * Authentication Controller
 * Handles authentication-related HTTP requests
 */

import * as authService from '../services/auth.service.js';
import { 
  sendResponse, 
  sendCreated, 
  sendBadRequest,
  sendUnauthorized,
  sendServerError 
} from '../utils/response.utils.js';
import { logger } from '../utils/logger.js';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../config/constants.js';

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const register = async (req, res) => {
  try {
    const userData = req.body;
    const result = await authService.register(userData);
    
    sendCreated(res, SUCCESS_MESSAGES.REGISTER_SUCCESS, result);
  } catch (error) {
    logger.error('Registration error:', error);
    
    if (error.message.includes('already exists')) {
      return sendBadRequest(res, ERROR_MESSAGES.USER_ALREADY_EXISTS);
    }
    
    sendServerError(res, error.message);
  }
};

/**
 * Login user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    
    sendResponse(res, 200, SUCCESS_MESSAGES.LOGIN_SUCCESS, result);
  } catch (error) {
    logger.error('Login error:', error);
    
    if (error.message === ERROR_MESSAGES.INVALID_CREDENTIALS) {
      return sendUnauthorized(res, error.message);
    }
    
    sendServerError(res, error.message);
  }
};

/**
 * Refresh access token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const refreshToken = async (req, res) => {
  try {
    // User is already verified by authenticateRefreshToken middleware
    const userId = req.user.id;
    const result = await authService.refreshTokens(userId);
    
    sendResponse(res, 200, 'Token refreshed successfully', result);
  } catch (error) {
    logger.error('Token refresh error:', error);
    sendServerError(res, error.message);
  }
};

/**
 * Logout user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // If implementing token blacklisting, add that logic here
    
    sendResponse(res, 200, SUCCESS_MESSAGES.LOGOUT_SUCCESS);
  } catch (error) {
    logger.error('Logout error:', error);
    sendServerError(res, error.message);
  }
};

/**
 * Get current user info
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await authService.getCurrentUser(userId);
    
    sendResponse(res, 200, SUCCESS_MESSAGES.FETCH_SUCCESS, user);
  } catch (error) {
    logger.error('Get current user error:', error);
    sendServerError(res, error.message);
  }
};

/**
 * Change user password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    await authService.changePassword(userId, currentPassword, newPassword);
    
    sendResponse(res, 200, SUCCESS_MESSAGES.UPDATE_SUCCESS);
  } catch (error) {
    logger.error('Change password error:', error);
    
    if (error.message === ERROR_MESSAGES.INVALID_CREDENTIALS) {
      return sendBadRequest(res, 'Current password is incorrect');
    }
    
    sendServerError(res, error.message);
  }
};
