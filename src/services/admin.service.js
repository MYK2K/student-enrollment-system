/**
 * Admin Service
 * Business logic for admin operations
 */

import { DateTime } from 'luxon';
import { prisma } from '../models/index.js';
import { logger } from '../utils/logger.js';
import { ERROR_MESSAGES, USER_ROLES } from '../config/constants.js';
import { hashPassword, generateRandomPassword } from '../utils/bcrypt.utils.js';

/**
 * Get dashboard statistics
 * @param {number} adminId - Admin user ID
 * @returns {Promise<Object>} Dashboard stats
 */
export const getDashboardStats = async (adminId) => {
  const admin = await prisma.collegeAdmin.findUnique({
    where: { userId: adminId }
  });

  if (!admin) {
    throw new Error('Admin not found');
  }

  const [totalStudents, totalCourses, totalEnrollments, recentEnrollments] = await Promise.all([
    prisma.student.count({
      where: { collegeId: admin.collegeId }
    }),
    prisma.course.count({
      where: { collegeId: admin.collegeId }
    }),
    prisma.enrollment.count({
      where: {
        course: { collegeId: admin.collegeId }
      }
    }),
    prisma.enrollment.findMany({
      where: {
        course: { collegeId: admin.collegeId }
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        student: true,
        course: true
      }
    })
  ]);

  // Get courses with enrollment counts
  const popularCourses = await prisma.course.findMany({
    where: { collegeId: admin.collegeId },
    take: 5,
    orderBy: {
      enrollments: {
        _count: 'desc'
      }
    },
    include: {
      _count: {
        select: { enrollments: true }
      }
    }
  });

  return {
    totalStudents,
    totalCourses,
    totalEnrollments,
    averageEnrollmentPerCourse: totalCourses > 0 ? (totalEnrollments / totalCourses).toFixed(2) : 0,
    popularCourses,
    recentEnrollments: recentEnrollments.map(e => ({
      studentName: e.student.name,
      courseCode: e.course.code,
      enrolledAt: e.createdAt
    }))
  };
};

/**
 * Create a new course
 * @param {number} adminId - Admin user ID
 * @param {Object} courseData - Course data
 * @returns {Promise<Object>} Created course
 */
export const createCourse = async (adminId, courseData) => {
  const admin = await prisma.collegeAdmin.findUnique({
    where: { userId: adminId }
  });

  if (!admin) {
    throw new Error('Admin not found');
  }

  // Check if course code already exists in the college
  const existingCourse = await prisma.course.findFirst({
    where: {
      code: courseData.code,
      collegeId: admin.collegeId
    }
  });

  if (existingCourse) {
    throw new Error(ERROR_MESSAGES.COURSE_CODE_EXISTS);
  }

  const course = await prisma.course.create({
    data: {
      ...courseData,
      collegeId: admin.collegeId
    }
  });

  logger.info(`Course created: ${course.code} by admin ${adminId}`);

  return course;
};

/**
 * Update course
 * @param {number} courseId - Course ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated course
 */
export const updateCourse = async (courseId, updateData) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId }
  });

  if (!course) {
    throw new Error(ERROR_MESSAGES.COURSE_NOT_FOUND);
  }

  // If updating code, check uniqueness
  if (updateData.code && updateData.code !== course.code) {
    const existingCourse = await prisma.course.findFirst({
      where: {
        code: updateData.code,
        collegeId: course.collegeId,
        id: { not: courseId }
      }
    });

    if (existingCourse) {
      throw new Error(ERROR_MESSAGES.COURSE_CODE_EXISTS);
    }
  }

  const updatedCourse = await prisma.course.update({
    where: { id: courseId },
    data: updateData
  });

  logger.info(`Course updated: ${updatedCourse.code}`);

  return updatedCourse;
};

/**
 * Delete course
 * @param {number} courseId - Course ID
 * @returns {Promise<void>}
 */
export const deleteCourse = async (courseId) => {
  // Check if course has enrollments
  const enrollmentCount = await prisma.enrollment.count({
    where: { courseId }
  });

  if (enrollmentCount > 0) {
    throw new Error('Cannot delete course with enrolled students');
  }

  // Delete timetables first
  await prisma.timetable.deleteMany({
    where: { courseId }
  });

  // Delete course
  await prisma.course.delete({
    where: { id: courseId }
  });

  logger.info(`Course deleted: ${courseId}`);
};

/**
 * Manage course timetable
 * @param {number} courseId - Course ID
 * @param {Array} timetableData - Timetable slots
 * @returns {Promise<Object>} Updated timetable
 */
