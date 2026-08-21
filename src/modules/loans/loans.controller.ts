import { Response } from 'express';
import { LoanService } from './loans.service';
import { ResponseHandler } from '../../shared/utils/response';
import { ApplyLoanSchema } from './dto/apply-loan.dto';
import { ApproveLoanSchema } from './dto/approve-loan.dto';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { UserRole } from '../../shared/enums/roles.enum';

export class LoanController {
  static async apply(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ResponseHandler.unauthorized(res, 'User not authenticated');
      }

      const validatedData = ApplyLoanSchema.parse(req.body);
      const result = await LoanService.applyForLoan(userId, validatedData);
      return ResponseHandler.success(res, result, 'Loan application submitted');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return ResponseHandler.badRequest(res, 'Validation failed', error.errors);
      }
      return ResponseHandler.error(res, error.message || 'Loan application failed');
    }
  }

  static async approve(req: AuthRequest, res: Response) {
    try {
      const adminId = req.user?.userId;
      if (!adminId) {
        return ResponseHandler.unauthorized(res, 'User not authenticated');
      }

      // Check if user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return ResponseHandler.forbidden(res, 'Only admins can approve loans');
      }

      const { loanId, status, rejectionReason } = req.body;
      const result = await LoanService.approveLoan(adminId, loanId, status, rejectionReason);
      return ResponseHandler.success(res, result, `Loan ${status.toLowerCase()}`);
    } catch (error: any) {
      return ResponseHandler.error(res, error.message || 'Loan approval failed');
    }
  }

  static async getUserLoans(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ResponseHandler.unauthorized(res, 'User not authenticated');
      }

      const result = await LoanService.getUserLoans(userId);
      return ResponseHandler.success(res, result, 'Loans retrieved');
    } catch (error: any) {
      return ResponseHandler.error(res, error.message || 'Failed to get loans');
    }
  }

  static async getPendingLoans(req: AuthRequest, res: Response) {
    try {
      const adminId = req.user?.userId;
      if (!adminId) {
        return ResponseHandler.unauthorized(res, 'User not authenticated');
      }

      if (req.user?.role !== UserRole.ADMIN) {
        return ResponseHandler.forbidden(res, 'Only admins can view pending loans');
      }

      const result = await LoanService.getAllPendingLoans(adminId);
      return ResponseHandler.success(res, result, 'Pending loans retrieved');
    } catch (error: any) {
      return ResponseHandler.error(res, error.message || 'Failed to get pending loans');
    }
  }

  static async checkEligibility(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ResponseHandler.unauthorized(res, 'User not authenticated');
      }

      const result = await LoanService.checkEligibility(userId);
      return ResponseHandler.success(res, result, 'Eligibility check completed');
    } catch (error: any) {
      return ResponseHandler.error(res, error.message || 'Failed to check eligibility');
    }
  }
}