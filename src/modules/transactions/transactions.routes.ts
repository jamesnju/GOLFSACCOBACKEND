import { Router } from 'express';
import { TransactionController } from './transactions.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/history', TransactionController.getHistory);
router.get('/:reference', TransactionController.getTransaction);
router.get('/statement', TransactionController.getStatement);

export default router;