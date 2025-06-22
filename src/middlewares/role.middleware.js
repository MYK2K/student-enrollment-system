/**
 * Role-based Access Control Middleware
 * Restricts access based on user roles
 */

import { sendForbidden } from '../utils/response.utils.js';
import { USER_ROLES } from '../config/constants.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Check if user has required role(s)
 * @param {...string} allowedRoles - Allowed roles
 * @returns {Function} Middleware function
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return sendForbidden(res, 'Access denied: Authentication required');
    }

    // Check if user has allowed role
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.email} with role ${req.user.role}. Required roles: ${allowedRoles.join(', ')}`);
      return sendForbidden(res, 'Access denied: Insufficient privileges');
    }

    next();
  };
};

/**
 * Middleware to ensure user is a student
 */
export const isStudent = authorize(USER_ROLES.STUDENT);

/**
 * Middleware to ensure user is a college admin
 */
export const isCollegeAdmin = authorize(USER_ROLES.COLLEGE_ADMIN);

// /**
//  * Middleware to ensure user is either student or college admin
//  */
// export const isStudentOrAdmin = authorize(USER_ROLES.STUDENT, USER_ROLES.COLLEGE_ADMIN);

// /**
//  * Check if user owns the resource (for students)
//  * @param {string} paramName - Request parameter name containing student ID
//  * @returns {Function} Middleware function
//  */
// export const isResourceOwner = (paramName = 'studentId') => {
//   return async (req, res, next) => {
//     try {
//       // Only apply to students
//       if (req.user.role !== USER_ROLES.STUDENT) {
//         return next();
//       }

//       const resourceId = parseInt(req.params[paramName]) || parseInt(req.body[paramName]);
      
//       if (!resourceId) {
//         return sendForbidden(res, 'Resource ID not provided');
//       }

//       // Get student record for the authenticated user
//       const student = await prisma.student.findUnique({
//         where: { userId: req.user.id }
//       });

//       if (!student || student.id !== resourceId) {
//         logger.warn(`Student ${req.user.email} attempted to access resource belonging to student ID ${resourceId}`);
//         return sendForbidden(res, 'Access denied: You can only access your own resources');
//       }

//       // Attach student to request for convenience
//       req.student = student;
//       next();
//     } catch (error) {
//       logger.error('Resource owner check error:', error);
//       return sendForbidden(res, 'Access denied');
//     }
//   };
// };

/**
 * Check if admin belongs to the same college as the resource
 * @param {Function} getCollegeId - Function to extract college ID from request
 * @returns {Function} Middleware function
 */
export const isSameCollege = (getCollegeId) => {
  return async (req, res, next) => {
    try {
      // Only apply to college admins
      if (req.user.role !== USER_ROLES.COLLEGE_ADMIN) {
        return next();
      }

      // Get admin's college
      const admin = await prisma.collegeAdmin.findUnique({
        where: { userId: req.user.id }
      });

      if (!admin) {
        return sendForbidden(res, 'Admin record not found');
      }

      // Get resource's college ID
      const resourceCollegeId = await getCollegeId(req);
      
      if (!resourceCollegeId) {
        return sendForbidden(res, 'College information not found');
      }

      if (admin.collegeId !== resourceCollegeId) {
        logger.warn(`Admin ${req.user.email} from college ${admin.collegeId} attempted to access resource from college ${resourceCollegeId}`);
        return sendForbidden(res, 'Access denied: You can only manage resources from your own college');
      }

      // Attach admin to request for convenience
      req.admin = admin;
      next();
    } catch (error) {
      logger.error('Same college check error:', error);
      return sendForbidden(res, 'Access denied');
    }
  };
};
