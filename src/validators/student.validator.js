/**
 * Student Validators
 * Validation rules for student endpoints
 */

import { body, query } from 'express-validator';
import { VALIDATION } from '../config/constants.js';

/**
 * Update profile validation rules
 */
export const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: VALIDATION.NAME_MIN_LENGTH })
    .withMessage(`Name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters`)
    .isLength({ max: VALIDATION.NAME_MAX_LENGTH })
    .withMessage(`Name must not exceed ${VALIDATION.NAME_MAX_LENGTH} characters`)
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),

  body('studentNumber')
    .optional()
    .trim()
    .isLength({ max: VALIDATION.STUDENT_NUMBER_MAX_LENGTH })
    .withMessage(`Student number must not exceed ${VALIDATION.STUDENT_NUMBER_MAX_LENGTH} characters`)
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Student number can only contain uppercase letters, numbers, and hyphens'),
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
    .withMessage('Page must be a positive integer')
    .toInt(),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
];
