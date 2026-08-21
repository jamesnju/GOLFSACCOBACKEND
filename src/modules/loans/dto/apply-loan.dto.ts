import { z } from 'zod';

export const ApplyLoanSchema = z.object({
  amount: z.number().min(1000, 'Minimum loan amount is KES 1,000'),
  purpose: z.string().min(1, 'Purpose is required'),
  durationMonths: z.number().min(1).max(6).default(3),
});

export type ApplyLoanDto = z.infer<typeof ApplyLoanSchema>;