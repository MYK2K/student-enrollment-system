/**
 * Admin Integration Tests
 */

import request from 'supertest';
import app from '../../src/app.js';
import { prisma, clearDatabase } from '../setup.js';
import { createCompleteTestSetup } from '../fixtures/test-data.js';

describe('Admin Endpoints', () => {
  let testData;
  let adminToken;
  let studentToken;

  beforeEach(async () => {
    await clearDatabase();
    testData = await createCompleteTestSetup(prisma);

    // Get admin token
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: testData.users.techAdmin.user.email,
        password: 'Admin@123456'
      });
    adminToken = adminLogin.body.data.accessToken;

    // Get student token
    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: testData.users.student1.user.email,
        password: 'Student@123'
      });
    studentToken = studentLogin.body.data.accessToken;
  });

  describe('GET /api/admin/dashboard', () => {
    it('should get dashboard stats', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalStudents');
      expect(response.body.data).toHaveProperty('totalCourses');
      expect(response.body.data).toHaveProperty('totalEnrollments');
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/admin/courses', () => {
    it('should create a new course', async () => {
      const response = await request(app)
        .post('/api/admin/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'CS201',
          name: 'Advanced Programming',
          description: 'Advanced programming concepts'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe('CS201');
    });

    it('should prevent duplicate course codes', async () => {
      const response = await request(app)
        .post('/api/admin/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'CS101', // Already exists
          name: 'Different Course',
          description: 'Description'
        });

      expect(response.status).toBe(409);
    });
  });

  describe('PUT /api/admin/courses/:courseId', () => {
    it('should update course details', async () => {
      const response = await request(app)
        .put(`/api/admin/courses/${testData.courses.course1.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Course Name',
          description: 'Updated description'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Course Name');
    });
  });

  describe('DELETE /api/admin/courses/:courseId', () => {
    it('should delete course without enrollments', async () => {
      // Create a new course without enrollments
      const newCourse = await prisma.course.create({
        data: {
          code: 'DEL101',
          name: 'Course to Delete',
          collegeId: testData.colleges.techCollege.id
        }
      });

      const response = await request(app)
        .delete(`/api/admin/courses/${newCourse.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('should not delete course with enrollments', async () => {
      // Enroll a student
      await prisma.enrollment.create({
        data: {
          studentId: testData.users.student1.id,
          courseId: testData.courses.course1.id
        }
      });

      const response = await request(app)
        .delete(`/api/admin/courses/${testData.courses.course1.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/admin/timetables', () => {
    it('should create timetable for course', async () => {
      // Create course without timetable
      const course = await prisma.course.create({
        data: {
          code: 'NEW101',
          name: 'New Course',
          collegeId: testData.colleges.techCollege.id
        }
      });

      const response = await request(app)
        .post('/api/admin/timetables')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courseId: course.id,
          timetable: [
            { dayOfWeek: 2, startTime: '10:00', endTime: '11:00' },
            { dayOfWeek: 4, startTime: '10:00', endTime: '11:00' }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should prevent timetable changes that create conflicts', async () => {
      // Enroll student in both courses
      await prisma.enrollment.createMany({
        data: [
          { studentId: testData.users.student1.id, courseId: testData.courses.course1.id },
          { studentId: testData.users.student1.id, courseId: testData.courses.course2.id }
        ]
      });

      // Try to change course2 timetable to conflict with course1
      const response = await request(app)
        .post('/api/admin/timetables')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courseId: testData.courses.course2.id,
          timetable: [
            { dayOfWeek: 1, startTime: '09:00', endTime: '10:00' } // Conflicts with course1
          ]
        });

      expect(response.status).toBe(409);
    });
  });

  describe('GET /api/admin/students', () => {
    it('should get list of students', async () => {
      const response = await request(app)
        .get('/api/admin/students')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2); // 2 students in test data
    });

    it('should support search', async () => {
      const response = await request(app)
        .get('/api/admin/students?search=John')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('John Test');
    });
  });

  describe('POST /api/admin/students/bulk-import', () => {
    it('should bulk import students', async () => {
      const response = await request(app)
        .post('/api/admin/students/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          students: [
            {
              email: 'bulk1@test.edu',
              name: 'Bulk Student 1',
              studentNumber: 'BULK001'
            },
            {
              email: 'bulk2@test.edu',
              name: 'Bulk Student 2',
              studentNumber: 'BULK002'
            }
          ],
          defaultPassword: 'TempPass@123'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.imported).toHaveLength(2);
    });
  });

  describe('GET /api/admin/reports/enrollment', () => {
    beforeEach(async () => {
      // Create some enrollments
      await prisma.enrollment.createMany({
        data: [
          { studentId: testData.users.student1.id, courseId: testData.courses.course1.id },
          { studentId: testData.users.student1.id, courseId: testData.courses.course2.id },
          { studentId: testData.users.student2.id, courseId: testData.courses.course1.id }
        ]
      });
    });

    it('should get enrollment report', async () => {
      const response = await request(app)
        .get('/api/admin/reports/enrollment')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('courses');
      expect(response.body.data).toHaveProperty('summary');
    });
  });
});
