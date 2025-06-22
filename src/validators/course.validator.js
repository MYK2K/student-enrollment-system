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
    .withMessage(ERROR_MESSAGES.INVALID_DATA)
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
    .withMessage(ERROR_MESSAGES.INVALID_DATA)
    .toInt(),
];

/**
 * Create course validation
 */
export const createCourseValidation = [
  body('code')
    .trim()
    .notEmpty().withMessage(ERROR_MESSAGES.COURSE_CODE_REQUIRED)
    .isLength({ max: VALIDATION.CODE_MAX_LENGTH })
    .withMessage(`Course code must not exceed ${VALIDATION.CODE_MAX_LENGTH} characters`)
    .matches(/^[A-Z]{2,4}[0-9]{3,4}$/)
    .withMessage(ERROR_MESSAGES.INVALID_COURSE_CODE_FORMAT),

  body('name')
    .trim()
    .notEmpty().withMessage(ERROR_MESSAGES.COURSE_NAME_REQUIRED)
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
    .withMessage(ERROR_MESSAGES.INVALID_DATA)
    .toInt(),

  body('code')
    .optional()
    .trim()
    .isLength({ max: VALIDATION.CODE_MAX_LENGTH })
    .withMessage(`Course code must not exceed ${VALIDATION.CODE_MAX_LENGTH} characters`)
    .matches(/^[A-Z]{2,4}[0-9]{3,4}$/)
    .withMessage(ERROR_MESSAGES.INVALID_COURSE_CODE_FORMAT),

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
    .withMessage(ERROR_MESSAGES.INVALID_DATA)
    .toInt(),

  body('timetable')
    .isArray({ min: 1 })
    .withMessage(ERROR_MESSAGES.TIMETABLE_ARRAY_EMPTY),

  body('timetable.*.dayOfWeek')
    .isInt({ min: 1, max: 7 })
    .withMessage(ERROR_MESSAGES.INVALID_DAY_OF_WEEK)
    .toInt(),

  body('timetable.*.startTime')
    .notEmpty().withMessage(ERROR_MESSAGES.START_TIME_REQUIRED)
    .custom((time) => DateTime.fromFormat(time, 'HH:mm').isValid)
    .withMessage(ERROR_MESSAGES.INVALID_TIME_FORMAT),

  body('timetable.*.endTime')
    .notEmpty().withMessage(ERROR_MESSAGES.END_TIME_REQUIRED)
    .custom((time) => DateTime.fromFormat(time, 'HH:mm').isValid)
    .withMessage(ERROR_MESSAGES.INVALID_TIME_FORMAT)
    .custom((endTime, { req, path }) => {
      const index = path.match(/\[(\d+)\]/)[1];
      const startTime = req.body.timetable[index].startTime;
      
      const start = DateTime.fromFormat(startTime, 'HH:mm');
      const end = DateTime.fromFormat(endTime, 'HH:mm');

      if (start.isValid && end.isValid) {
        return end > start;
      }
      return false;
    })
    .withMessage(ERROR_MESSAGES.INVALID_TIME_RANGE),
];
