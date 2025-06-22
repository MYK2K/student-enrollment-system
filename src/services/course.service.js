/**
 * Course Service
 * Business logic for course operations
 */

import { prisma } from '../models/index.js';
import { logger } from '../utils/logger.js';
import { ERROR_MESSAGES } from '../config/constants.js';

/**
 * Get all courses with filters
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Courses and total count
 */
export const getAllCourses = async (options = {}) => {
  const { skip = 0, take = 20, search, collegeId } = options;

  const where = {
    ...(collegeId && { collegeId }),
    ...(search && {
      OR: [
        { code: { contains: search } },
        { name: { contains: search } },
        { description: { contains: search } }
      ]
    })
  };

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take,
      include: {
        college: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        timetables: {
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
          ]
        },
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: { code: 'asc' }
    }),
    prisma.course.count({ where })
  ]);

  return { courses, total };
};

/**
 * Get course by ID
 * @param {number} courseId - Course ID
 * @returns {Promise<Object>} Course details
 */
export const getCourseById = async (courseId) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      college: true,
      timetables: {
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ]
      },
      _count: {
        select: { enrollments: true }
      }
    }
  });

  return course;
};

/**
 * Get course timetable
 * @param {number} courseId - Course ID
 * @returns {Promise<Object>} Course timetable
 */
export const getCourseTimetable = async (courseId) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      code: true,
      name: true,
      timetables: {
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ]
      }
    }
  });

  if (!course) {
    return null;
  }

  return {
    courseId: course.id,
    courseCode: course.code,
    courseName: course.name,
    schedule: course.timetables
  };
};

/**
 * Get enrolled students for a course
 * @param {number} courseId - Course ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Students and total count
 */
export const getEnrolledStudents = async (courseId, options = {}) => {
  const { skip = 0, take = 20 } = options;

  const [enrollments, total] = await Promise.all([
    prisma.enrollment.findMany({
      where: { courseId },
      skip,
      take,
      include: {
        student: {
          include: {
            user: {
              select: {
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.enrollment.count({
      where: { courseId }
    })
  ]);

  const students = enrollments.map(enrollment => ({
    studentId: enrollment.student.id,
    name: enrollment.student.name,
    email: enrollment.student.user.email,
    studentNumber: enrollment.student.studentNumber,
    enrolledAt: enrollment.createdAt
  }));

  return { students, total };
};

/**
 * Get student's college
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Student with college
 */
export const getStudentCollege = async (userId) => {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: {
      collegeId: true
    }
  });

  return student;
};

/**
 * Get admin's college
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Admin with college
 */
export const getAdminCollege = async (userId) => {
  const admin = await prisma.collegeAdmin.findUnique({
    where: { userId },
    select: {
      collegeId: true
    }
  });

  return admin;
};
