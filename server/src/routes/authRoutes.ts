import { Router } from 'express';
import { signup, login, getMe } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// POST /api/auth/signup
router.post('/signup', signup);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me (protected route)
router.get('/me', authenticateToken, getMe);

export default router;

