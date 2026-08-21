import { z } from 'zod';

export const ApproveLoanSchema = z.object({
  loanId: z.string(),
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
});

export type ApproveLoanDto = z.infer<typeof ApproveLoanSchema>;