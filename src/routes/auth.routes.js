/**
 * Authentication Routes
 * Handles user registration, login, logout, and token refresh
 */

import { Router } from 'express';
import { authenticate, authenticateRefreshToken } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
import {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  changePasswordValidation
} from '../validators/auth.validator.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (student or admin)
 * @access  Public
 * @body    {email, password, confirmPassword, role, name, collegeId, studentNumber?}
 */
router.post(
  '/register',
  validate(registerValidation),
  asyncHandler(authController.register)
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * @body    {email, password}
 */
router.post(
  '/login',
  validate(loginValidation),
  asyncHandler(authController.login)
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 * @body    {refreshToken}
 */
router.post(
  '/refresh',
  validate(refreshTokenValidation),
  authenticateRefreshToken,
  asyncHandler(authController.refreshToken)
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (optional - for token blacklisting if implemented)
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(authController.logout)
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(authController.getMe)
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 * @body    {currentPassword, newPassword, confirmPassword}
 */
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordValidation),
  asyncHandler(authController.changePassword)
);

export default router;
