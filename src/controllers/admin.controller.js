/**
 * Admin Controller
 * Handles admin-related HTTP requests
 */

import * as adminService from '../services/admin.service.js';
import {
  sendResponse,
  sendCreated,
  sendNoContent,
  sendNotFound,
  sendBadRequest,
  sendConflict,
  sendServerError
} from '../utils/response.utils.js';
import { logger } from '../utils/logger.js';
import { ERROR_MESSAGES } from '../config/constants.js';

/**
 * Create timetable slots for a course
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createTimetable = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const timetableSlots = req.body;

    const result = await adminService.createTimetableSlots(courseId, timetableSlots);

    sendCreated(res, 'Timetable slots created successfully', result);
  } catch (error) {
    logger.error('Create timetable error:', error);

    if (error.message === ERROR_MESSAGES.COURSE_NOT_FOUND) {
      return sendNotFound(res, error.message);
    }

    if (error.message.includes('overlap') || error.message.includes('conflict')) {
      return sendConflict(res, error.message, error.details || null);
    }

    sendServerError(res, error.message);
  }
};

/**
 * Update a specific timetable slot
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateTimetableSlot = async (req, res) => {
  try {
    const adminId = req.user.id;
    const timetableId = parseInt(req.params.timetableId);
    const updateData = req.body;

    const result = await adminService.updateTimetableSlot(adminId, timetableId, updateData);

    sendResponse(res, 200, 'Timetable slot updated successfully', result);
  } catch (error) {
    logger.error('Update timetable slot error:', error);

    if (error.message === ERROR_MESSAGES.TIMETABLE_SLOT_NOT_FOUND) {
      return sendNotFound(res, error.message);
    }

    if (error.message === ERROR_MESSAGES.COLLEGE_ACCESS_DENIED) {
      return sendBadRequest(res, error.message);
    }

    if (error.message.includes('overlap') || error.message.includes('conflict')) {
      return sendConflict(res, error.message, error.details || null);
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
    const timetableId = parseInt(req.params.timetableId);

    await adminService.deleteTimetableSlot(adminId, timetableId);

    sendNoContent(res);
  } catch (error) {
    logger.error('Delete timetable slot error:', error);

    if (error.message === ERROR_MESSAGES.TIMETABLE_SLOT_NOT_FOUND) {
      return sendNotFound(res, error.message);
    }

    if (error.message === ERROR_MESSAGES.COLLEGE_ACCESS_DENIED) {
      return sendBadRequest(res, error.message);
    }

    sendServerError(res, error.message);
  }
};
