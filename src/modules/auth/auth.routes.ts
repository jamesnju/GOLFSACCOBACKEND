import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';

const router = Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);

// Protected routes
router.get('/profile', authenticate, AuthController.getProfile);

export default router;