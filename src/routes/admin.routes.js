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
import { timetableValidation } from '../validators/enrollment.validator.js';
import { deleteTimetableValidation } from '../validators/admin.validator.js';
import * as adminController from '../controllers/admin.controller.js';

const router = Router();

// All routes require authentication and college admin role
router.use(authenticate, isCollegeAdmin);

// ========== Timetable Management ==========

/**
 * @route   POST /api/admin/timetables
 * @desc    Create or update course timetable
 * @access  Private (College Admin only)
 * @body    {courseId, timetable: [{dayOfWeek, startTime, endTime}]}
 */
router.post(
  '/timetables',
  validate(timetableValidation),
  isSameCollege(async (req) => {
    const course = await prisma.course.findUnique({
      where: { id: req.body.courseId }
    });
    return course?.collegeId;
  }),
  asyncHandler(adminController.manageTimetable)
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