export const manageTimetable = async (courseId, timetableData) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId }
  });

  if (!course) {
    throw new Error(ERROR_MESSAGES.COURSE_NOT_FOUND);
  }

  // Get IDs of all students enrolled in this course
  const enrolledStudentIds = (await prisma.student.findMany({
    where: { enrollments: { some: { courseId } } },
    select: { id: true }
  })).map(s => s.id);

  // If students are enrolled, check for potential conflicts from this update
  if (enrolledStudentIds.length > 0) {
    // Fetch all timetables for these students' *other* courses in one go
    const studentSchedules = await prisma.timetable.findMany({
      where: {
        course: {
          enrollments: { some: { studentId: { in: enrolledStudentIds } } },
          id: { not: courseId } // Exclude the course being updated
        }
      }
    });

    // Check for conflicts in memory
    for (const newSlot of timetableData) {
      const newStartTime = DateTime.fromFormat(newSlot.startTime, 'HH:mm');
      const newEndTime = DateTime.fromFormat(newSlot.endTime, 'HH:mm');

      for (const existingSlot of studentSchedules) {
        if (newSlot.dayOfWeek === existingSlot.dayOfWeek) {
          const existingStartTime = DateTime.fromJSDate(existingSlot.startTime);
          const existingEndTime = DateTime.fromJSDate(existingSlot.endTime);
          
          if (newStartTime < existingEndTime && existingStartTime < newEndTime) {
            throw new Error(ERROR_MESSAGES.TIMETABLE_UPDATE_CONFLICT);
          }
        }
      }
    }
  }

  // Use a transaction to ensure atomicity
  await prisma.$transaction([
    // Delete existing timetable
    prisma.timetable.deleteMany({
      where: { courseId }
    }),
    // Create new timetable with proper DateTime conversion
    prisma.timetable.createMany({
      data: timetableData.map(slot => ({
        courseId,
        dayOfWeek: slot.dayOfWeek,
        startTime: DateTime.fromFormat(slot.startTime, 'HH:mm').toJSDate(),
        endTime: DateTime.fromFormat(slot.endTime, 'HH:mm').toJSDate(),
      }))
    })
  ]);

  logger.info(`Timetable updated for course ${courseId}`);

  return { courseId, slots: timetableData };
};

/**
 * Delete timetable slot
 * @param {number} adminId - Admin user ID
 * @param {number} timetableId - Timetable ID
 * @returns {Promise<void>}
 */
export const deleteTimetableSlot = async (adminId, timetableId) => {
  const timetable = await prisma.timetable.findUnique({
    where: { id: timetableId },
    include: {
      course: true
    }
  });

  if (!timetable) {
    throw new Error('Timetable slot not found');
  }

  // Verify admin has access to this course
  const admin = await prisma.collegeAdmin.findUnique({
    where: { userId: adminId }
  });

  if (timetable.course.collegeId !== admin.collegeId) {
    throw new Error('Unauthorized');
  }

  await prisma.timetable.delete({
    where: { id: timetableId }
  });

  logger.info(`Timetable slot ${timetableId} deleted`);
};

/**
 * Get students in admin's college
 * @param {number} adminId - Admin user ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Students and total
 */
export const getStudents = async (adminId, options = {}) => {
  const { skip = 0, take = 20, search } = options;

  const admin = await prisma.collegeAdmin.findUnique({
    where: { userId: adminId }
  });

  if (!admin) {
    throw new Error('Admin not found');
  }

  const where = {
    collegeId: admin.collegeId,
    ...(search && {
      OR: [
        { name: { contains: search } },
        { studentNumber: { contains: search } },
        { user: { email: { contains: search } } }
      ]
    })
  };

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            email: true,
            isActive: true
          }
        },
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: { name: 'asc' }
    }),
    prisma.student.count({ where })
  ]);

  return { students, total };
};

/**
 * Get student details
 * @param {number} adminId - Admin user ID
 * @param {number} studentId - Student ID
 * @returns {Promise<Object>} Student details
 */
export const getStudentDetails = async (adminId, studentId) => {
  const admin = await prisma.collegeAdmin.findUnique({
    where: { userId: adminId }
  });

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: {
        select: {
          email: true,
          isActive: true,
          createdAt: true
        }
      },
      college: true,
      enrollments: {
        include: {
          course: {
            include: {
              timetables: true
            }
          }
        }
      }
    }
  });

  if (!student || student.collegeId !== admin.collegeId) {
    return null;
  }

  return student;
};

/**
 * Bulk import students
 * @param {number} adminId - Admin user ID
 * @param {Array} students - Student data array
 * @param {string} defaultPassword - Default password for all students
 * @returns {Promise<Object>} Import results
 */
