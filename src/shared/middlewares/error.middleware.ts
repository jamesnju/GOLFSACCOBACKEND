import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ResponseHandler } from '../utils/response';
import { ZodError } from 'zod';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return ResponseHandler.badRequest(
          res,
          `Duplicate field: ${error.meta?.target}`,
          error.message
        );
      case 'P2025':
        return ResponseHandler.notFound(res, 'Record not found');
      default:
        return ResponseHandler.error(res, 'Database error', 500, error.message);
    }
  }

  // Zod validation errors - FIXED
  if (error instanceof ZodError) {
    const formattedErrors = error.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    
    return ResponseHandler.badRequest(
      res,
      'Validation failed',
      formattedErrors
    );
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return ResponseHandler.unauthorized(res, 'Invalid token');
  }

  if (error.name === 'TokenExpiredError') {
    return ResponseHandler.unauthorized(res, 'Token expired');
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  return ResponseHandler.error(res, message, statusCode, error.stack);
};