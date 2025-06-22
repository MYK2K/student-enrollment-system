/**
 * Enrollment Controller
 * Handles enrollment-related HTTP requests
 */

import * as enrollmentService from '../services/enrollment.service.js';
import { 
  sendCreated,
  sendConflict,
} from '../utils/response.utils.js';
import { logger } from '../utils/logger.js';
import { SUCCESS_MESSAGES, HTTP_STATUS } from '../config/constants.js';

/**
 * Enroll in courses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const enrollCourses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { courseIds } = req.body;
    
    const result = await enrollmentService.enrollInCourses(userId, courseIds);
    
    sendCreated(res, result.message || SUCCESS_MESSAGES.ENROLLMENT_SUCCESS, result);
  } catch (error) {
    // If the service threw a specific AppError for conflicts, handle it here
    if (error.statusCode === HTTP_STATUS.CONFLICT) {
      logger.debug('Caught timetable conflict in controller:', error.errors);
      return sendConflict(res, error.message, { conflicts: error.errors });
    }
    // For all other errors, pass them to the global error handler
    next(error);
  }
};
