/**
 * Student Controller
 * Handles student-related HTTP requests
 */

import * as studentService from '../services/student.service.js';
import { 
  sendResponse, 
  sendPaginatedResponse,
  sendNotFound,
  sendServerError 
} from '../utils/response.utils.js';
import { logger } from '../utils/logger.js';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../config/constants.js';

/**
 * Get student profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await studentService.getStudentProfile(userId);
    
    if (!profile) {
      return sendNotFound(res, ERROR_MESSAGES.STUDENT_NOT_FOUND);
    }
    
    sendResponse(res, 200, SUCCESS_MESSAGES.FETCH_SUCCESS, profile);
  } catch (error) {
    logger.error('Get profile error:', error);
    sendServerError(res, error.message);
  }
};

/**
 * Update student profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    
    const updatedProfile = await studentService.updateStudentProfile(userId, updateData);
    
    sendResponse(res, 200, SUCCESS_MESSAGES.UPDATE_SUCCESS, updatedProfile);
  } catch (error) {
    logger.error('Update profile error:', error);
    sendServerError(res, error.message);
  }
};

/**
 * Get enrolled courses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, skip } = req.pagination;
    
    const result = await studentService.getEnrolledCourses(userId, {
      skip,
      take: limit
    });
    
    sendPaginatedResponse(res, result.courses, {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit)
    }, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    logger.error('Get enrolled courses error:', error);
    sendServerError(res, error.message);
  }
};

/**
 * Get available courses for enrollment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAvailableCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, skip } = req.pagination;
    const { search } = req.query;
    
    const result = await studentService.getAvailableCourses(userId, {
      skip,
      take: limit,
      search
    });
    
    sendPaginatedResponse(res, result.courses, {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit)
    }, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    logger.error('Get available courses error:', error);
    sendServerError(res, error.message);
  }
};

/**
 * Get student timetable
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getTimetable = async (req, res) => {
  try {
    const userId = req.user.id;
    const timetable = await studentService.getStudentTimetable(userId);
    
    sendResponse(res, 200, SUCCESS_MESSAGES.FETCH_SUCCESS, timetable);
  } catch (error) {
    logger.error('Get timetable error:', error);
    sendServerError(res, error.message);
  }
};

/**
 * Get enrollment history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getEnrollmentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, skip } = req.pagination;
    
    const result = await studentService.getEnrollmentHistory(userId, {
      skip,
      take: limit
    });
    
    sendPaginatedResponse(res, result.enrollments, {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit)
    }, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    logger.error('Get enrollment history error:', error);
    sendServerError(res, error.message);
  }
};
