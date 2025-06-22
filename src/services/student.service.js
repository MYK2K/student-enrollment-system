/**
 * Student Service
 * Business logic for student operations
 */

import { DateTime } from 'luxon';
import { prisma } from '../models/index.js';
import { logger } from '../utils/logger.js';
import { ERROR_MESSAGES } from '../config/constants.js';

/**
 * Get student profile
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Student profile
 */
export const getStudentProfile = async (userId) => {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          email: true,
          createdAt: true
        }
      },
      college: {
        select: {
          id: true,
          name: true,
          code: true
        }
      },
      enrollments: {
        select: {
          id: true
        }
      }
    }
  });

  if (!student) {
    throw new Error(ERROR_MESSAGES.STUDENT_NOT_FOUND);
  }

  return {
    id: student.id,
    email: student.user.email,
    name: student.name,
    studentNumber: student.studentNumber,
    college: student.college,
    totalEnrollments: student.enrollments.length,
    joinedAt: student.user.createdAt
  };
};

/**
 * Update student profile
 * @param {number} userId - User ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated profile
 */
export const updateStudentProfile = async (userId, updateData) => {
  const student = await prisma.student.update({
    where: { userId },
    data: updateData,
    include: {
      college: true
    }
  });

  logger.info(`Student profile updated: ${student.id}`);

  return student;
};

/**
 * Get enrolled courses
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Courses and total count
 */
export const getEnrolledCourses = async (userId, options = {}) => {
  const { skip = 0, take = 20 } = options;

  const student = await prisma.student.findUnique({
    where: { userId }
  });

  if (!student) {
    throw new Error(ERROR_MESSAGES.STUDENT_NOT_FOUND);
  }

  const [enrollments, total] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId: student.id },
      skip,
      take,
      include: {
        course: {
          include: {
            timetables: {
              orderBy: [
                { dayOfWeek: 'asc' },
                { startTime: 'asc' }
              ]
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.enrollment.count({
      where: { studentId: student.id }
    })
  ]);

  const formattedCourses = enrollments.map(enrollment => ({
    enrollmentId: enrollment.id,
    courseId: enrollment.course.id,
    code: enrollment.course.code,
    name: enrollment.course.name,
    description: enrollment.course.description,
    enrolledAt: enrollment.createdAt,
    timetable: enrollment.course.timetables.map(t => ({
      day: DateTime.local().set({ weekday: t.dayOfWeek }).toFormat('EEEE'),
      startTime: DateTime.fromJSDate(t.startTime).toFormat('HH:mm'),
      endTime: DateTime.fromJSDate(t.endTime).toFormat('HH:mm')
    }))
  }));

  return { courses: formattedCourses, total };
};

/**
 * Get available courses for enrollment
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Available courses and total count
 */
export const getAvailableCourses = async (userId, options = {}) => {
  const { skip = 0, take = 20, search } = options;

  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      enrollments: {
        select: { courseId: true }
      }
    }
  });

  if (!student) {
    throw new Error(ERROR_MESSAGES.STUDENT_NOT_FOUND);
  }

  const enrolledCourseIds = student.enrollments.map(e => e.courseId);

  const where = {
    collegeId: student.collegeId,
    id: { notIn: enrolledCourseIds },
    ...(search && {
      OR: [
        { code: { contains: search } },
        { name: { contains: search } }
      ]
    })
  };

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take,
      include: {
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

  const formattedCourses = courses.map(course => ({
    id: course.id,
    code: course.code,
    name: course.name,
    description: course.description,
    enrolledStudents: course._count.enrollments,
    timetable: course.timetables.map(t => ({
      day: DateTime.local().set({ weekday: t.dayOfWeek }).toFormat('EEEE'),
      dayOfWeek: t.dayOfWeek,
      startTime: DateTime.fromJSDate(t.startTime).toFormat('HH:mm'),
      endTime: DateTime.fromJSDate(t.endTime).toFormat('HH:mm')
    }))
  }));

  return { courses: formattedCourses, total };
};

/**
 * Get student timetable
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Weekly timetable
 */
export const getStudentTimetable = async (userId) => {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      enrollments: {
        include: {
          course: {
            include: {
              timetables: {
                orderBy: [
                  { dayOfWeek: 'asc' },
                  { startTime: 'asc' }
                ]
              }
            }
          }
        }
      }
    }
  });

  if (!student) {
    throw new Error(ERROR_MESSAGES.STUDENT_NOT_FOUND);
  }

  // Organize timetable by day
  const timetableByDay = {};
  for (let i = 1; i <= 7; i++) {
    timetableByDay[i] = [];
  }

  student.enrollments.forEach(enrollment => {
    enrollment.course.timetables.forEach(slot => {
      timetableByDay[slot.dayOfWeek].push({
        courseId: enrollment.course.id,
        courseCode: enrollment.course.code,
        courseName: enrollment.course.name,
        startTime: DateTime.fromJSDate(slot.startTime).toFormat('HH:mm'),
        endTime: DateTime.fromJSDate(slot.endTime).toFormat('HH:mm')
      });
    });
  });

  // Sort each day's slots by start time
  Object.keys(timetableByDay).forEach(day => {
    timetableByDay[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  return {
    studentName: student.name,
    timetable: Object.entries(timetableByDay).map(([day, slots]) => ({
      day: DateTime.local().set({ weekday: parseInt(day, 10) }).toFormat('EEEE'),
      dayOfWeek: parseInt(day, 10),
      slots
    }))
  };
};

/**
 * Get enrollment history
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Enrollment history
 */
export const getEnrollmentHistory = async (userId, options = {}) => {
  const { skip = 0, take = 20 } = options;

  const student = await prisma.student.findUnique({
    where: { userId }
  });

  if (!student) {
    throw new Error(ERROR_MESSAGES.STUDENT_NOT_FOUND);
  }

  const [enrollments, total] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId: student.id },
      skip,
      take,
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            college: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.enrollment.count({
      where: { studentId: student.id }
    })
  ]);

  return { enrollments, total };
};
