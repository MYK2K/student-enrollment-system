/**
 * Enrollment Routes
 * Handles course enrollment operations
 */

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { isStudent } from '../middlewares/role.middleware.js';
import { validate, validateArray } from '../middlewares/validation.middleware.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
import { enrollCoursesValidation, dropEnrollmentValidation } from '../validators/enrollment.validator.js';
import * as enrollmentController from '../controllers/enrollment.controller.js';

const router = Router();

// All routes require authentication and student role
router.use(authenticate, isStudent);

/**
 * @route   POST /api/enrollments
 * @desc    Enroll in multiple courses
 * @access  Private (Student only)
 * @body    {courseIds: []}
 */
router.post(
  '/',
  validateArray('courseIds', { minLength: 1, unique: true }),
  validate(enrollCoursesValidation),
  asyncHandler(enrollmentController.enrollCourses)
);

/**
 * @route   GET /api/enrollments
 * @desc    Get current student's enrollments
 * @access  Private (Student only)
 */
router.get(
  '/',
  asyncHandler(enrollmentController.getMyEnrollments)
);

/**
 * @route   DELETE /api/enrollments/:enrollmentId
 * @desc    Drop a course enrollment
 * @access  Private (Student only)
 */
router.delete(
  '/:enrollmentId',
  validate(dropEnrollmentValidation),
  asyncHandler(enrollmentController.dropEnrollment)
);

/**
 * @route   POST /api/enrollments/check-conflicts
 * @desc    Check for timetable conflicts before enrollment
 * @access  Private (Student only)
 * @body    {courseIds: []}
 */
router.post(
  '/check-conflicts',
  validateArray('courseIds', { minLength: 1, unique: true }),
  validate(enrollCoursesValidation),
  asyncHandler(enrollmentController.checkConflicts)
);

export default router;
