import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
} from '../controllers/taskController';

const router = Router();

// All task routes require authentication
router.use(authenticateToken);

// GET /api/tasks - Get tasks with filters, search, and pagination
router.get('/', getTasks);

// POST /api/tasks - Create task
router.post('/', createTask);

// GET /api/tasks/:id - Get task by ID
router.get('/:id', getTaskById);

// PUT /api/tasks/:id - Update task
router.put('/:id', updateTask);

// DELETE /api/tasks/:id - Delete task (admin only)
router.delete('/:id', requireAdmin, deleteTask);

export default router;

