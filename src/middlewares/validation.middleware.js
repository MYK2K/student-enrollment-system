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
 * Sanitize request data
 * Removes any fields not explicitly allowed
 * @param {Array<string>} allowedFields - Array of allowed field names
 * @param {string} location - Request data location ('body', 'query', 'params')
 * @returns {Function} Middleware function
 */
export const sanitizeRequest = (allowedFields, location = 'body') => {
  return (req, res, next) => {
    if (!req[location]) {
      return next();
    }

    const sanitized = {};
    
    allowedFields.forEach(field => {
      if (req[location][field] !== undefined) {
        sanitized[field] = req[location][field];
      }
    });

    req[location] = sanitized;
    
    logger.debug(`Sanitized ${location} data`, {
      endpoint: req.originalUrl,
      allowedFields,
      sanitizedData: sanitized
    });
    
    next();
  };
};

/**
 * Transform request data
 * Apply transformations to specific fields
 * @param {Object} transformations - Object with field names and transform functions
 * @param {string} location - Request data location ('body', 'query', 'params')
 * @returns {Function} Middleware function
 */
export const transformRequest = (transformations, location = 'body') => {
  return (req, res, next) => {
    if (!req[location]) {
      return next();
    }

    Object.entries(transformations).forEach(([field, transformer]) => {
      if (req[location][field] !== undefined) {
        req[location][field] = transformer(req[location][field]);
      }
    });
    
    next();
  };
};

/**
 * Common transformations
 */
export const commonTransformations = {
  toLowerCase: (value) => value?.toLowerCase(),
  toUpperCase: (value) => value?.toUpperCase(),
  trim: (value) => value?.trim(),
  toNumber: (value) => Number(value),
  toBoolean: (value) => value === 'true' || value === true || value === 1 || value === '1',
  toArray: (value) => Array.isArray(value) ? value : [value],
  removeSpaces: (value) => value?.replace(/\s/g, ''),
  normalizeEmail: (value) => value?.toLowerCase().trim(),
};

/**
 * Pagination middleware
 * Validates and sets default pagination parameters
 */
export const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_SIZE) || 20;
  const maxLimit = parseInt(process.env.MAX_PAGE_SIZE) || 100;

  // Validate page
  if (page < 1) {
    return sendValidationError(res, 'Invalid page number', [
      { field: 'page', message: 'Page must be greater than 0' }
    ]);
  }

  // Validate limit
  if (limit < 1 || limit > maxLimit) {
    return sendValidationError(res, 'Invalid limit', [
      { field: 'limit', message: `Limit must be between 1 and ${maxLimit}` }
    ]);
  }

  // Set pagination params
  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit
  };

  next();
};

/**
 * Check if request has specific fields
 * @param {Array<string>} requiredFields - Required field names
 * @param {string} location - Request data location
 * @returns {Function} Middleware function
 */
export const requireFields = (requiredFields, location = 'body') => {
  return (req, res, next) => {
    const missingFields = [];
    
    requiredFields.forEach(field => {
      if (!req[location] || req[location][field] === undefined || req[location][field] === null || req[location][field] === '') {
        missingFields.push(field);
      }
    });
    
    if (missingFields.length > 0) {
      return sendValidationError(res, 'Required fields missing', 
        missingFields.map(field => ({
          field,
          message: `${field} is required`,
          location
        }))
      );
    }
    
    next();
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

/**
 * Conditional validation
 * Apply validation only if condition is met
 * @param {Function} condition - Function that returns boolean
 * @param {Array} validations - Array of validation rules
 * @returns {Function} Middleware function
 */
export const validateIf = (condition, validations) => {
  return async (req, res, next) => {
    if (condition(req)) {
      return validate(validations)(req, res, next);
    }
    next();
  };
};

/**
 * Custom validation wrapper
 * @param {Function} validator - Custom validation function
 * @param {string} errorMessage - Error message if validation fails
 * @returns {Function} Middleware function
 */
export const customValidation = (validator, errorMessage = 'Validation failed') => {
  return async (req, res, next) => {
    try {
      const isValid = await validator(req);
      
      if (!isValid) {
        return sendValidationError(res, errorMessage);
      }
      
      next();
    } catch (error) {
      logger.error('Custom validation error:', error);
      return sendValidationError(res, 'Validation error occurred');
    }
  };
};
