/**
 * Enrollment Validators
 * Validation rules for enrollment endpoints
 */

import { body, param } from 'express-validator';
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
 * Drop enrollment validation rules
 */
export const dropEnrollmentValidation = [
  param('enrollmentId')
    .isInt({ min: 1 })
    .withMessage(ERROR_MESSAGES.INVALID_DATA)
    .toInt(),
];
