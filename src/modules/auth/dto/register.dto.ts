import { z } from 'zod';
import { UserRole } from '../../../shared/enums/roles.enum';

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum([UserRole.PLAYER, UserRole.PRO, UserRole.CADDY]).default(UserRole.PLAYER),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;