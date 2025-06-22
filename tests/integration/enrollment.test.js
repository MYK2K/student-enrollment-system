/**
 * Enrollment Integration Tests
 */

import request from 'supertest';
import app from '../../src/app.js';
import { prisma, clearDatabase } from '../setup.js';
import { createCompleteTestSetup } from '../fixtures/test-data.js';

describe('Enrollment Endpoints', () => {
  let testData;
  let studentToken;
  let adminToken;

  beforeEach(async () => {
    await clearDatabase();
    testData = await createCompleteTestSetup(prisma);

    // Get student token
    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: testData.users.student1.user.email,
        password: 'Student@123'
      });
    studentToken = studentLogin.body.data.accessToken;

    // Get admin token
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: testData.users.techAdmin.user.email,
        password: 'Admin@123456'
      });
    adminToken = adminLogin.body.data.accessToken;
  });

  describe('POST /api/enrollments', () => {
    it('should enroll in courses successfully', async () => {
      const response = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseIds: [testData.courses.course1.id, testData.courses.course2.id]
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.enrolled).toHaveLength(2);
      expect(response.body.data.failed).toHaveLength(0);
    });

    it('should detect timetable conflicts', async () => {
      // First enroll in course1 (morning schedule)
      await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseIds: [testData.courses.course1.id]
        });

      // Try to enroll in course3 (conflicting schedule)
      const response = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseIds: [testData.courses.course3.id]
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.conflicts).toHaveLength(2); // Conflicts on 2 days
    });

    it('should prevent duplicate enrollments', async () => {
      // First enrollment
      await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseIds: [testData.courses.course1.id]
        });

      // Try to enroll again
      const response = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseIds: [testData.courses.course1.id]
        });

      expect(response.status).toBe(201);
      expect(response.body.data.enrolled).toHaveLength(0);
      expect(response.body.data.failed).toHaveLength(0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/enrollments')
        .send({
          courseIds: [testData.courses.course1.id]
        });

      expect(response.status).toBe(401);
    });

    it('should require student role', async () => {
      const response = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courseIds: [testData.courses.course1.id]
        });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/enrollments', () => {
    beforeEach(async () => {
      // Enroll in some courses
      await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseIds: [testData.courses.course1.id, testData.courses.course2.id]
        });
    });

    it('should get student enrollments', async () => {
      const response = await request(app)
        .get('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('course');
    });
  });

  describe('DELETE /api/enrollments/:enrollmentId', () => {
    let enrollmentId;

    beforeEach(async () => {
      // Enroll in a course
      await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseIds: [testData.courses.course1.id]
        });

      // Get enrollment ID
      const enrollments = await request(app)
        .get('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`);

      enrollmentId = enrollments.body.data[0].id;
    });

    it('should drop enrollment successfully', async () => {
      const response = await request(app)
        .delete(`/api/enrollments/${enrollmentId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify enrollment is deleted
      const enrollments = await request(app)
        .get('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(enrollments.body.data).toHaveLength(0);
    });

    it('should not allow dropping another student enrollment', async () => {
      // Login as student2
      const student2Login = await request(app)
        .post('/api/auth/login')
        .send({
          email: testData.users.student2.user.email,
          password: 'Student@123'
        });
      const student2Token = student2Login.body.data.accessToken;

      // Try to drop student1's enrollment
      const response = await request(app)
        .delete(`/api/enrollments/${enrollmentId}`)
        .set('Authorization', `Bearer ${student2Token}`);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/enrollments/check-conflicts', () => {
    it('should check for conflicts before enrollment', async () => {
      // Enroll in course1
      await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseIds: [testData.courses.course1.id]
        });

      // Check conflicts with course3
      const response = await request(app)
        .post('/api/enrollments/check-conflicts')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseIds: [testData.courses.course3.id]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.hasConflicts).toBe(true);
      expect(response.body.data.conflicts).toHaveLength(2);
    });

    it('should show no conflicts for compatible courses', async () => {
      const response = await request(app)
        .post('/api/enrollments/check-conflicts')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseIds: [testData.courses.course1.id, testData.courses.course2.id]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.hasConflicts).toBe(false);
      expect(response.body.data.conflicts).toHaveLength(0);
    });
  });
});
