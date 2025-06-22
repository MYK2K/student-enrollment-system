/**
 * Admin Routes
 * Handles college admin operations
 */

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { isCollegeAdmin, isSameCollege } from '../middlewares/role.middleware.js';
import { validate, validatePagination } from '../middlewares/validation.middleware.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
import { prisma } from '../config/database.js';
import { 
  createCourseValidation, 
  updateCourseValidation, 
  timetableValidation,
  getCourseValidation 
} from '../validators/course.validator.js';
import { 
  getStudentValidation,
  bulkImportStudentsValidation 
} from '../validators/admin.validator.js';
import * as adminController from '../controllers/admin.controller.js';

const router = Router();

// All routes require authentication and college admin role
router.use(authenticate, isCollegeAdmin);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Private (College Admin only)
 */
router.get(
  '/dashboard',
  asyncHandler(adminController.getDashboardStats)
);

// ========== Course Management ==========

/**
 * @route   POST /api/admin/courses
 * @desc    Create a new course
 * @access  Private (College Admin only)
 * @body    {code, name, description}
 */
router.post(
  '/courses',
  validate(createCourseValidation),
  asyncHandler(adminController.createCourse)
);

/**
 * @route   PUT /api/admin/courses/:courseId
 * @desc    Update course details
 * @access  Private (College Admin only)
 * @body    {code?, name?, description?}
 */
router.put(
  '/courses/:courseId',
  validate(updateCourseValidation),
  isSameCollege(async (req) => {
    const course = await prisma.course.findUnique({
      where: { id: parseInt(req.params.courseId) }
    });
    return course?.collegeId;
  }),
  asyncHandler(adminController.updateCourse)
);

/**
 * @route   DELETE /api/admin/courses/:courseId
 * @desc    Delete a course (if no students enrolled)
 * @access  Private (College Admin only)
 */
router.delete(
  '/courses/:courseId',
  validate(getCourseValidation),
  isSameCollege(async (req) => {
    const course = await prisma.course.findUnique({
      where: { id: parseInt(req.params.courseId) }
    });
    return course?.collegeId;
  }),
  asyncHandler(adminController.deleteCourse)
);

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
  asyncHandler(adminController.deleteTimetableSlot)
);

// ========== Student Management ==========

/**
 * @route   GET /api/admin/students
 * @desc    Get all students in admin's college
 * @access  Private (College Admin only)
 * @query   {page, limit, search}
 */
router.get(
  '/students',
  validatePagination,
  asyncHandler(adminController.getStudents)
);

/**
 * @route   GET /api/admin/students/:studentId
 * @desc    Get student details with enrollments
 * @access  Private (College Admin only)
 */
router.get(
  '/students/:studentId',
  validate(getStudentValidation),
  asyncHandler(adminController.getStudentDetails)
);

/**
 * @route   POST /api/admin/students/bulk-import
 * @desc    Bulk import students from CSV
 * @access  Private (College Admin only)
 * @body    {students: [{email, name, studentNumber}]}
 */
router.post(
  '/students/bulk-import',
  validate(bulkImportStudentsValidation),
  asyncHandler(adminController.bulkImportStudents)
);

/**
 * @route   DELETE /api/admin/students/:studentId/enrollments/:enrollmentId
 * @desc    Remove student from a course
 * @access  Private (College Admin only)
 */
router.delete(
  '/students/:studentId/enrollments/:enrollmentId',
  asyncHandler(adminController.removeStudentEnrollment)
);

// ========== Reports ==========

/**
 * @route   GET /api/admin/reports/enrollment
 * @desc    Get enrollment statistics report
 * @access  Private (College Admin only)
 */
router.get(
  '/reports/enrollment',
  asyncHandler(adminController.getEnrollmentReport)
);

/**
 * @route   GET /api/admin/reports/courses
 * @desc    Get course utilization report
 * @access  Private (College Admin only)
 */
router.get(
  '/reports/courses',
  asyncHandler(adminController.getCourseReport)
);

export default router;
