import { Response } from 'express';
import { TransactionService } from './transactions.service';
import { ResponseHandler } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { z } from 'zod';

const TransactionQuerySchema = z.object({
  page: z.string().optional().transform(Number),
  limit: z.string().optional().transform(Number),
  type: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export class TransactionController {
  static async getHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ResponseHandler.unauthorized(res, 'User not authenticated');
      }

      const query = TransactionQuerySchema.parse(req.query);
      const result = await TransactionService.getTransactionHistory(
        userId,
        query.page || 1,
        query.limit || 10,
        query.type,
        query.status,
        query.startDate,
        query.endDate
      );

      return ResponseHandler.success(res, result, 'Transaction history retrieved');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return ResponseHandler.badRequest(res, 'Invalid query parameters', error.errors);
      }
      return ResponseHandler.error(res, error.message || 'Failed to get transaction history');
    }
  }

  static async getTransaction(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ResponseHandler.unauthorized(res, 'User not authenticated');
      }

      // Handle reference as string (not string[])
      const reference = Array.isArray(req.params.reference) 
        ? req.params.reference[0] 
        : req.params.reference;

      if (!reference) {
        return ResponseHandler.badRequest(res, 'Transaction reference is required');
      }

      const transaction = await TransactionService.getTransactionByReference(reference);

      // Check if user owns this transaction
      if (transaction.userId !== userId) {
        return ResponseHandler.forbidden(res, 'You do not have access to this transaction');
      }

      return ResponseHandler.success(res, transaction, 'Transaction retrieved');
    } catch (error: any) {
      return ResponseHandler.error(res, error.message || 'Failed to get transaction');
    }
  }

  static async getStatement(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ResponseHandler.unauthorized(res, 'User not authenticated');
      }

      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const result = await TransactionService.getStatement(userId, startDate, endDate);

      return ResponseHandler.success(res, result, 'Statement generated');
    } catch (error: any) {
      return ResponseHandler.error(res, error.message || 'Failed to generate statement');
    }
  }
}