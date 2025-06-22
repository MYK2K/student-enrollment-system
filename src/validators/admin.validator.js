/**
 * Admin Validators
 * Validation rules for admin endpoints
 */

import { param } from 'express-validator';
import { ERROR_MESSAGES } from '../config/constants.js';

/**
 * Timetable slot deletion validation
 */
export const deleteTimetableValidation = [
  param('timetableId')
    .isInt({ min: 1 })
    .withMessage(ERROR_MESSAGES.INVALID_DATA)
    .toInt(),
];
