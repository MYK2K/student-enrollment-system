/**
 * Enrollment Service
 * Business logic for enrollment operations
 */

import { DateTime } from 'luxon';
import { prisma } from '../models/index.js';
import { logger } from '../utils/logger.js';
import { ERROR_MESSAGES } from '../config/constants.js';

/**
 * Helper function to check timetable conflicts
 * @param {Array} existingCourses - Currently enrolled courses with timetables
 * @param {Array} newCourses - Courses to check with timetables
 * @returns {Array} Conflicts
 */
const checkTimetableConflictsHelper = (existingCourses, newCourses) => {
  const conflicts = [];

  for (const newCourse of newCourses) {
    for (const newSlot of newCourse.timetables) {
      for (const existingCourse of existingCourses) {
        for (const existingSlot of existingCourse.timetables) {
          if (newSlot.dayOfWeek === existingSlot.dayOfWeek) {
            const newStartTime = DateTime.fromJSDate(newSlot.startTime);
            const newEndTime = DateTime.fromJSDate(newSlot.endTime);
            const existingStartTime = DateTime.fromJSDate(existingSlot.startTime);
            const existingEndTime = DateTime.fromJSDate(existingSlot.endTime);

            if (newStartTime < existingEndTime && existingStartTime < newEndTime) {
              conflicts.push({
                newCourseId: newCourse.id,
                newCourseCode: newCourse.code,
                existingCourseId: existingCourse.id,
                existingCourseCode: existingCourse.code,
                day: DateTime.local().set({ weekday: newSlot.dayOfWeek }).toFormat('EEEE'),
                conflictTime: `${newStartTime.toFormat('HH:mm')}-${newEndTime.toFormat('HH:mm')} overlaps with ${existingStartTime.toFormat('HH:mm')}-${existingEndTime.toFormat('HH:mm')}`
              });
            }
          }
        }
      }
    }
  }

  return conflicts;
}

/**
 * Enroll student in courses
 * @param {number} userId - User ID
 * @param {Array<number>} courseIds - Course IDs to enroll in
 * @returns {Promise<Object>} Enrollment results
 */
export const enrollInCourses = async (userId, courseIds) => {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
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

  if (!student) {
    throw new Error(ERROR_MESSAGES.STUDENT_NOT_FOUND);
  }

  const coursesToEnroll = await prisma.course.findMany({
    where: {
      id: { in: courseIds },
      collegeId: student.collegeId
    },
    include: {
      timetables: true
    }
  });

  if (coursesToEnroll.length !== courseIds.length) {
    throw new Error(ERROR_MESSAGES.COLLEGE_MISMATCH);
  }

  const existingCourseIds = student.enrollments.map(e => e.courseId);
  const newCourses = coursesToEnroll.filter(c => !existingCourseIds.includes(c.id));

  const conflicts = checkTimetableConflictsHelper(
    student.enrollments.map(e => e.course),
    newCourses
  );

  const enrolled = [];
  const failed = [];
  
  // Add courses with conflicts to the failed list first
  conflicts.forEach(conflict => {
    // Avoid adding the same failed course multiple times if it has multiple conflicts
    if (!failed.some(f => f.courseId === conflict.newCourseId)) {
      failed.push({
        courseId: conflict.newCourseId,
        courseCode: conflict.newCourseCode,
        reason: 'Timetable conflict'
      });
    }
  });
  
  // Determine which courses can actually be enrolled
  const failedCourseIds = new Set(failed.map(f => f.courseId));
  const coursesToCreate = newCourses.filter(course => !failedCourseIds.has(course.id));

  // Perform the database inserts in a single transaction
  if (coursesToCreate.length > 0) {
    try {
      await prisma.enrollment.createMany({
        data: coursesToCreate.map(course => ({
          studentId: student.id,
          courseId: course.id,
        })),
      });

      coursesToCreate.forEach(course => {
        enrolled.push({
          courseId: course.id,
          courseCode: course.code,
          courseName: course.name,
        });
      });
    } catch (error) {
      logger.error(`Enrollment transaction failed for student ${student.id}:`, error);
      coursesToCreate.forEach(course => {
        failed.push({
          courseId: course.id,
          courseCode: course.code,
          reason: 'Database transaction failed during enrollment'
        });
      });
      // Clear enrolled array as the transaction failed
      enrolled.length = 0;
    }
  }

  logger.info(`Student ${student.id} enrollment results - Enrolled: ${enrolled.length}, Failed: ${failed.length}`);

  return {
    enrolled,
    failed,
    conflicts: conflicts.map(c => ({
      ...c,
      message: `${c.newCourseCode} conflicts with ${c.existingCourseCode} on ${c.day}.`
    }))
  };
};

/**
 * Check timetable conflicts before enrollment
 * @param {number} userId - User ID
 * @param {Array<number>} courseIds - Course IDs to check
 * @returns {Promise<Array>} Conflicts
 */
export const checkTimetableConflicts = async (userId, courseIds) => {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
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

  if (!student) {
    throw new Error(ERROR_MESSAGES.STUDENT_NOT_FOUND);
  }

  const newCourses = await prisma.course.findMany({
    where: {
      id: { in: courseIds }
    },
    include: {
      timetables: true
    }
  });

  const existingCourses = student.enrollments.map(e => e.course);
  
  return checkTimetableConflictsHelper(existingCourses, newCourses);
};
