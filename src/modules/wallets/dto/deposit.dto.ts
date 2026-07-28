import { z } from 'zod';

export const DepositSchema = z.object({
  amount: z.number().min(100, 'Minimum deposit is KES 100'),
  paymentMethod: z.enum(['MPESA', 'BANK', 'CASH']).default('MPESA'),
  description: z.string().optional(),
});

export type DepositDto = z.infer<typeof DepositSchema>;