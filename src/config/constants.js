/**
 * Application Constants
 * Central location for all constant values used throughout the application
 */

// Re-export the Prisma Enum as the single source of truth for roles.
// The rest of the app will import USER_ROLES from this file.
import { UserRole } from '@prisma/client';
export { UserRole as USER_ROLES };


// API Configuration
export const API_PREFIX = process.env.API_PREFIX || '/api';
export const API_VERSION = process.env.API_VERSION || 'v1';

// Validation Constants
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  EMAIL_MAX_LENGTH: 255,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 255,
  CODE_MAX_LENGTH: 50,
  STUDENT_NUMBER_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 1000,
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: parseInt(process.env.DEFAULT_PAGE_SIZE) || 20,
  MAX_LIMIT: parseInt(process.env.MAX_PAGE_SIZE) || 100,
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Error Messages
export const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_INVALID: 'Invalid token',
  TOKEN_NOT_PROVIDED: 'No token provided',
  TOKEN_REQUIRED: 'Reset token is required',
  INACTIVE_USER: 'User account is inactive',
  
  // Validation
  VALIDATION_ERROR: 'Validation failed',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_PASSWORD: 'Password must be at least 8 characters long',
  PASSWORDS_NOT_MATCH: 'Passwords do not match',
  PASSWORD_CONFIRMATION_REQUIRED: 'Password confirmation is required',
  PASSWORD_SAME_AS_OLD: 'New password must be different from the current one',
  INVALID_DATA: 'Invalid data provided',
  INVALID_JSON: 'Invalid JSON payload',
  INVALID_DATE_FORMAT: 'Invalid date format, must be ISO8601',
  INVALID_COURSE_CODE_FORMAT: 'Course code must be in format: 2-4 uppercase letters followed by 3-4 digits (e.g., CS101)',
  INVALID_NAME_FORMAT: 'Name can only contain letters, spaces, hyphens, and apostrophes',
  INVALID_STUDENT_NUMBER_FORMAT: 'Student number can only contain uppercase letters, numbers, and hyphens',

  // Required Fields
  EMAIL_REQUIRED: 'Email is required',
  PASSWORD_REQUIRED: 'Password is required',
  ROLE_REQUIRED: 'Role is required',
  NAME_REQUIRED: 'Name is required',
  COLLEGE_ID_REQUIRED: 'College ID is required',
  COURSE_CODE_REQUIRED: 'Course code is required',
  COURSE_NAME_REQUIRED: 'Course name is required',
  STUDENT_NUMBER_REQUIRED: 'Student number is required for students',
  CURRENT_PASSWORD_REQUIRED: 'Current password is required',
  START_TIME_REQUIRED: 'Start time is required',
  END_TIME_REQUIRED: 'End time is required',
  
  // User
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User with this email already exists',
  USER_INACTIVE: 'User not found or inactive',
  
  // Student
  STUDENT_NOT_FOUND: 'Student not found',
  STUDENT_ALREADY_EXISTS: 'Student already exists',
  STUDENT_RECORD_NOT_FOUND: 'Student record not found',
  
  // Admin
  ADMIN_NOT_FOUND: 'Admin not found',
  ADMIN_RECORD_NOT_FOUND: 'Admin record not found',
  
  // College
  COLLEGE_NOT_FOUND: 'College not found',
  COLLEGE_MISMATCH: 'Student and courses must belong to the same college',
  COLLEGE_ACCESS_DENIED: 'You can only manage resources from your own college',
  
  // Course
  COURSE_NOT_FOUND: 'Course not found',
  COURSE_CODE_EXISTS: 'Course with this code already exists in the college',
  COURSE_DELETE_HAS_ENROLLMENTS: 'Cannot delete course with enrolled students',
  
  // Enrollment & Arrays
  ALREADY_ENROLLED: 'Student is already enrolled in this course',
  TIMETABLE_CLASH: 'Cannot enroll: timetable clash detected',
  NO_COURSES_PROVIDED: 'No courses provided for enrollment',
  ENROLLMENT_NOT_FOUND: 'Enrollment not found',
  ENROLLMENT_UNAUTHORIZED: 'You can only drop your own enrollments',
  COURSE_ID_ARRAY_EMPTY: 'Course IDs must be a non-empty array',
  TIMETABLE_ARRAY_EMPTY: 'Timetable must be a non-empty array',
  INVALID_ID_IN_ARRAY: 'Each ID in the array must be a positive integer',
  BULK_STUDENTS_ARRAY_LIMIT: 'Students array must contain between 1 and 100 entries',

  // Timetable
  INVALID_DAY_OF_WEEK: 'Day of week must be between 1 and 7',
  INVALID_TIME_RANGE: 'End time must be after start time',
  INVALID_TIME_FORMAT: 'Time must be in HH:mm format',
  TIMETABLE_UPDATE_CONFLICT: 'Cannot update timetable: would create conflicts for enrolled students',
  TIMETABLE_SLOT_NOT_FOUND: 'Timetable slot not found',
  
  // Database
  DATABASE_ERROR: 'Database operation failed',
  DUPLICATE_ENTRY: 'A record with this value already exists',
  FOREIGN_KEY_ERROR: 'Invalid reference: Related record not found',
  RECORD_NOT_FOUND: 'Record not found',
  QUERY_ERROR: 'Invalid query parameters',
  
  // General
  INTERNAL_ERROR: 'Internal server error',
  RESOURCE_NOT_FOUND: 'Resource not found',
  BAD_REQUEST: 'Bad request',
  ACCESS_DENIED: 'Access denied',
  OPERATION_FAILED: 'Operation failed',
  AUTHENTICATION_FAILED: 'Authentication failed',
  INVALID_REFERENCE: 'Invalid reference: Related record not found',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTER_SUCCESS: 'Registration successful',
  
  // Enrollment
  ENROLLMENT_SUCCESS: 'Enrollment successful',
  
  // CRUD Operations
  CREATE_SUCCESS: 'Created successfully',
  UPDATE_SUCCESS: 'Updated successfully',
  DELETE_SUCCESS: 'Deleted successfully',
  FETCH_SUCCESS: 'Data fetched successfully',
};

// JWT Configuration
export const JWT_CONFIG = {
  ALGORITHM: 'HS256',
  ISSUER: 'student-enrollment-system',
  AUDIENCE: 'student-enrollment-api',
};

// Cache TTL (in seconds)
export const CACHE_TTL = {
  USER_SESSION: 3600, // 1 hour
  COURSE_LIST: 300, // 5 minutes
  COLLEGE_INFO: 1800, // 30 minutes
};

// Regex Patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  COURSE_CODE: /^[A-Z]{2,4}[0-9]{3,4}$/,
};
