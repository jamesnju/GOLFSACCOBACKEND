import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ResponseHandler } from '../../shared/utils/response';
import { RegisterSchema } from './dto/register.dto';
import { LoginSchema } from './dto/login.dto';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const validatedData = RegisterSchema.parse(req.body);
      const result = await AuthService.register(validatedData);
      return ResponseHandler.created(res, result, 'User registered successfully');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return ResponseHandler.badRequest(res, 'Validation failed', error.errors);
      }
      return ResponseHandler.error(res, error.message || 'Registration failed', 400);
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const validatedData = LoginSchema.parse(req.body);
      const result = await AuthService.login(validatedData);
      return ResponseHandler.success(res, result, 'Login successful');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return ResponseHandler.badRequest(res, 'Validation failed', error.errors);
      }
      return ResponseHandler.error(res, error.message || 'Login failed', 401);
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return ResponseHandler.badRequest(res, 'Refresh token is required');
      }

      const result = await AuthService.refreshToken(refreshToken);
      return ResponseHandler.success(res, result, 'Token refreshed successfully');
    } catch (error: any) {
      return ResponseHandler.error(res, error.message || 'Refresh failed', 401);
    }
  }

  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user?.userId },
        include: {
          wallet: true,
        },
      });

      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      const { password, ...userWithoutPassword } = user;
      return ResponseHandler.success(res, userWithoutPassword, 'Profile retrieved successfully');
    } catch (error: any) {
      return ResponseHandler.error(res, error.message || 'Failed to get profile');
    }
  }
}

// Import prisma for the getProfile method
import { prisma } from '../../config/database';