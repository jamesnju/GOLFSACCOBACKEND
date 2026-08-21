import { Router } from 'express';
import { WalletController } from './wallets.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';

const router = Router();

// All wallet routes require authentication
router.use(authenticate);

router.post('/deposit', WalletController.deposit);
router.post('/withdraw', WalletController.withdraw);
router.get('/balance', WalletController.getBalance);

export default router;