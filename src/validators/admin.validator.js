/**
 * Admin Validators
 * Validation rules for admin endpoints
 */

import { body, param, query } from 'express-validator';
import { VALIDATION, ERROR_MESSAGES } from '../config/constants.js';

/**
 * Get student validation
 */
export const getStudentValidation = [
  param('studentId')
    .isInt({ min: 1 })
    .withMessage(ERROR_MESSAGES.INVALID_DATA)
    .toInt(),
];

/**
 * Bulk import students validation
 */
export const bulkImportStudentsValidation = [
  body('students')
    .isArray({ min: 1, max: 100 })
    .withMessage(ERROR_MESSAGES.BULK_STUDENTS_ARRAY_LIMIT),

  body('students.*.email')
    .trim()
    .notEmpty().withMessage(ERROR_MESSAGES.EMAIL_REQUIRED)
    .isEmail().withMessage(ERROR_MESSAGES.INVALID_EMAIL)
    .normalizeEmail(),

  body('students.*.name')
    .trim()
    .notEmpty().withMessage(ERROR_MESSAGES.NAME_REQUIRED)
    .isLength({ min: VALIDATION.NAME_MIN_LENGTH, max: VALIDATION.NAME_MAX_LENGTH })
    .withMessage(`Name must be between ${VALIDATION.NAME_MIN_LENGTH} and ${VALIDATION.NAME_MAX_LENGTH} characters`),

  body('students.*.studentNumber')
    .trim()
    .notEmpty().withMessage(ERROR_MESSAGES.STUDENT_NUMBER_REQUIRED)
    .isLength({ max: VALIDATION.STUDENT_NUMBER_MAX_LENGTH })
    .withMessage(`Student number must not exceed ${VALIDATION.STUDENT_NUMBER_MAX_LENGTH} characters`),

  body('defaultPassword')
    .optional()
    .isLength({ min: VALIDATION.PASSWORD_MIN_LENGTH })
    .withMessage(ERROR_MESSAGES.INVALID_PASSWORD),
];

/**
 * Search validation for admin endpoints
 */
export const adminSearchValidation = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
    
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage(ERROR_MESSAGES.INVALID_DATE_FORMAT)
    .toDate(),
    
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage(ERROR_MESSAGES.INVALID_DATE_FORMAT)
    .toDate()
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate < req.query.startDate) {
        return false;
      }
      return true;
    })
    .withMessage(ERROR_MESSAGES.INVALID_TIME_RANGE),
];

/**
 * Delete enrollment validation
 */
export const deleteEnrollmentValidation = [
  param('studentId')
    .isInt({ min: 1 })
    .withMessage(ERROR_MESSAGES.INVALID_DATA)
    .toInt(),
    
  param('enrollmentId')
    .isInt({ min: 1 })
    .withMessage(ERROR_MESSAGES.INVALID_DATA)
    .toInt(),
];

/**
 * Timetable slot deletion validation
 */
export const deleteTimetableValidation = [
  param('timetableId')
    .isInt({ min: 1 })
    .withMessage(ERROR_MESSAGES.INVALID_DATA)
    .toInt(),
];
