import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController';

const router = Router();

// All notification routes require authentication
router.use(authenticateToken);

// GET /api/notifications - Get user's notifications
router.get('/', getNotifications);

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', markAsRead);

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', markAllAsRead);

export default router;

