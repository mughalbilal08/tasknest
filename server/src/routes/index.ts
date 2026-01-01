import { Router } from 'express';
import authRoutes from './authRoutes';
import departmentRoutes from './departmentRoutes';
import projectRoutes from './projectRoutes';
import taskRoutes from './taskRoutes';
import commentRoutes from './commentRoutes';
import notificationRoutes from './notificationRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

// Route handlers
router.use('/auth', authRoutes);
router.use('/departments', departmentRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/tasks/:taskId/comments', commentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

export default router;

