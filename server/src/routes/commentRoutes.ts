import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getComments, createComment } from '../controllers/commentController';

const router = Router({ mergeParams: true });

// All comment routes require authentication
router.use(authenticateToken);

// GET /api/tasks/:taskId/comments - Get comments for a task
router.get('/', getComments);

// POST /api/tasks/:taskId/comments - Create a comment
router.post('/', createComment);

export default router;