export const bulkImportStudents = async (adminId, students, defaultPassword) => {
  const admin = await prisma.collegeAdmin.findUnique({
    where: { userId: adminId }
  });

  if (!admin) {
    throw new Error('Admin not found');
  }

  const imported = [];
  const failed = [];
  const password = defaultPassword || generateRandomPassword();
  const hashedPassword = await hashPassword(password);

  for (const studentData of students) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: studentData.email }
      });

      if (existingUser) {
        failed.push({
          email: studentData.email,
          reason: 'Email already exists'
        });
        continue;
      }

      // Create user and student in transaction
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: studentData.email,
            password: hashedPassword,
            role: USER_ROLES.STUDENT
          }
        });

        const student = await tx.student.create({
          data: {
            userId: user.id,
            collegeId: admin.collegeId,
            name: studentData.name,
            studentNumber: studentData.studentNumber
          }
        });

        return student;
      });

      imported.push({
        email: studentData.email,
        name: studentData.name,
        studentNumber: studentData.studentNumber,
        temporaryPassword: password
      });
    } catch (error) {
      logger.error(`Failed to import student ${studentData.email}:`, error);
      failed.push({
        email: studentData.email,
        reason: error.message
      });
    }
  }

  logger.info(`Bulk import completed - Imported: ${imported.length}, Failed: ${failed.length}`);

  return { imported, failed };
};

/**
 * Remove student enrollment
 * @param {number} adminId - Admin user ID
 * @param {number} studentId - Student ID
 * @param {number} enrollmentId - Enrollment ID
 * @returns {Promise<void>}
 */
export const removeStudentEnrollment = async (adminId, studentId, enrollmentId) => {
  const admin = await prisma.collegeAdmin.findUnique({
    where: { userId: adminId }
  });

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      student: true,
      course: true
    }
  });

  if (!enrollment || 
      enrollment.studentId !== studentId || 
      enrollment.course.collegeId !== admin.collegeId) {
    throw new Error('Enrollment not found or unauthorized');
  }

  await prisma.enrollment.delete({
    where: { id: enrollmentId }
  });

  logger.info(`Admin ${adminId} removed enrollment ${enrollmentId}`);
};

/**
 * Get enrollment report
 * @param {number} adminId - Admin user ID
 * @returns {Promise<Object>} Enrollment statistics
 */
export const getEnrollmentReport = async (adminId) => {
  const admin = await prisma.collegeAdmin.findUnique({
    where: { userId: adminId }
  });

  const courses = await prisma.course.findMany({
    where: { collegeId: admin.collegeId },
    include: {
      _count: {
        select: { enrollments: true }
      },
      enrollments: {
        select: {
          createdAt: true
        }
      }
    }
  });

  const report = courses.map(course => ({
    courseCode: course.code,
    courseName: course.name,
    totalEnrollments: course._count.enrollments,
    recentEnrollments: course.enrollments.filter(e => 
      e.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length
  }));

  return {
    courses: report,
    summary: {
      totalCourses: courses.length,
      totalEnrollments: report.reduce((sum, c) => sum + c.totalEnrollments, 0),
      averageEnrollmentPerCourse: (report.reduce((sum, c) => sum + c.totalEnrollments, 0) / courses.length).toFixed(2)
    }
  };
};

/**
 * Get course utilization report
 * @param {number} adminId - Admin user ID
 * @returns {Promise<Object>} Course report
 */
export const getCourseReport = async (adminId) => {
  const admin = await prisma.collegeAdmin.findUnique({
    where: { userId: adminId }
  });

  const courses = await prisma.course.findMany({
    where: { collegeId: admin.collegeId },
    include: {
      timetables: true,
      _count: {
        select: { enrollments: true }
      }
    }
  });

  const report = courses.map(course => ({
    courseCode: course.code,
    courseName: course.name,
    weeklyHours: course.timetables.reduce((total, slot) => {
      const start = DateTime.fromJSDate(slot.startTime);
      const end = DateTime.fromJSDate(slot.endTime);
      const { hours } = end.diff(start, 'hours').toObject();
      return total + (hours || 0);
    }, 0),
    enrollmentCount: course._count.enrollments,
    sessionsPerWeek: course.timetables.length
  }));

  return {
    courses: report,
    summary: {
      totalCourses: courses.length,
      totalWeeklyHours: report.reduce((sum, c) => sum + c.weeklyHours, 0),
      mostPopularCourse: report.length > 0 ? report.reduce((max, c) => 
        c.enrollmentCount > max.enrollmentCount ? c : max, report[0]
      ) : null
    }
  };
};
