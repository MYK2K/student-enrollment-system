/**
 * Enrollment Controller
 * Handles enrollment-related HTTP requests
 */

import * as enrollmentService from '../services/enrollment.service.js';
import { 
  sendResponse, 
  sendCreated,
  sendBadRequest,
  sendConflict,
  sendServerError 
} from '../utils/response.utils.js';
import { logger } from '../utils/logger.js';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../config/constants.js';

/**
 * Enroll in courses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const enrollCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseIds } = req.body;
    
    const result = await enrollmentService.enrollInCourses(userId, courseIds);
    
    if (result.conflicts.length > 0) {
      return sendConflict(res, ERROR_MESSAGES.TIMETABLE_CLASH, {
        conflicts: result.conflicts,
        enrolled: result.enrolled,
        failed: result.failed
      });
    }
    
    sendCreated(res, SUCCESS_MESSAGES.ENROLLMENT_SUCCESS, {
      enrolled: result.enrolled,
      failed: result.failed
    });
  } catch (error) {
    logger.error('Enrollment error:', error);
    
    if (error.message.includes('college')) {
      return sendBadRequest(res, ERROR_MESSAGES.COLLEGE_MISMATCH);
    }
    
    sendServerError(res, error.message);
  }
};

/**
 * Check for timetable conflicts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const checkConflicts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseIds } = req.body;
    
    const conflicts = await enrollmentService.checkTimetableConflicts(userId, courseIds);
    
    sendResponse(res, 200, SUCCESS_MESSAGES.FETCH_SUCCESS, {
      hasConflicts: conflicts.length > 0,
      conflicts
    });
  } catch (error) {
    logger.error('Check conflicts error:', error);
    sendServerError(res, error.message);
  }
};
