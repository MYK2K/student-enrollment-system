/**
 * Enrollment Validators
 * Validation rules for enrollment endpoints
 */

import { body, param } from 'express-validator';

/**
 * Enroll courses validation rules
 */
export const enrollCoursesValidation = [
  body('courseIds')
    .isArray({ min: 1 })
    .withMessage('Course IDs must be a non-empty array'),
    
  body('courseIds.*')
    .isInt({ min: 1 })
    .withMessage('Each course ID must be a positive integer')
    .toInt(),
];

/**
 * Drop enrollment validation rules
 */
export const dropEnrollmentValidation = [
  param('enrollmentId')
    .isInt({ min: 1 })
    .withMessage('Invalid enrollment ID')
    .toInt(),
];
