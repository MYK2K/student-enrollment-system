/**
 * Error Handling Middleware
 * Global error handler for the application
 */

import { sendServerError, sendValidationError, sendBadRequest } from '../utils/response.utils.js';
import { logger } from '../utils/logger.js';
import { Prisma } from '@prisma/client';
import { ERROR_MESSAGES, HTTP_STATUS } from '../config/constants.js';

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async error handler wrapper
 * Catches errors in async route handlers
 * @param {Function} fn - Async function
 * @returns {Function} Express middleware
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?.id,
  });

  // If response was already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(err, res);
  }

  // Handle Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    return sendBadRequest(res, ERROR_MESSAGES.INVALID_DATA);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.TOKEN_INVALID
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.TOKEN_EXPIRED
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return sendValidationError(res, ERROR_MESSAGES.VALIDATION_ERROR, err.errors);
  }

  // Handle custom application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors
    });
  }

  // Handle syntax errors (bad JSON)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendBadRequest(res, ERROR_MESSAGES.INVALID_JSON);
  }

  // Default error response
  const isDevelopment = process.env.NODE_ENV === 'development';
  const message = isDevelopment ? err.message : ERROR_MESSAGES.INTERNAL_ERROR;
  const stack = isDevelopment ? err.stack : undefined;

  sendServerError(res, message, stack);
};

/**
 * Handle Prisma specific errors
 * @param {Error} err - Prisma error
 * @param {Object} res - Express response object
 */
const handlePrismaError = (err, res) => {
  switch (err.code) {
    case 'P2002':
      // Unique constraint violation
      const field = err.meta?.target?.[0] || 'field';
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: ERROR_MESSAGES.DUPLICATE_ENTRY,
        errors: [{
          field,
          message: 'Must be unique'
        }]
      });

    case 'P2003':
      // Foreign key constraint violation
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_REFERENCE
      });

    case 'P2025':
      // Record not found
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.RECORD_NOT_FOUND
      });

    case 'P2016':
      // Query interpretation error
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.QUERY_ERROR
      });

    default:
      // Generic database error
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.DATABASE_ERROR
      });
  }
};

/**
 * 404 Not Found handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const notFoundHandler = (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: ERROR_MESSAGES.RESOURCE_NOT_FOUND,
    path: req.originalUrl
  });
};
