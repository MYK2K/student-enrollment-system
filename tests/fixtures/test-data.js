/**
 * Test Data Fixtures
 * Reusable test data for tests
 */

import { hashPassword } from '../../src/utils/bcrypt.utils.js';
import { USER_ROLES } from '../../src/config/constants.js';

// Test users
export const testUsers = {
  admin: {
    email: 'test.admin@college.edu',
    password: 'Admin@123456',
    role: USER_ROLES.COLLEGE_ADMIN
  },
  student: {
    email: 'test.student@college.edu',
    password: 'Student@123',
    role: USER_ROLES.STUDENT
  },
  student2: {
    email: 'test.student2@college.edu',
    password: 'Student@123',
    role: USER_ROLES.STUDENT
  }
};

// Test colleges
export const testColleges = {
  tech: {
    code: 'TEST01',
    name: 'Test Technology Institute'
  },
  science: {
    code: 'TEST02',
    name: 'Test Science College'
  }
};

// Test courses
export const testCourses = {
  programming: {
    code: 'CS101',
    name: 'Introduction to Programming',
    description: 'Learn programming basics'
  },
  dataStructures: {
    code: 'CS102',
    name: 'Data Structures',
    description: 'Learn data structures'
  },
  calculus: {
    code: 'MA101',
    name: 'Calculus I',
    description: 'Differential and integral calculus'
  }
};

// Test timetables
export const testTimetables = {
  morning: [
    { dayOfWeek: 1, startTime: '09:00:00', endTime: '10:00:00' },
    { dayOfWeek: 3, startTime: '09:00:00', endTime: '10:00:00' },
    { dayOfWeek: 5, startTime: '09:00:00', endTime: '10:00:00' }
  ],
  afternoon: [
    { dayOfWeek: 2, startTime: '14:00:00', endTime: '15:30:00' },
    { dayOfWeek: 4, startTime: '14:00:00', endTime: '15:30:00' }
  ],
  conflicting: [
    { dayOfWeek: 1, startTime: '09:30:00', endTime: '10:30:00' },
    { dayOfWeek: 3, startTime: '09:30:00', endTime: '10:30:00' }
  ]
};

// Helper functions
export async function createTestUser(prisma, userData, additionalData = {}) {
  const hashedPassword = await hashPassword(userData.password);
  
  return prisma.user.create({
    data: {
      email: userData.email,
      password: hashedPassword,
      role: userData.role,
      ...additionalData
    }
  });
}

export async function createTestCollege(prisma, collegeData) {
  return prisma.college.create({
    data: collegeData
  });
}

export async function createTestCourse(prisma, courseData, collegeId, timetable = []) {
  return prisma.course.create({
    data: {
      ...courseData,
      collegeId,
      ...(timetable.length > 0 && {
        timetables: {
          create: timetable
        }
      })
    },
    include: {
      timetables: true
    }
  });
}

export async function createTestStudent(prisma, userData, collegeId, studentData = {}) {
  const user = await createTestUser(prisma, userData);
  
  return prisma.student.create({
    data: {
      userId: user.id,
      collegeId,
      name: studentData.name || 'Test Student',
      studentNumber: studentData.studentNumber || 'TEST001',
      ...studentData
    },
    include: {
      user: true
    }
  });
}

export async function createTestAdmin(prisma, userData, collegeId) {
  const user = await createTestUser(prisma, userData);
  
  return prisma.collegeAdmin.create({
    data: {
      userId: user.id,
      collegeId
    },
    include: {
      user: true
    }
  });
}

// Create complete test setup
export async function createCompleteTestSetup(prisma) {
  // Create colleges
  const techCollege = await createTestCollege(prisma, testColleges.tech);
  const scienceCollege = await createTestCollege(prisma, testColleges.science);

  // Create admin users
  const techAdmin = await createTestAdmin(prisma, testUsers.admin, techCollege.id);

  // Create student users
  const student1 = await createTestStudent(prisma, testUsers.student, techCollege.id, {
    name: 'John Test',
    studentNumber: 'TEST001'
  });

  const student2 = await createTestStudent(prisma, testUsers.student2, techCollege.id, {
    name: 'Jane Test',
    studentNumber: 'TEST002'
  });

  // Create courses
  const course1 = await createTestCourse(
    prisma,
    testCourses.programming,
    techCollege.id,
    testTimetables.morning
  );

  const course2 = await createTestCourse(
    prisma,
    testCourses.dataStructures,
    techCollege.id,
    testTimetables.afternoon
  );

  const course3 = await createTestCourse(
    prisma,
    testCourses.calculus,
    techCollege.id,
    testTimetables.conflicting
  );

  return {
    colleges: { techCollege, scienceCollege },
    users: { techAdmin, student1, student2 },
    courses: { course1, course2, course3 }
  };
}
