import { z } from 'zod';

export const WithdrawSchema = z.object({
  amount: z.number().min(100, 'Minimum withdrawal is KES 100'),
  bankAccount: z.string().optional(),
  mpesaNumber: z.string().optional(),
  description: z.string().optional(),
});

export type WithdrawDto = z.infer<typeof WithdrawSchema>;