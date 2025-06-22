/**
 * Enrollment Routes
 * Handles course enrollment operations
 */

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { isStudent } from '../middlewares/role.middleware.js';
import { validate, validateArray } from '../middlewares/validation.middleware.js';
import { enrollCoursesValidation } from '../validators/enrollment.validator.js';
import * as enrollmentController from '../controllers/enrollment.controller.js';

const router = Router();

// All routes require authentication and student role
router.use(authenticate, isStudent);

/**
 * @route   POST /api/enrollments
 * @desc    Enroll in multiple courses with conflict detection.
 *          This is an all-or-nothing operation.
 * @access  Private (Student only)
 * @body    {courseIds: []}
 */
router.post(
  '/',
  validateArray('courseIds', { minLength: 1, unique: true }),
  validate(enrollCoursesValidation),
  // No need for asyncHandler here as the controller now uses next(error)
  enrollmentController.enrollCourses
);

export default router;
