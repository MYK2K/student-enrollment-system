/**
 * Course Routes
 * Handles course listing and details
 */

import { Router } from 'express';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware.js';
import { validate, validatePagination } from '../middlewares/validation.middleware.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
import { getCourseValidation, searchCoursesValidation } from '../validators/course.validator.js';
import * as courseController from '../controllers/course.controller.js';

const router = Router();

/**
 * @route   GET /api/courses
 * @desc    Get all courses (filtered by user's college if authenticated)
 * @access  Public (with optional auth for filtering)
 * @query   {page, limit, search, collegeId}
 */
router.get(
  '/',
  optionalAuth,
  validatePagination,
  validate(searchCoursesValidation),
  asyncHandler(courseController.getAllCourses)
);

/**
 * @route   GET /api/courses/:courseId
 * @desc    Get course details with timetable
 * @access  Public
 */
router.get(
  '/:courseId',
  validate(getCourseValidation),
  asyncHandler(courseController.getCourseById)
);

/**
 * @route   GET /api/courses/:courseId/timetable
 * @desc    Get course timetable
 * @access  Public
 */
router.get(
  '/:courseId/timetable',
  validate(getCourseValidation),
  asyncHandler(courseController.getCourseTimetable)
);

/**
 * @route   GET /api/courses/:courseId/students
 * @desc    Get enrolled students for a course
 * @access  Private (College Admin only)
 * @query   {page, limit}
 */
router.get(
  '/:courseId/students',
  authenticate,
  validatePagination,
  validate(getCourseValidation),
  asyncHandler(courseController.getEnrolledStudents)
);

export default router;
