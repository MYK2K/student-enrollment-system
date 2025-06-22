/**
 * Admin Controller
 * Handles admin-related HTTP requests
 */

import * as adminService from '../services/admin.service.js';
import { 
  sendResponse, 
  sendConflict,
  sendServerError 
} from '../utils/response.utils.js';
import { logger } from '../utils/logger.js';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../config/constants.js';

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
