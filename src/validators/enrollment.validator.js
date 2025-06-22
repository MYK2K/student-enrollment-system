/**
 * Enrollment Validators
 * Validation rules for enrollment endpoints
 */

import { body } from 'express-validator';
import { ERROR_MESSAGES } from '../config/constants.js';

/**
 * Enroll courses validation rules
 */
export const enrollCoursesValidation = [
  body('courseIds')
    .isArray({ min: 1 })
    .withMessage(ERROR_MESSAGES.COURSE_ID_ARRAY_EMPTY),
    
  body('courseIds.*')
    .isInt({ min: 1 })
    .withMessage(ERROR_MESSAGES.INVALID_ID_IN_ARRAY)
    .toInt(),
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
