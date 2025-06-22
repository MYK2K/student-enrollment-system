/**
 * Response Utilities
 * Standardized response format for API endpoints
 */

import { HTTP_STATUS } from '../config/constants.js';

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {*} data - Response data
 * @param {Object} meta - Additional metadata
 */
export const sendResponse = (res, statusCode = HTTP_STATUS.OK, message = 'Success', data = null, meta = {}) => {
  const response = {
    success: true,
    message,
    data,
  };

  // Add metadata if provided
  if (Object.keys(meta).length > 0) {
    response.meta = meta;
  }

  // Add timestamp
  response.timestamp = new Date().toISOString();

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {*} errors - Error details
 */
export const sendError = (res, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, message = 'Error', errors = null) => {
  const response = {
    success: false,
    message,
  };

  // Add errors if provided
  if (errors) {
    response.errors = errors;
  }

  // Add timestamp
  response.timestamp = new Date().toISOString();

  // Add request ID if available
  if (res.locals.requestId) {
    response.requestId = res.locals.requestId;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of data items
 * @param {Object} pagination - Pagination details
 * @param {string} message - Success message
 */
export const sendPaginatedResponse = (res, data, pagination, message = 'Data fetched successfully') => {
  const { page, limit, total, totalPages } = pagination;

  const meta = {
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    }
  };

  return sendResponse(res, HTTP_STATUS.OK, message, data, meta);
};

/**
 * Send created response (201)
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {*} data - Created resource data
 */
export const sendCreated = (res, message = 'Resource created successfully', data = null) => {
  return sendResponse(res, HTTP_STATUS.CREATED, message, data);
};

/**
 * Send no content response (204)
 * @param {Object} res - Express response object
 */
export const sendNoContent = (res) => {
  return res.status(HTTP_STATUS.NO_CONTENT).send();
};

/**
 * Send bad request response (400)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {*} errors - Validation errors
 */
export const sendBadRequest = (res, message = 'Bad request', errors = null) => {
  return sendError(res, HTTP_STATUS.BAD_REQUEST, message, errors);
};

/**
 * Send unauthorized response (401)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const sendUnauthorized = (res, message = 'Unauthorized') => {
  return sendError(res, HTTP_STATUS.UNAUTHORIZED, message);
};

/**
 * Send forbidden response (403)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const sendForbidden = (res, message = 'Forbidden') => {
  return sendError(res, HTTP_STATUS.FORBIDDEN, message);
};

/**
 * Send not found response (404)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const sendNotFound = (res, message = 'Resource not found') => {
  return sendError(res, HTTP_STATUS.NOT_FOUND, message);
};

/**
 * Send conflict response (409)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {*} errors - Conflict details
 */
export const sendConflict = (res, message = 'Conflict', errors = null) => {
  return sendError(res, HTTP_STATUS.CONFLICT, message, errors);
};

/**
 * Send validation error response (422)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {*} errors - Validation errors
 */
export const sendValidationError = (res, message = 'Validation failed', errors = null) => {
  return sendError(res, HTTP_STATUS.UNPROCESSABLE_ENTITY, message, errors);
};

/**
 * Send internal server error response (500)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {*} error - Error details (only in development)
 */
export const sendServerError = (res, message = 'Internal server error', error = null) => {
  // Only send error details in development
  const errorDetails = process.env.NODE_ENV === 'development' ? error : null;
  return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, message, errorDetails);
};
