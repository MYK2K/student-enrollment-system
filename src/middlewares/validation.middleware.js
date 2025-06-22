/**
 * Validation Middleware
 * Wrapper for express-validator to handle validation results
 */

import { validationResult } from 'express-validator';
import { sendValidationError } from '../utils/response.utils.js';
import { logger } from '../utils/logger.js';

/**
 * Validate request using express-validator rules
 * @param {Array} validations - Array of validation rules
 * @returns {Function} Middleware function
 */
export const validate = (validations) => {
  return async (req, res, next) => {
    // Execute all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
      return next();
    }

    // Format errors
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    // Log validation errors
    logger.debug('Validation errors:', {
      endpoint: req.originalUrl,
      method: req.method,
      errors: formattedErrors
    });

    return sendValidationError(res, 'Validation failed', formattedErrors);
  };
};

/**
 * Validate array fields
 * @param {string} fieldName - Name of the array field
 * @param {Object} options - Validation options
 * @returns {Function} Middleware function
 */
export const validateArray = (fieldName, options = {}) => {
  const {
    minLength = 0,
    maxLength = Infinity,
    unique = false,
    location = 'body'
  } = options;

  return (req, res, next) => {
    const array = req[location][fieldName];

    if (!Array.isArray(array)) {
      return sendValidationError(res, 'Invalid data type', [{
        field: fieldName,
        message: `${fieldName} must be an array`,
        location
      }]);
    }

    if (array.length < minLength) {
      return sendValidationError(res, 'Array too short', [{
        field: fieldName,
        message: `${fieldName} must have at least ${minLength} items`,
        location
      }]);
    }

    if (array.length > maxLength) {
      return sendValidationError(res, 'Array too long', [{
        field: fieldName,
        message: `${fieldName} must have at most ${maxLength} items`,
        location
      }]);
    }

    if (unique && new Set(array).size !== array.length) {
      return sendValidationError(res, 'Duplicate values', [{
        field: fieldName,
        message: `${fieldName} must contain unique values`,
        location
      }]);
    }

    next();
  };
};
