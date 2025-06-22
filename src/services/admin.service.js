/**
 * Admin Service
 * Business logic for admin operations
 */

import { DateTime } from 'luxon';
import { prisma } from '../models/index.js';
import { logger } from '../utils/logger.js';
import { ERROR_MESSAGES } from '../config/constants.js';

/**
 * Convert time string to minutes since midnight for easy comparison
 * @param {string|Date} time - Time in HH:mm format or Date object
 * @returns {number} Minutes since midnight
 */
const timeToMinutes = (time) => {
  let dt;
  if (typeof time === 'string') {
    dt = DateTime.fromFormat(time, 'HH:mm');
  } else {
    dt = DateTime.fromJSDate(time);
  }
  return dt.hour * 60 + dt.minute;
};

/**
 * Convert time string to Date object for Prisma
 * @param {string} timeStr - Time in HH:mm format
 * @returns {Date} JavaScript Date object
 */
const timeStringToDate = (timeStr) => {
  return DateTime.fromFormat(timeStr, 'HH:mm').toJSDate();
};

/**
 * Format time for display
 * @param {Date} time - Time as Date object
 * @returns {string} Time in HH:mm format
 */
const formatTime = (time) => {
  return DateTime.fromJSDate(time).toFormat('HH:mm');
};

/**
 * Get day name from day number
 * @param {number} dayOfWeek - Day number (1-7)
 * @returns {string} Day name
 */
const getDayName = (dayOfWeek) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[dayOfWeek - 1];
};

/**
 * Check if two time slots overlap or are identical
 * @param {Object} slot1 - First time slot
 * @param {Object} slot2 - Second time slot
 * @returns {Object} {isIdentical: boolean, overlaps: boolean}
 */
const compareTimeSlots = (slot1, slot2) => {
  if (slot1.dayOfWeek !== slot2.dayOfWeek) {
    return { isIdentical: false, overlaps: false };
  }

  const start1 = timeToMinutes(slot1.startTime);
  const end1 = timeToMinutes(slot1.endTime);
  const start2 = timeToMinutes(slot2.startTime);
  const end2 = timeToMinutes(slot2.endTime);

  const isIdentical = start1 === start2 && end1 === end2;
  const overlaps = start1 < end2 && start2 < end1;

  return { isIdentical, overlaps };
};

/**
 * Create timetable slots for a course
 * @param {number} courseId - Course ID
 * @param {Array} timetableSlots - Array of timetable slots
 * @returns {Promise<Object>} Created timetable slots
 */
export const createTimetableSlots = async (courseId, timetableSlots) => {
  // Verify course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId }
  });

  if (!course) {
    throw new Error(ERROR_MESSAGES.COURSE_NOT_FOUND);
  }

  // Get existing timetable
  const existingSlots = await prisma.timetable.findMany({
    where: { courseId }
  });

  // Check new slots against existing slots and each other
  for (let i = 0; i < timetableSlots.length; i++) {
    const newSlot = timetableSlots[i];

    // Check against existing slots
    for (const existingSlot of existingSlots) {
      const comparison = compareTimeSlots(newSlot, existingSlot);

      if (comparison.isIdentical) {
        throw new Error(
          `Timetable slot already exists on ${getDayName(newSlot.dayOfWeek)} `
          + `from ${newSlot.startTime} to ${newSlot.endTime}`
        );
      }

      if (comparison.overlaps) {
        throw new Error(
          `Time conflict on ${getDayName(newSlot.dayOfWeek)}: `
          + `${newSlot.startTime}-${newSlot.endTime} overlaps with `
          + `${formatTime(existingSlot.startTime)}-${formatTime(existingSlot.endTime)}`
        );
      }
    }

    // Check against other new slots
    for (let j = i + 1; j < timetableSlots.length; j++) {
      const otherSlot = timetableSlots[j];
      const comparison = compareTimeSlots(newSlot, otherSlot);

      if (comparison.isIdentical || comparison.overlaps) {
        throw new Error(
          `Duplicate or overlapping slots in request for ${getDayName(newSlot.dayOfWeek)}`
        );
      }
    }
  }

  // Check for student conflicts
  const conflicts = await checkStudentConflicts(courseId, timetableSlots);
  if (conflicts.length > 0) {
    const error = new Error(ERROR_MESSAGES.TIMETABLE_UPDATE_CONFLICT);
    error.details = { conflicts };
    throw error;
  }

  // Create slots
  const { count } = await prisma.timetable.createMany({
    data: timetableSlots.map(slot => ({
      courseId,
      dayOfWeek: slot.dayOfWeek,
      startTime: timeStringToDate(slot.startTime),
      endTime: timeStringToDate(slot.endTime)
    }))
  });

  // Return all slots
  const allSlots = await prisma.timetable.findMany({
    where: { courseId },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
  });

  logger.info(`Created ${count} timetable slots for course ${courseId}`);

  return {
    courseId,
    created: count,
    slots: allSlots.map(slot => ({
      id: slot.id,
      dayOfWeek: slot.dayOfWeek,
      dayName: getDayName(slot.dayOfWeek),
      startTime: formatTime(slot.startTime),
      endTime: formatTime(slot.endTime)
    }))
  };
};

