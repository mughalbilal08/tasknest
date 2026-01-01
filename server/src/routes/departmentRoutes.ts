import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import * as departmentController from '../controllers/departmentController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all departments (accessible to all authenticated users)
router.get('/', departmentController.getDepartments);

// Create department (admin only)
router.post('/', requireAdmin, departmentController.createDepartment);

// Get department by ID (accessible if member or admin)
router.get('/:id', departmentController.getDepartmentById);

export default router;

