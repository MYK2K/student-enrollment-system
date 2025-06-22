/**
 * Course Controller
 * Handles course-related HTTP requests
 */

import * as courseService from '../services/course.service.js';
import { 
  sendResponse, 
  sendPaginatedResponse,
  sendNotFound,
  sendForbidden,
  sendServerError 
} from '../utils/response.utils.js';
import { logger } from '../utils/logger.js';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, USER_ROLES } from '../config/constants.js';

/**
 * Get all courses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllCourses = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search, collegeId } = req.query;
    
    // If user is authenticated and is a student, filter by their college
    let filters = {};
    if (req.user && req.user.role === USER_ROLES.STUDENT) {
      const student = await courseService.getStudentCollege(req.user.id);
      filters.collegeId = student.collegeId;
    } else if (collegeId) {
      filters.collegeId = parseInt(collegeId);
    }
    
    const result = await courseService.getAllCourses({
      skip,
      take: limit,
      search,
      ...filters
    });
    
    sendPaginatedResponse(res, result.courses, {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit)
    }, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    logger.error('Get all courses error:', error);
    sendServerError(res, error.message);
  }
};

/**
 * Get course by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await courseService.getCourseById(parseInt(courseId));
    
    if (!course) {
      return sendNotFound(res, ERROR_MESSAGES.COURSE_NOT_FOUND);
    }
    
    sendResponse(res, 200, SUCCESS_MESSAGES.FETCH_SUCCESS, course);
  } catch (error) {
    logger.error('Get course by ID error:', error);
    sendServerError(res, error.message);
  }
};

/**
 * Get course timetable
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getCourseTimetable = async (req, res) => {
  try {
    const { courseId } = req.params;
    const timetable = await courseService.getCourseTimetable(parseInt(courseId));
    
    if (!timetable) {
      return sendNotFound(res, ERROR_MESSAGES.COURSE_NOT_FOUND);
    }
    
    sendResponse(res, 200, SUCCESS_MESSAGES.FETCH_SUCCESS, timetable);
  } catch (error) {
    logger.error('Get course timetable error:', error);
    sendServerError(res, error.message);
  }
};

/**
 * Get enrolled students for a course
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getEnrolledStudents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page, limit, skip } = req.pagination;
    
    // Check if user has permission to view enrolled students
    if (req.user.role === USER_ROLES.COLLEGE_ADMIN) {
      // Verify admin belongs to the same college as the course
      const course = await courseService.getCourseById(parseInt(courseId));
      const admin = await courseService.getAdminCollege(req.user.id);
      
      if (!course || course.collegeId !== admin.collegeId) {
        return sendForbidden(res, 'You can only view students from your college courses');
      }
    }
    
    const result = await courseService.getEnrolledStudents(parseInt(courseId), {
      skip,
      take: limit
    });
    
    sendPaginatedResponse(res, result.students, {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit)
    }, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    logger.error('Get enrolled students error:', error);
    sendServerError(res, error.message);
  }
};
