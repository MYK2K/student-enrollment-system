/**
 * Admin Validators
 * Validation rules for admin endpoints
 */

import { body, param, query } from 'express-validator';
import { VALIDATION } from '../config/constants.js';

/**
 * Get student validation
 */
export const getStudentValidation = [
  param('studentId')
    .isInt({ min: 1 })
    .withMessage('Invalid student ID')
    .toInt(),
];

/**
 * Bulk import students validation
 */
export const bulkImportStudentsValidation = [
  body('students')
    .isArray({ min: 1, max: 100 })
    .withMessage('Students must be an array with 1-100 entries'),

  body('students.*.email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),

  body('students.*.name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: VALIDATION.NAME_MIN_LENGTH, max: VALIDATION.NAME_MAX_LENGTH })
    .withMessage(`Name must be between ${VALIDATION.NAME_MIN_LENGTH} and ${VALIDATION.NAME_MAX_LENGTH} characters`),

  body('students.*.studentNumber')
    .trim()
    .notEmpty().withMessage('Student number is required')
    .isLength({ max: VALIDATION.STUDENT_NUMBER_MAX_LENGTH })
    .withMessage(`Student number must not exceed ${VALIDATION.STUDENT_NUMBER_MAX_LENGTH} characters`),

  // Optional: Set a default password for all imported students
  body('defaultPassword')
    .optional()
    .isLength({ min: VALIDATION.PASSWORD_MIN_LENGTH })
    .withMessage(`Default password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`),
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
    .withMessage('Start date must be a valid date')
    .toDate(),
    
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .toDate()
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate < req.query.startDate) {
        return false;
      }
      return true;
    })
    .withMessage('End date must be after start date'),
];

/**
 * Delete enrollment validation
 */
export const deleteEnrollmentValidation = [
  param('studentId')
    .isInt({ min: 1 })
    .withMessage('Invalid student ID')
    .toInt(),
    
  param('enrollmentId')
    .isInt({ min: 1 })
    .withMessage('Invalid enrollment ID')
    .toInt(),
];

/**
 * Timetable slot deletion validation
 */
export const deleteTimetableValidation = [
  param('timetableId')
    .isInt({ min: 1 })
    .withMessage('Invalid timetable ID')
    .toInt(),
];
