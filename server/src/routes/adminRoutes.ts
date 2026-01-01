import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import {
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
} from '../controllers/adminController';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/users - Get all users (with filters)
router.get('/users', getUsers);

// GET /api/admin/users/:id - Get user by ID
router.get('/users/:id', getUserById);

// PUT /api/admin/users/:id/status - Update user status
router.put('/users/:id/status', updateUserStatus);

// PUT /api/admin/users/:id/role - Update user role
router.put('/users/:id/role', updateUserRole);

export default router;

