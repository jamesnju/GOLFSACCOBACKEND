import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../utils/jwt';
import { ResponseHandler } from '../utils/response';
import { prisma } from '../../config/database';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseHandler.unauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const payload = JwtService.verifyAccessToken(token);

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive) {
      return ResponseHandler.unauthorized(res, 'User not found or inactive');
    }

    req.user = payload;
    next();
  } catch (error) {
    return ResponseHandler.unauthorized(res, 'Invalid or expired token');
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ResponseHandler.unauthorized(res, 'Not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      return ResponseHandler.forbidden(res, 'Insufficient permissions');
    }

    next();
  };
};