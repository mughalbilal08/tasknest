import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { getProjects, createProject, getProjectById, updateProject, deleteProject } from '../controllers/projectController';

const router = Router();

// All project routes require authentication
router.use(authenticateToken);

// GET /api/projects - Get all projects with accessible flag
router.get('/', getProjects);

// POST /api/projects - Create project (admin only)
router.post('/', requireAdmin, createProject);

// GET /api/projects/:id - Get project by ID (member or admin only)
router.get('/:id', getProjectById);

// PUT /api/projects/:id - Update project (admin only)
router.put('/:id', requireAdmin, updateProject);

// DELETE /api/projects/:id - Delete project (admin only)
router.delete('/:id', requireAdmin, deleteProject);

export default router;

