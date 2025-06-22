/**
 * Admin Routes
 * Handles college admin operations
 */

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { isCollegeAdmin, isSameCollege } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
import { prisma } from '../config/database.js';
import {
  createTimetableValidation,
  updateTimetableValidation,
  deleteTimetableValidation
} from '../validators/admin.validator.js';
import * as adminController from '../controllers/admin.controller.js';

const router = Router();

// All routes require authentication and college admin role
router.use(authenticate, isCollegeAdmin);

// ========== Timetable Management ==========

/**
 * @route   POST /api/admin/courses/:courseId/timetable
 * @desc    Add new timetable slots to a course
 * @access  Private (College Admin only)
 * @body    [{dayOfWeek, startTime, endTime}]
 */
router.post(
  '/courses/:courseId/timetable',
  validate(createTimetableValidation),
  isSameCollege(async (req) => {
    const course = await prisma.course.findUnique({
      where: { id: parseInt(req.params.courseId) }
    });
    return course?.collegeId;
  }),
  asyncHandler(adminController.createTimetable)
);

/**
 * @route   PATCH /api/admin/timetables/:timetableId
 * @desc    Edit a specific timetable slot
 * @access  Private (College Admin only)
 * @body    {dayOfWeek?, startTime?, endTime?}
 */
router.patch(
  '/timetables/:timetableId',
  validate(updateTimetableValidation),
  asyncHandler(adminController.updateTimetableSlot)
);

/**
 * @route   DELETE /api/admin/timetables/:timetableId
 * @desc    Delete a timetable slot
 * @access  Private (College Admin only)
 */
router.delete(
  '/timetables/:timetableId',
  validate(deleteTimetableValidation),
  asyncHandler(adminController.deleteTimetableSlot)
);

export default router;
