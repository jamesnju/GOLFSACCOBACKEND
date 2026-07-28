import { Response } from 'express';
import { AdminService } from './admin.service';
import { ResponseHandler } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { UserRole } from '../../shared/enums/roles.enum';

export class AdminController {
  static async getDashboard(req: AuthRequest, res: Response) {
    try {
      if (req.user?.role !== UserRole.ADMIN) {
        return ResponseHandler.forbidden(res, 'Admin access required');
      }

      const stats = await AdminService.getDashboardStats();
      return ResponseHandler.success(res, stats, 'Dashboard data retrieved');
    } catch (error: any) {
      return ResponseHandler.error(res, error.message || 'Failed to get dashboard data');
    }
  }

  static async getAllUsers(req: AuthRequest, res: Response) {
    try {
      if (req.user?.role !== UserRole.ADMIN) {
        return ResponseHandler.forbidden(res, 'Admin access required');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;

      const result = await AdminService.getAllUsers(page, limit, search);
      return ResponseHandler.success(res, result, 'Users retrieved');
    } catch (error: any) {
      return ResponseHandler.error(res, error.message || 'Failed to get users');
    }
  }

  static async getUserDetails(req: AuthRequest, res: Response) {
    try {
      if (req.user?.role !== UserRole.ADMIN) {
        return ResponseHandler.forbidden(res, 'Admin access required');
      }

      // Handle userId as string (not string[])
      const userId = Array.isArray(req.params.userId) 
        ? req.params.userId[0] 
        : req.params.userId;

      if (!userId) {
        return ResponseHandler.badRequest(res, 'User ID is required');
      }

      const result = await AdminService.getUserDetails(userId);
      return ResponseHandler.success(res, result, 'User details retrieved');
    } catch (error: any) {
      return ResponseHandler.error(res, error.message || 'Failed to get user details');
    }
  }

  static async activateUser(req: AuthRequest, res: Response) {
    try {
      if (req.user?.role !== UserRole.ADMIN) {
        return ResponseHandler.forbidden(res, 'Admin access required');
      }

      // Handle userId as string (not string[])
      const userId = Array.isArray(req.params.userId) 
        ? req.params.userId[0] 
        : req.params.userId;

      if (!userId) {
        return ResponseHandler.badRequest(res, 'User ID is required');
      }

      const result = await AdminService.activateUser(userId);
      return ResponseHandler.success(res, result, 'User activated successfully');
    } catch (error: any) {
      return ResponseHandler.error(res, error.message || 'Failed to activate user');
    }
  }

  static async deactivateUser(req: AuthRequest, res: Response) {
    try {
      if (req.user?.role !== UserRole.ADMIN) {
        return ResponseHandler.forbidden(res, 'Admin access required');
      }

      // Handle userId as string (not string[])
      const userId = Array.isArray(req.params.userId) 
        ? req.params.userId[0] 
        : req.params.userId;

      if (!userId) {
        return ResponseHandler.badRequest(res, 'User ID is required');
      }

      const result = await AdminService.deactivateUser(userId);
      return ResponseHandler.success(res, result, 'User deactivated successfully');
    } catch (error: any) {
      return ResponseHandler.error(res, error.message || 'Failed to deactivate user');
    }
  }

  static async getTransactionAnalytics(req: AuthRequest, res: Response) {
    try {
      if (req.user?.role !== UserRole.ADMIN) {
        return ResponseHandler.forbidden(res, 'Admin access required');
      }

      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const result = await AdminService.getTransactionAnalytics(startDate, endDate);
      return ResponseHandler.success(res, result, 'Transaction analytics retrieved');
    } catch (error: any) {
      return ResponseHandler.error(res, error.message || 'Failed to get analytics');
    }
  }
}