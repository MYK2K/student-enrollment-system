/**
 * Student Routes
 * Handles student-specific operations
 */

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { isStudent } from '../middlewares/role.middleware.js';
import { validate, validatePagination } from '../middlewares/validation.middleware.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
import { updateProfileValidation } from '../validators/student.validator.js';
import * as studentController from '../controllers/student.controller.js';

const router = Router();

// All routes require authentication and student role
router.use(authenticate, isStudent);

/**
 * @route   GET /api/students/profile
 * @desc    Get current student's profile
 * @access  Private (Student only)
 */
router.get(
  '/profile',
  asyncHandler(studentController.getProfile)
);

/**
 * @route   PUT /api/students/profile
 * @desc    Update student profile
 * @access  Private (Student only)
 * @body    {name, studentNumber}
 */
router.put(
  '/profile',
  validate(updateProfileValidation),
  asyncHandler(studentController.updateProfile)
);

/**
 * @route   GET /api/students/courses
 * @desc    Get enrolled courses for current student
 * @access  Private (Student only)
 * @query   {page, limit}
 */
router.get(
  '/courses',
  validatePagination,
  asyncHandler(studentController.getEnrolledCourses)
);

/**
 * @route   GET /api/students/available-courses
 * @desc    Get available courses for enrollment (from student's college)
 * @access  Private (Student only)
 * @query   {page, limit, search}
 */
router.get(
  '/available-courses',
  validatePagination,
  asyncHandler(studentController.getAvailableCourses)
);

/**
 * @route   GET /api/students/timetable
 * @desc    Get student's weekly timetable
 * @access  Private (Student only)
 */
router.get(
  '/timetable',
  asyncHandler(studentController.getTimetable)
);

/**
 * @route   GET /api/students/enrollments
 * @desc    Get detailed enrollment history
 * @access  Private (Student only)
 * @query   {page, limit}
 */
router.get(
  '/enrollments',
  validatePagination,
  asyncHandler(studentController.getEnrollmentHistory)
);

export default router;
