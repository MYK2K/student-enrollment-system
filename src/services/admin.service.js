/**
 * Admin Service
 * Business logic for admin operations
 */

import { DateTime } from 'luxon';
import { prisma } from '../models/index.js';
import { logger } from '../utils/logger.js';
import { ERROR_MESSAGES } from '../config/constants.js';

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