/**
 * Update a specific timetable slot
 * @param {number} adminId - Admin user ID
 * @param {number} timetableId - Timetable ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated timetable slot
 */
export const updateTimetableSlot = async (adminId, timetableId, updateData) => {
  // Get timetable with course
  const timetable = await prisma.timetable.findUnique({
    where: { id: timetableId },
    include: { course: true }
  });

  if (!timetable) {
    throw new Error(ERROR_MESSAGES.TIMETABLE_SLOT_NOT_FOUND);
  }

  // Verify admin access
  const admin = await prisma.collegeAdmin.findUnique({
    where: { userId: adminId }
  });

  if (timetable.course.collegeId !== admin.collegeId) {
    throw new Error(ERROR_MESSAGES.COLLEGE_ACCESS_DENIED);
  }

  // Prepare updated slot
  const updatedSlot = {
    dayOfWeek: updateData.dayOfWeek || timetable.dayOfWeek,
    startTime: updateData.startTime || formatTime(timetable.startTime),
    endTime: updateData.endTime || formatTime(timetable.endTime)
  };

  // Get other slots for this course
  const otherSlots = await prisma.timetable.findMany({
    where: {
      courseId: timetable.courseId,
      id: { not: timetableId }
    }
  });

  // Check for conflicts
  for (const otherSlot of otherSlots) {
    const comparison = compareTimeSlots(updatedSlot, otherSlot);

    if (comparison.isIdentical || comparison.overlaps) {
      throw new Error(
        `Time conflict on ${getDayName(updatedSlot.dayOfWeek)}: `
        + `${updatedSlot.startTime}-${updatedSlot.endTime} conflicts with existing schedule`
      );
    }
  }

  // Check student conflicts
  const conflicts = await checkStudentConflicts(timetable.courseId, [updatedSlot]);
  if (conflicts.length > 0) {
    const error = new Error(ERROR_MESSAGES.TIMETABLE_UPDATE_CONFLICT);
    error.details = { conflicts };
    throw error;
  }

  // Update
  const updated = await prisma.timetable.update({
    where: { id: timetableId },
    data: {
      dayOfWeek: updatedSlot.dayOfWeek,
      startTime: updateData.startTime ? timeStringToDate(updateData.startTime) : timetable.startTime,
      endTime: updateData.endTime ? timeStringToDate(updateData.endTime) : timetable.endTime
    }
  });

  logger.info(`Updated timetable slot ${timetableId}`);

  return {
    id: updated.id,
    courseId: updated.courseId,
    dayOfWeek: updated.dayOfWeek,
    dayName: getDayName(updated.dayOfWeek),
    startTime: formatTime(updated.startTime),
    endTime: formatTime(updated.endTime)
  };
};

/**
 * Delete timetable slot
 * @param {number} adminId - Admin user ID
 * @param {number} timetableId - Timetable ID
 * @returns {Promise<void>}
 */
export const deleteTimetableSlot = async (adminId, timetableId) => {
  // Get timetable with course
  const timetable = await prisma.timetable.findUnique({
    where: { id: timetableId },
    include: { course: true }
  });

  if (!timetable) {
    throw new Error(ERROR_MESSAGES.TIMETABLE_SLOT_NOT_FOUND);
  }

  // Verify admin access
  const admin = await prisma.collegeAdmin.findUnique({
    where: { userId: adminId }
  });

  if (timetable.course.collegeId !== admin.collegeId) {
    throw new Error(ERROR_MESSAGES.COLLEGE_ACCESS_DENIED);
  }

  await prisma.timetable.delete({
    where: { id: timetableId }
  });

  logger.info(`Deleted timetable slot ${timetableId}`);
};

/**
 * Check if timetable changes would create conflicts for enrolled students
 * @param {number} courseId - Course ID
 * @param {Array} newSlots - New timetable slots
 * @returns {Array} List of conflicts
 */
async function checkStudentConflicts(courseId, newSlots) {
  const conflicts = [];

  // Get enrolled students with their other courses
  const students = await prisma.student.findMany({
    where: { enrollments: { some: { courseId } } },
    include: {
      enrollments: {
        where: { courseId: { not: courseId } },
        include: {
          course: {
            include: { timetables: true }
          }
        }
      }
    }
  });

  // Check each student
  for (const student of students) {
    for (const newSlot of newSlots) {
      // Check against student's other courses
      for (const enrollment of student.enrollments) {
        for (const existingSlot of enrollment.course.timetables) {
          const comparison = compareTimeSlots(newSlot, existingSlot);

          if (comparison.overlaps) {
            conflicts.push({
              studentId: student.id,
              studentName: student.name,
              studentNumber: student.studentNumber,
              conflictingCourse: enrollment.course.code,
              message: `${getDayName(newSlot.dayOfWeek)}: ${newSlot.startTime}-${newSlot.endTime} `
                      + `conflicts with ${enrollment.course.code} `
                      + `(${formatTime(existingSlot.startTime)}-${formatTime(existingSlot.endTime)})`
            });
          }
        }
      }
    }
  }

  return conflicts;
}
