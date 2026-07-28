import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/dashboard', AdminController.getDashboard);
router.get('/users', AdminController.getAllUsers);
router.get('/users/:userId', AdminController.getUserDetails);
router.post('/users/:userId/activate', AdminController.activateUser);
router.post('/users/:userId/deactivate', AdminController.deactivateUser);
router.get('/analytics/transactions', AdminController.getTransactionAnalytics);

export default router;