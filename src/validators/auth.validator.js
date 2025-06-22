/**
 * Authentication Validators
 * Validation rules for authentication endpoints
 */

import { body } from 'express-validator';
import { USER_ROLES, VALIDATION, ERROR_MESSAGES } from '../config/constants.js';

/**
 * Reusable validation chain for passwords.
 * @param {string} fieldName - The name of the password field (e.g., 'password', 'newPassword').
 * @returns {import('express-validator').ValidationChain} The validation chain.
 */
const passwordValidationChain = (fieldName = 'password') => 
  body(fieldName)
    .notEmpty().withMessage('Password is required')
    .isLength({ min: VALIDATION.PASSWORD_MIN_LENGTH })
    .withMessage(`Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`)
    .isLength({ max: VALIDATION.PASSWORD_MAX_LENGTH })
    .withMessage(`Password must not exceed ${VALIDATION.PASSWORD_MAX_LENGTH} characters`)
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
    .withMessage('Password must contain at least one special character');

// Dynamically create a list of allowed lowercase roles from the enum
const allowedRoles = Object.values(USER_ROLES).map(role => role.toLowerCase());

/**
 * Register validation rules
 */
export const registerValidation = [
  // Email validation
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
    .isLength({ max: VALIDATION.EMAIL_MAX_LENGTH })
    .withMessage(`Email must not exceed ${VALIDATION.EMAIL_MAX_LENGTH} characters`),

  // Password validation (using the reusable chain)
  passwordValidationChain('password'),

  // Confirm password validation
  body('confirmPassword')
    .notEmpty().withMessage('Password confirmation is required')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),

  // Role validation
  body('role')
    .trim()
    .toLowerCase() // Sanitize to lowercase before validation
    .notEmpty().withMessage('Role is required')
    .isIn(allowedRoles) // Validate against the dynamic list of lowercase roles
    .withMessage(`Role must be one of: ${allowedRoles.join(', ')}`),

  // Name validation
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: VALIDATION.NAME_MIN_LENGTH, max: VALIDATION.NAME_MAX_LENGTH })
    .withMessage(`Name must be between ${VALIDATION.NAME_MIN_LENGTH} and ${VALIDATION.NAME_MAX_LENGTH} characters`)
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),

  // College ID validation
  body('collegeId')
    .notEmpty().withMessage('College ID is required')
    .isInt({ min: 1 }).withMessage('Invalid college ID')
    .toInt(),

  // Student number validation (only for students)
  body('studentNumber')
    // This now dynamically checks against the lowercase version of the enum value
    .if(body('role').trim().toLowerCase().equals(USER_ROLES.STUDENT.toLowerCase()))
    .trim()
    .notEmpty().withMessage('Student number is required for students')
    .isLength({ max: VALIDATION.STUDENT_NUMBER_MAX_LENGTH })
    .withMessage(`Student number must not exceed ${VALIDATION.STUDENT_NUMBER_MAX_LENGTH} characters`)
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Student number can only contain uppercase letters, numbers, and hyphens'),
];

/**
 * Login validation rules
 */
export const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

/**
 * Refresh token validation rules
 */
export const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh token is required')
    .isString().withMessage('Invalid refresh token format'),
];

/**
 * Change password validation rules
 */
export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),

  // New password validation (using reusable chain with a custom rule)
  passwordValidationChain('newPassword')
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('New password must be different from current password'),

  body('confirmPassword')
    .notEmpty().withMessage('Password confirmation is required')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match'),
];

/**
 * Forgot password validation rules
 */
export const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
];

/**
 * Reset password validation rules
 */
export const resetPasswordValidation = [
  body('token')
    .notEmpty().withMessage('Reset token is required'),

  // New password validation (using the reusable chain)
  passwordValidationChain('newPassword'),

  body('confirmPassword')
    .notEmpty().withMessage('Password confirmation is required')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match'),
];
