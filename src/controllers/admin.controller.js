/**
 * Admin Controller
 * Handles admin-related HTTP requests
 */

import * as adminService from '../services/admin.service.js';
import { 
  sendResponse, 
  sendCreated,
  sendPaginatedResponse,
  sendBadRequest,
  sendNotFound,
  sendConflict,
  sendServerError 
} from '../utils/response.utils.js';
import { logger } from '../utils/logger.js';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../config/constants.js';

/**
 * Get dashboard statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDashboardStats = async (req, res) => {
  try {
    const adminId = req.user.id;
    const stats = await adminService.getDashboardStats(adminId);
    
    sendResponse(res, 200, SUCCESS_MESSAGES.FETCH_SUCCESS, stats);
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    sendServerError(res, error.message);
  }
};

/**
 * Create course
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createCourse = async (req, res) => {
  try {
    const adminId = req.user.id;
    const courseData = req.body;
    
    const course = await adminService.createCourse(adminId, courseData);
    
    sendCreated(res, SUCCESS_MESSAGES.CREATE_SUCCESS, course);
  } catch (error) {
    logger.error('Create course error:', error);
    
    if (error.message.includes('already exists')) {
      return sendConflict(res, ERROR_MESSAGES.COURSE_CODE_EXISTS);
    }
    
    sendServerError(res, error.message);
  }
};

/**
 * Update course
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const updateData = req.body;
    
    const course = await adminService.updateCourse(parseInt(courseId), updateData);
    
    sendResponse(res, 200, SUCCESS_MESSAGES.UPDATE_SUCCESS, course);
  } catch (error) {
    logger.error('Update course error:', error);
    
    if (error.message.includes('not found')) {
      return sendNotFound(res, ERROR_MESSAGES.COURSE_NOT_FOUND);
    }
    
    sendServerError(res, error.message);
  }
};

/**
 * Delete course
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    await adminService.deleteCourse(parseInt(courseId));
    
    sendResponse(res, 200, SUCCESS_MESSAGES.DELETE_SUCCESS);
  } catch (error) {
    logger.error('Delete course error:', error);
    
    if (error.message.includes('students enrolled')) {
      return sendBadRequest(res, 'Cannot delete course with enrolled students');
    }
    
    sendServerError(res, error.message);
  }
};

/**
 * Manage timetable
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const manageTimetable = async (req, res) => {
  try {
    const { courseId, timetable } = req.body;
    
    const result = await adminService.manageTimetable(courseId, timetable);
    
    sendResponse(res, 200, SUCCESS_MESSAGES.UPDATE_SUCCESS, result);
  } catch (error) {
    logger.error('Manage timetable error:', error);
    
    if (error.message.includes('conflict')) {
      return sendConflict(res, ERROR_MESSAGES.TIMETABLE_UPDATE_CONFLICT);
    }
    
    sendServerError(res, error.message);
  }
};

/**
 * Delete timetable slot
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteTimetableSlot = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { timetableId } = req.params;
    
    await adminService.deleteTimetableSlot(adminId, parseInt(timetableId));
    
    sendResponse(res, 200, SUCCESS_MESSAGES.DELETE_SUCCESS);
  } catch (error) {
    logger.error('Delete timetable slot error:', error);
    sendServerError(res, error.message);
  }
};

/**
 * Get students
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getStudents = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { page, limit, skip } = req.pagination;
    const { search } = req.query;
    
    const result = await adminService.getStudents(adminId, {
      skip,
      take: limit,
      search
    });
    
    sendPaginatedResponse(res, result.students, {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit)
    }, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    logger.error('Get students error:', error);
    sendServerError(res, error.message);
  }
};

/**
 * Get student details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getStudentDetails = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { studentId } = req.params;
    
    const student = await adminService.getStudentDetails(adminId, parseInt(studentId));
    
    if (!student) {
      return sendNotFound(res, ERROR_MESSAGES.STUDENT_NOT_FOUND);
    }
    
    sendResponse(res, 200, SUCCESS_MESSAGES.FETCH_SUCCESS, student);
  } catch (error) {
    logger.error('Get student details error:', error);
    sendServerError(res, error.message);
  }
};

/**
 * Bulk import students
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const bulkImportStudents = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { students, defaultPassword } = req.body;
    
    const result = await adminService.bulkImportStudents(adminId, students, defaultPassword);
    
    sendCreated(res, 'Students imported successfully', {
      imported: result.imported,
      failed: result.failed,
      total: students.length
    });
  } catch (error) {
    logger.error('Bulk import students error:', error);
    sendServerError(res, error.message);
  }
};

/**
 * Remove student enrollment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const removeStudentEnrollment = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { studentId, enrollmentId } = req.params;
    
    await adminService.removeStudentEnrollment(
      adminId, 
      parseInt(studentId), 
      parseInt(enrollmentId)
    );
    
    sendResponse(res, 200, SUCCESS_MESSAGES.DELETE_SUCCESS);
  } catch (error) {
    logger.error('Remove student enrollment error:', error);
    sendServerError(res, error.message);
  }
};

/**
 * Get enrollment report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getEnrollmentReport = async (req, res) => {
  try {
    const adminId = req.user.id;
    const report = await adminService.getEnrollmentReport(adminId);
    
    sendResponse(res, 200, SUCCESS_MESSAGES.FETCH_SUCCESS, report);
  } catch (error) {
    logger.error('Get enrollment report error:', error);
    sendServerError(res, error.message);
  }
};

/**
 * Get course report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getCourseReport = async (req, res) => {
  try {
    const adminId = req.user.id;
    const report = await adminService.getCourseReport(adminId);
    
    sendResponse(res, 200, SUCCESS_MESSAGES.FETCH_SUCCESS, report);
  } catch (error) {
    logger.error('Get course report error:', error);
    sendServerError(res, error.message);
  }
};
