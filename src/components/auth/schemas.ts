import { z } from 'zod';

/**
 * Validation schema for sign up form
 */
export const signUpSchema = z.object({
  username: z.string()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(20, { message: 'Username cannot exceed 20 characters' })
    .regex(/^[a-zA-Z0-9_-]+$/, { 
      message: 'Username can only contain letters, numbers, underscores and hyphens' 
    }),
  email: z.string()
    .email({ message: 'Please enter a valid email address' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[\^$*.[\]{}()?\-"!@#%&/\\,><':;|_~`]/, { 
      message: 'Password must contain at least one special character' 
    }),
  confirmPassword: z.string(),
  name: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type SignUpFormData = z.infer<typeof signUpSchema>;

/**
 * Validation schema for sign in form
 */
export const signInSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export type SignInFormData = z.infer<typeof signInSchema>;

/**
 * Validation schema for confirmation code
 */
export const confirmSignUpSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  code: z.string()
    .min(6, { message: 'Confirmation code must be 6 digits' })
    .max(6, { message: 'Confirmation code must be 6 digits' })
    .regex(/^[0-9]+$/, { message: 'Confirmation code can only contain numbers' }),
});

export type ConfirmSignUpFormData = z.infer<typeof confirmSignUpSchema>;

/**
 * Validation schema for forgot password form
 */
export const forgotPasswordSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Validation schema for reset password form
 */
export const resetPasswordSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  code: z.string()
    .min(6, { message: 'Confirmation code must be 6 digits' })
    .max(6, { message: 'Confirmation code must be 6 digits' })
    .regex(/^[0-9]+$/, { message: 'Confirmation code can only contain numbers' }),
  newPassword: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[\^$*.[\]{}()?\-"!@#%&/\\,><':;|_~`]/, { 
      message: 'Password must contain at least one special character' 
    }),
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
