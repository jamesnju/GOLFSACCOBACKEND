import { Router } from 'express';
import { PaymentController } from './payments.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';

const router = Router();

// Public callback route (M-Pesa will hit this)
router.post('/mpesa-callback', PaymentController.handleCallback);

// Protected routes
router.use(authenticate);
router.post('/initiate', PaymentController.initiatePayment);

export default router;