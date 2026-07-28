import { Router } from 'express';
import { LoanController } from './loans.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/apply', LoanController.apply);
router.post('/approve', LoanController.approve);
router.get('/user', LoanController.getUserLoans);
router.get('/pending', LoanController.getPendingLoans);
router.get('/eligibility', LoanController.checkEligibility);

export default router;