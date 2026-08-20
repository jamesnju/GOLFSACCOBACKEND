import { Response } from 'express';
import { MpesaService } from './mpesa.service';
import { ResponseHandler } from '../../shared/utils/response';
import { MpesaPaymentSchema } from './dto/mpesa.dto';
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
      return ResponseHandler.success(res, result, 'Payment initiated successfully');
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      if (error.name === 'ZodError') {
        return ResponseHandler.badRequest(res, 'Validation failed', error.errors);
      }
      return ResponseHandler.error(res, error.message || 'Payment initiation failed', 400);
    }
  }

  static async handleCallback(req: any, res: Response) {
    try {
      console.log('Callback received at /mpesa-callback');
      console.log('Callback headers:', req.headers);
      console.log('Callback body:', JSON.stringify(req.body, null, 2));

      const result = await MpesaService.handleCallback(req.body);
      
      if (result.success) {
        return ResponseHandler.success(res, result, 'Callback processed successfully');
      } else {
        // Even if processing fails, return 200 to M-Pesa to acknowledge receipt
        return ResponseHandler.success(res, { received: true, message: result.message }, 'Callback acknowledged');
      }
    } catch (error: any) {
      console.error('Callback error:', error);
      // Always return 200 to M-Pesa to prevent retries
      return ResponseHandler.success(res, { received: true, error: error.message }, 'Callback received');
    }
  }

  static async checkPaymentStatus(req: AuthRequest, res: Response) {
    try {
      const checkoutRequestId = Array.isArray(req.params.checkoutRequestId)
        ? req.params.checkoutRequestId[0]
        : req.params.checkoutRequestId;
      
      if (!checkoutRequestId) {
        return ResponseHandler.badRequest(res, 'Checkout request ID is required');
      }

      const result = await MpesaService.checkPaymentStatus(checkoutRequestId);
      return ResponseHandler.success(res, result, 'Status retrieved successfully');
    } catch (error: any) {
      console.error('Status check error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to check payment status', 500);
    }
  }
}