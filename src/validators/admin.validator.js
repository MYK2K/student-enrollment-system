/**
 * Admin Validators
 * Validation rules for admin endpoints
 */

import { body, param } from 'express-validator';
import { DateTime } from 'luxon';
import { ERROR_MESSAGES } from '../config/constants.js';

/**
 * Create timetable validation
 */
export const createTimetableValidation = [
  param('courseId')
    .isInt({ min: 1 })
    .withMessage('Course ID must be a positive integer')
    .toInt(),

  body()
    .isArray({ min: 1 })
    .withMessage('Request body must be a non-empty array of timetable slots'),

  body('*.dayOfWeek')
    .isInt({ min: 1, max: 7 })
    .withMessage(ERROR_MESSAGES.INVALID_DAY_OF_WEEK)
    .toInt(),

  body('*.startTime')
    .notEmpty().withMessage(ERROR_MESSAGES.START_TIME_REQUIRED)
    .custom((time) => DateTime.fromFormat(time, 'HH:mm').isValid)
    .withMessage(ERROR_MESSAGES.INVALID_TIME_FORMAT),

  body('*.endTime')
    .notEmpty().withMessage(ERROR_MESSAGES.END_TIME_REQUIRED)
    .custom((time) => DateTime.fromFormat(time, 'HH:mm').isValid)
    .withMessage(ERROR_MESSAGES.INVALID_TIME_FORMAT)
    .custom((endTime, { req, path }) => {
      const index = parseInt(path.match(/\[(\d+)\]/)[1]);
      const { startTime } = req.body[index];
      const start = DateTime.fromFormat(startTime, 'HH:mm');
      const end = DateTime.fromFormat(endTime, 'HH:mm');

      if (start.isValid && end.isValid) {
        return end > start;
      }
      return false;
    })
    .withMessage(ERROR_MESSAGES.INVALID_TIME_RANGE),
];

/**
 * Update timetable validation
 */
export const updateTimetableValidation = [
  param('timetableId')
    .isInt({ min: 1 })
    .withMessage('Timetable ID must be a positive integer')
    .toInt(),

  body('dayOfWeek')
    .optional()
    .isInt({ min: 1, max: 7 })
    .withMessage(ERROR_MESSAGES.INVALID_DAY_OF_WEEK)
    .toInt(),

  body('startTime')
    .optional()
    .custom((time) => DateTime.fromFormat(time, 'HH:mm').isValid)
    .withMessage(ERROR_MESSAGES.INVALID_TIME_FORMAT),

  body('endTime')
    .optional()
    .custom((time) => DateTime.fromFormat(time, 'HH:mm').isValid)
    .withMessage(ERROR_MESSAGES.INVALID_TIME_FORMAT),

  body()
    .custom((data) => {
      // At least one field must be provided
      return data.dayOfWeek !== undefined
              || data.startTime !== undefined
              || data.endTime !== undefined;
    })
    .withMessage('At least one field must be provided for update'),

  body()
    .custom((data) => {
      // If both times are provided, validate range
      if (data.startTime && data.endTime) {
        const start = DateTime.fromFormat(data.startTime, 'HH:mm');
        const end = DateTime.fromFormat(data.endTime, 'HH:mm');
        return start.isValid && end.isValid && end > start;
      }
      return true;
    })
    .withMessage(ERROR_MESSAGES.INVALID_TIME_RANGE)
];

/**
 * Delete timetable validation
 */
export const deleteTimetableValidation = [
  param('timetableId')
    .isInt({ min: 1 })
    .withMessage('Timetable ID must be a positive integer')
    .toInt(),
];
