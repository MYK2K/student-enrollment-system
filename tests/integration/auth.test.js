/**
 * Authentication Integration Tests
 */

import request from 'supertest';
import app from '../../src/app.js';
import { prisma, clearDatabase } from '../setup.js';
import { testUsers, testColleges, createTestCollege } from '../fixtures/test-data.js';
import { USER_ROLES } from '../../src/config/constants.js';

describe('Authentication Endpoints', () => {
  let college;

  beforeEach(async () => {
    await clearDatabase();
    college = await createTestCollege(prisma, testColleges.tech);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new student', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newstudent@test.edu',
          password: 'Password@123',
          confirmPassword: 'Password@123',
          role: USER_ROLES.STUDENT,
          name: 'New Student',
          collegeId: college.id,
          studentNumber: 'NEW001'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe('newstudent@test.edu');
    });

    it('should register a new admin', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newadmin@test.edu',
          password: 'Password@123',
          confirmPassword: 'Password@123',
          role: USER_ROLES.COLLEGE_ADMIN,
          name: 'New Admin',
          collegeId: college.id
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe(USER_ROLES.COLLEGE_ADMIN);
    });

    it('should fail with existing email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          email: testUsers.student.email,
          password: testUsers.student.password,
          confirmPassword: testUsers.student.password,
          role: USER_ROLES.STUDENT,
          name: 'Test Student',
          collegeId: college.id,
          studentNumber: 'TEST001'
        });

      // Attempt duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: testUsers.student.email,
          password: 'Different@123',
          confirmPassword: 'Different@123',
          role: USER_ROLES.STUDENT,
          name: 'Another Student',
          collegeId: college.id,
          studentNumber: 'TEST002'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate password requirements', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'weak@test.edu',
          password: 'weak',
          confirmPassword: 'weak',
          role: USER_ROLES.STUDENT,
          name: 'Test Student',
          collegeId: college.id,
          studentNumber: 'TEST001'
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: testUsers.student.email,
          password: testUsers.student.password,
          confirmPassword: testUsers.student.password,
          role: USER_ROLES.STUDENT,
          name: 'Test Student',
          collegeId: college.id,
          studentNumber: 'TEST001'
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.student.email,
          password: testUsers.student.password
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(testUsers.student.email);
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.student.email,
          password: 'WrongPassword@123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.edu',
          password: 'Password@123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken;

    beforeEach(async () => {
      // Register and login
      await request(app)
        .post('/api/auth/register')
        .send({
          email: testUsers.student.email,
          password: testUsers.student.password,
          confirmPassword: testUsers.student.password,
          role: USER_ROLES.STUDENT,
          name: 'Test Student',
          collegeId: college.id,
          studentNumber: 'TEST001'
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.student.email,
          password: testUsers.student.password
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should get current user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUsers.student.email);
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/change-password', () => {
    let accessToken;

    beforeEach(async () => {
      // Register and login
      await request(app)
        .post('/api/auth/register')
        .send({
          email: testUsers.student.email,
          password: testUsers.student.password,
          confirmPassword: testUsers.student.password,
          role: USER_ROLES.STUDENT,
          name: 'Test Student',
          collegeId: college.id,
          studentNumber: 'TEST001'
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.student.email,
          password: testUsers.student.password
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should change password successfully', async () => {
      const newPassword = 'NewPassword@123';

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: testUsers.student.password,
          newPassword,
          confirmPassword: newPassword
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify can login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.student.email,
          password: newPassword
        });

      expect(loginResponse.status).toBe(200);
    });

    it('should fail with incorrect current password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'WrongPassword@123',
          newPassword: 'NewPassword@123',
          confirmPassword: 'NewPassword@123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
