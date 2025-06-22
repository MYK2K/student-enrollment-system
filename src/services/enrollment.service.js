/**
 * Enrollment Service
 * Business logic for enrollment operations
 */

import { DateTime, Interval } from 'luxon';
import { prisma } from '../models/index.js';
import { logger } from '../utils/logger.js';
import { ERROR_MESSAGES, HTTP_STATUS } from '../config/constants.js';
import { AppError } from '../middlewares/error.middleware.js';

/**
 * Helper to find all timetable conflicts.
 * This is more efficient and readable using Luxon's Interval.
 * @param {Array} existingCourses - Courses the student is already enrolled in.
 * @param {Array} newCourses - New courses the student wants to enroll in.
 * @returns {Array} A list of conflict error objects.
 */
const findTimetableConflicts = (existingCourses, newCourses) => {
  const conflicts = [];
  
  // Create a flat list of all time intervals from the student's existing schedule
  const existingIntervals = existingCourses.flatMap(course =>
    course.timetables.map(slot => ({
      interval: Interval.fromDateTimes(DateTime.fromJSDate(slot.startTime), DateTime.fromJSDate(slot.endTime)),
      dayOfWeek: slot.dayOfWeek,
      courseCode: course.code,
    }))
  );

  // Create a flat list of all time intervals for the new courses
  const newIntervals = newCourses.flatMap(course =>
    course.timetables.map(slot => ({
      interval: Interval.fromDateTimes(DateTime.fromJSDate(slot.startTime), DateTime.fromJSDate(slot.endTime)),
      dayOfWeek: slot.dayOfWeek,
      courseCode: course.code,
    }))
  );
  
  // 1. Check for internal conflicts (new courses clashing with each other)
  for (let i = 0; i < newIntervals.length; i++) {
    for (let j = i + 1; j < newIntervals.length; j++) {
      const slotA = newIntervals[i];
      const slotB = newIntervals[j];
      
      if (slotA.dayOfWeek === slotB.dayOfWeek && slotA.interval.overlaps(slotB.interval)) {
        conflicts.push({
          type: 'INTERNAL',
          message: `Requested course ${slotA.courseCode} clashes with requested course ${slotB.courseCode}.`,
        });
      }
    }
  }

  // 2. Check for external conflicts (new courses clashing with existing schedule)
  for (const newSlot of newIntervals) {
    for (const existingSlot of existingIntervals) {
      if (newSlot.dayOfWeek === existingSlot.dayOfWeek && newSlot.interval.overlaps(existingSlot.interval)) {
        conflicts.push({
          type: 'EXTERNAL',
          message: `Requested course ${newSlot.courseCode} clashes with already enrolled course ${existingSlot.courseCode}.`,
        });
      }
    }
  }

  return conflicts;
};


/**
 * Enroll student in courses atomically.
 * All courses must be valid and conflict-free to be saved.
 * @param {number} userId - User ID
 * @param {Array<number>} courseIds - Course IDs to enroll in
 * @returns {Promise<Object>} An object containing the list of newly enrolled courses.
 * @throws {AppError} If validation fails or timetable conflicts are found.
 */
export const enrollInCourses = async (userId, courseIds) => {
  // === Phase 1: VALIDATE ===

  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      enrollments: {
        include: {
          course: {
            include: { timetables: true },
          },
        },
      },
    },
  });

  if (!student) {
    throw new AppError(ERROR_MESSAGES.STUDENT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  const requestedCourses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    include: { timetables: true },
  });

  if (requestedCourses.length !== courseIds.length) {
    const foundIds = new Set(requestedCourses.map(c => c.id));
    const notFoundIds = courseIds.filter(id => !foundIds.has(id));
    throw new AppError(`Course(s) not found: ${notFoundIds.join(', ')}`, HTTP_STATUS.NOT_FOUND);
  }

  const mismatchedCourse = requestedCourses.find(course => course.collegeId !== student.collegeId);
  if (mismatchedCourse) {
    throw new AppError(ERROR_MESSAGES.COLLEGE_MISMATCH, HTTP_STATUS.BAD_REQUEST);
  }

  const currentlyEnrolledIds = new Set(student.enrollments.map(e => e.courseId));
  const newCoursesToEnroll = requestedCourses.filter(course => !currentlyEnrolledIds.has(course.id));

  if (newCoursesToEnroll.length === 0) {
    logger.info(`Student ${student.id} attempted to enroll in courses they are already in. No action taken.`);
    return { enrolled: [], message: 'All requested courses are already enrolled.' };
  }

  // === Phase 2: CHECK ===

  const existingCourses = student.enrollments.map(e => e.course);
  const conflicts = findTimetableConflicts(existingCourses, newCoursesToEnroll);

  if (conflicts.length > 0) {
    logger.warn(`Timetable clash detected for student ${student.id}. Aborting enrollment.`);
    throw new AppError(ERROR_MESSAGES.TIMETABLE_CLASH, HTTP_STATUS.CONFLICT, conflicts);
  }

  // === Phase 3: COMMIT ===

  await prisma.enrollment.createMany({
    data: newCoursesToEnroll.map(course => ({
      studentId: student.id,
      courseId: course.id,
    })),
  });

  logger.info(`Student ${student.id} successfully enrolled in ${newCoursesToEnroll.length} new courses.`);

  const enrolled = newCoursesToEnroll.map(course => ({
    courseId: course.id,
    courseCode: course.code,
    courseName: course.name,
  }));

  return { enrolled };
};
