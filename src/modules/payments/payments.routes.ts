import { Router } from 'express';
import { PaymentController } from './payments.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';

const router = Router();

// Public routes (M-Pesa will hit these)
router.post('/mpesa-callback', PaymentController.handleCallback);

// Protected routes
router.use(authenticate);
router.post('/initiate', PaymentController.initiatePayment);
router.get('/status/:checkoutRequestId', PaymentController.checkPaymentStatus);

export default router;