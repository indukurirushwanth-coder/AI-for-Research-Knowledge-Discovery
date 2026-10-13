import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  fullName: z.string().trim().optional()
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required')
});

export default {
  registerSchema,
  loginSchema
};
