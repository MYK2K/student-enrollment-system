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
    .notEmpty().withMessage(ERROR_MESSAGES.PASSWORD_REQUIRED)
    .isLength({ min: VALIDATION.PASSWORD_MIN_LENGTH })
    .withMessage(ERROR_MESSAGES.INVALID_PASSWORD)
    .isLength({ max: VALIDATION.PASSWORD_MAX_LENGTH })
    .withMessage(`Password must not exceed ${VALIDATION.PASSWORD_MAX_LENGTH} characters`)
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
    .withMessage('Password must contain at least one special character');

const allowedRoles = Object.values(USER_ROLES).map(role => role.toLowerCase());

/**
 * Register validation rules
 */
export const registerValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage(ERROR_MESSAGES.EMAIL_REQUIRED)
    .isEmail().withMessage(ERROR_MESSAGES.INVALID_EMAIL)
    .normalizeEmail()
    .isLength({ max: VALIDATION.EMAIL_MAX_LENGTH })
    .withMessage(`Email must not exceed ${VALIDATION.EMAIL_MAX_LENGTH} characters`),

  passwordValidationChain('password'),

  body('confirmPassword')
    .notEmpty().withMessage(ERROR_MESSAGES.PASSWORD_CONFIRMATION_REQUIRED)
    .custom((value, { req }) => value === req.body.password)
    .withMessage(ERROR_MESSAGES.PASSWORDS_NOT_MATCH),

  body('role')
    .trim()
    .toLowerCase()
    .notEmpty().withMessage(ERROR_MESSAGES.ROLE_REQUIRED)
    .isIn(allowedRoles)
    .withMessage(`Role must be one of: ${allowedRoles.join(', ')}`),

  body('name')
    .trim()
    .notEmpty().withMessage(ERROR_MESSAGES.NAME_REQUIRED)
    .isLength({ min: VALIDATION.NAME_MIN_LENGTH, max: VALIDATION.NAME_MAX_LENGTH })
    .withMessage(`Name must be between ${VALIDATION.NAME_MIN_LENGTH} and ${VALIDATION.NAME_MAX_LENGTH} characters`)
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(ERROR_MESSAGES.INVALID_NAME_FORMAT),

  body('collegeId')
    .notEmpty().withMessage(ERROR_MESSAGES.COLLEGE_ID_REQUIRED)
    .isInt({ min: 1 }).withMessage(ERROR_MESSAGES.INVALID_DATA)
    .toInt(),

  body('studentNumber')
    .if(body('role').trim().toLowerCase().equals(USER_ROLES.STUDENT.toLowerCase()))
    .trim()
    .notEmpty().withMessage(ERROR_MESSAGES.STUDENT_NUMBER_REQUIRED)
    .isLength({ max: VALIDATION.STUDENT_NUMBER_MAX_LENGTH })
    .withMessage(`Student number must not exceed ${VALIDATION.STUDENT_NUMBER_MAX_LENGTH} characters`)
    .matches(/^[A-Z0-9-]+$/)
    .withMessage(ERROR_MESSAGES.INVALID_STUDENT_NUMBER_FORMAT),
];

/**
 * Login validation rules
 */
export const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage(ERROR_MESSAGES.EMAIL_REQUIRED)
    .isEmail().withMessage(ERROR_MESSAGES.INVALID_EMAIL)
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage(ERROR_MESSAGES.PASSWORD_REQUIRED),
];

/**
 * Refresh token validation rules
 */
export const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty().withMessage(ERROR_MESSAGES.TOKEN_REQUIRED)
    .isString().withMessage(ERROR_MESSAGES.TOKEN_INVALID),
];

/**
 * Change password validation rules
 */
export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage(ERROR_MESSAGES.CURRENT_PASSWORD_REQUIRED),

  passwordValidationChain('newPassword')
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage(ERROR_MESSAGES.PASSWORD_SAME_AS_OLD),

  body('confirmPassword')
    .notEmpty().withMessage(ERROR_MESSAGES.PASSWORD_CONFIRMATION_REQUIRED)
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage(ERROR_MESSAGES.PASSWORDS_NOT_MATCH),
];

/**
 * Forgot password validation rules
 */
export const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage(ERROR_MESSAGES.EMAIL_REQUIRED)
    .isEmail().withMessage(ERROR_MESSAGES.INVALID_EMAIL)
    .normalizeEmail(),
];

/**
 * Reset password validation rules
 */
export const resetPasswordValidation = [
  body('token')
    .notEmpty().withMessage(ERROR_MESSAGES.TOKEN_REQUIRED),

  passwordValidationChain('newPassword'),

  body('confirmPassword')
    .notEmpty().withMessage(ERROR_MESSAGES.PASSWORD_CONFIRMATION_REQUIRED)
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage(ERROR_MESSAGES.PASSWORDS_NOT_MATCH),
];
