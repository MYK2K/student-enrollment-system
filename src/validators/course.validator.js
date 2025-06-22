/**
 * Course Validators
 * Validation rules for course endpoints
 */

import { body, param, query } from 'express-validator';
import { DateTime } from 'luxon';
import { VALIDATION, ERROR_MESSAGES } from '../config/constants.js';

/**
 * Get course validation
 */
export const getCourseValidation = [
  param('courseId')
    .isInt({ min: 1 })
    .withMessage('Invalid course ID')
    .toInt(),
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
    
  query('collegeId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid college ID')
    .toInt(),
];

/**
 * Create course validation
 */
export const createCourseValidation = [
  body('code')
    .trim()
    .notEmpty().withMessage('Course code is required')
    .isLength({ max: VALIDATION.CODE_MAX_LENGTH })
    .withMessage(`Course code must not exceed ${VALIDATION.CODE_MAX_LENGTH} characters`)
    .matches(/^[A-Z]{2,4}[0-9]{3,4}$/)
    .withMessage('Course code must be in format: 2-4 uppercase letters followed by 3-4 digits (e.g., CS101)'),

  body('name')
    .trim()
    .notEmpty().withMessage('Course name is required')
    .isLength({ min: VALIDATION.NAME_MIN_LENGTH, max: VALIDATION.NAME_MAX_LENGTH })
    .withMessage(`Course name must be between ${VALIDATION.NAME_MIN_LENGTH} and ${VALIDATION.NAME_MAX_LENGTH} characters`),

  body('description')
    .optional()
    .trim()
    .isLength({ max: VALIDATION.DESCRIPTION_MAX_LENGTH })
    .withMessage(`Description must not exceed ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters`),
];

/**
 * Update course validation
 */
export const updateCourseValidation = [
  param('courseId')
    .isInt({ min: 1 })
    .withMessage('Invalid course ID')
    .toInt(),

  body('code')
    .optional()
    .trim()
    .isLength({ max: VALIDATION.CODE_MAX_LENGTH })
    .withMessage(`Course code must not exceed ${VALIDATION.CODE_MAX_LENGTH} characters`)
    .matches(/^[A-Z]{2,4}[0-9]{3,4}$/)
    .withMessage('Course code must be in format: 2-4 uppercase letters followed by 3-4 digits'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: VALIDATION.NAME_MIN_LENGTH, max: VALIDATION.NAME_MAX_LENGTH })
    .withMessage(`Course name must be between ${VALIDATION.NAME_MIN_LENGTH} and ${VALIDATION.NAME_MAX_LENGTH} characters`),

  body('description')
    .optional()
    .trim()
    .isLength({ max: VALIDATION.DESCRIPTION_MAX_LENGTH })
    .withMessage(`Description must not exceed ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters`),
];

/**
 * Create/Update timetable validation
 */
export const timetableValidation = [
  body('courseId')
    .isInt({ min: 1 })
    .withMessage('Invalid course ID')
    .toInt(),

  body('timetable')
    .isArray({ min: 1 })
    .withMessage('Timetable must be a non-empty array'),

  body('timetable.*.dayOfWeek')
    .isInt({ min: 1, max: 7 })
    .withMessage(ERROR_MESSAGES.INVALID_DAY_OF_WEEK)
    .toInt(),

  body('timetable.*.startTime')
    .notEmpty().withMessage('Start time is required')
    .custom((time) => DateTime.fromFormat(time, 'HH:mm').isValid)
    .withMessage(ERROR_MESSAGES.INVALID_TIME_FORMAT),

  body('timetable.*.endTime')
    .notEmpty().withMessage('End time is required')
    .custom((time) => DateTime.fromFormat(time, 'HH:mm').isValid)
    .withMessage(ERROR_MESSAGES.INVALID_TIME_FORMAT)
    .custom((endTime, { req, path }) => {
      // Get the index of the current timetable slot from the path
      const index = path.match(/\[(\d+)\]/)[1];
      const startTime = req.body.timetable[index].startTime;
      
      // Parse with Luxon for a reliable comparison
      const start = DateTime.fromFormat(startTime, 'HH:mm');
      const end = DateTime.fromFormat(endTime, 'HH:mm');

      // Ensure both are valid before comparing
      if (start.isValid && end.isValid) {
        return end > start;
      }
      return false;
    })
    .withMessage(ERROR_MESSAGES.INVALID_TIME_RANGE),
];
