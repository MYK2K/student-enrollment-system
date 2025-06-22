/**
 * Main Routes Aggregator
 * Combines all route modules and exports as single router
 */

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import enrollmentRoutes from './enrollment.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

// API version and welcome message
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Student Course Enrollment System API',
    version: process.env.API_VERSION || 'v1',
    endpoints: {
      auth: '/auth',
      students: '/students',
      enrollments: '/enrollments',
      courses: '/courses',
      admin: '/admin'
    }
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/admin', adminRoutes);

export default router;
