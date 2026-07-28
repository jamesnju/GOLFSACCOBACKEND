import { Response } from 'express';
import { MpesaService } from './mpesa.service';
import { ResponseHandler } from '../../shared/utils/response';
import { MpesaPaymentSchema, MpesaCallbackSchema } from './dto/mpesa.dto';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';

export class PaymentController {
  static async initiatePayment(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ResponseHandler.unauthorized(res, 'User not authenticated');
      }

      const validatedData = MpesaPaymentSchema.parse(req.body);
      const result = await MpesaService.initiatePayment(userId, validatedData);
      return ResponseHandler.success(res, result, 'Payment initiated');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return ResponseHandler.badRequest(res, 'Validation failed', error.errors);
      }
      return ResponseHandler.error(res, error.message || 'Payment initiation failed');
    }
  }

  static async handleCallback(req: any, res: Response) {
    try {
      const validatedData = MpesaCallbackSchema.parse(req.body);
      const result = await MpesaService.handleCallback(validatedData);
      return ResponseHandler.success(res, result, 'Callback processed');
    } catch (error: any) {
      console.error('Callback error:', error);
      return ResponseHandler.error(res, error.message || 'Callback processing failed');
    }
  }
}