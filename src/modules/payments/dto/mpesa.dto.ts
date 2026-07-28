import { z } from 'zod';

export const MpesaPaymentSchema = z.object({
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  amount: z.number().min(1, 'Amount must be at least 1'),
  purpose: z.enum(['REGISTRATION', 'DEPOSIT', 'LOAN_REPAYMENT']),
  reference: z.string().optional(),
});

export const MpesaCallbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string(),
      CheckoutRequestID: z.string(),
      ResultCode: z.number(),
      ResultDesc: z.string(),
      CallbackMetadata: z.object({
        Item: z.array(
          z.object({
            Name: z.string(),
            Value: z.any(),
          })
        ),
      }),
    }),
  }),
});

export type MpesaPaymentDto = z.infer<typeof MpesaPaymentSchema>;
export type MpesaCallbackDto = z.infer<typeof MpesaCallbackSchema>;