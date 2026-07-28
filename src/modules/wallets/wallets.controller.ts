import { Response } from 'express';
import { WalletService } from './wallets.service';
import { ResponseHandler } from '../../shared/utils/response';
import { DepositSchema } from './dto/deposit.dto';
import { WithdrawSchema } from './dto/withdraw.dto';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';

export class WalletController {
  static async deposit(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ResponseHandler.unauthorized(res, 'User not authenticated');
      }

      const validatedData = DepositSchema.parse(req.body);
      const result = await WalletService.deposit(userId, validatedData);
      return ResponseHandler.success(res, result, 'Deposit successful');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return ResponseHandler.badRequest(res, 'Validation failed', error.errors);
      }
      return ResponseHandler.error(res, error.message || 'Deposit failed');
    }
  }

  static async withdraw(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ResponseHandler.unauthorized(res, 'User not authenticated');
      }

      const validatedData = WithdrawSchema.parse(req.body);
      const result = await WalletService.withdraw(userId, validatedData);
      return ResponseHandler.success(res, result, 'Withdrawal request submitted');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return ResponseHandler.badRequest(res, 'Validation failed', error.errors);
      }
      return ResponseHandler.error(res, error.message || 'Withdrawal failed');
    }
  }

  static async getBalance(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ResponseHandler.unauthorized(res, 'User not authenticated');
      }

      const result = await WalletService.getBalance(userId);
      return ResponseHandler.success(res, result, 'Balance retrieved successfully');
    } catch (error: any) {
      return ResponseHandler.error(res, error.message || 'Failed to get balance');
    }
  }
}