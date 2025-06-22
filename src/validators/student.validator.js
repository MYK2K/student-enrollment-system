/**
 * Student Validators
 * Validation rules for student endpoints
 */

import { body, query } from 'express-validator';
import { VALIDATION, ERROR_MESSAGES } from '../config/constants.js';

/**
 * Update profile validation rules
 */
export const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: VALIDATION.NAME_MIN_LENGTH, max: VALIDATION.NAME_MAX_LENGTH })
    .withMessage(`Name must be between ${VALIDATION.NAME_MIN_LENGTH} and ${VALIDATION.NAME_MAX_LENGTH} characters`)
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(ERROR_MESSAGES.INVALID_NAME_FORMAT),

  body('studentNumber')
    .optional()
    .trim()
    .isLength({ max: VALIDATION.STUDENT_NUMBER_MAX_LENGTH })
    .withMessage(`Student number must not exceed ${VALIDATION.STUDENT_NUMBER_MAX_LENGTH} characters`)
    .matches(/^[A-Z0-9-]+$/)
    .withMessage(ERROR_MESSAGES.INVALID_STUDENT_NUMBER_FORMAT),
];

/**
 * Search courses validation
 */
export const searchCoursesValidation = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
    
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage(ERROR_MESSAGES.INVALID_DATA)
    .toInt(),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage(`Limit must be between 1 and 100`)
    .toInt(),
];
