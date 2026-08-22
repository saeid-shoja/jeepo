import { z } from 'zod';
import {
  iranMobileField,
  loginIdentifierField,
  verificationCodeField,
} from '@/lib/validations/digits';

const passwordSchema = z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد');

const emailSchema = z.string().trim().min(1, 'ایمیل را وارد کنید').email('ایمیل معتبر نیست');

export const loginSchema = z.object({
  identifier: loginIdentifierField,
  password: z.string().min(1, 'رمز عبور را وارد کنید'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'نام باید حداقل ۲ کاراکتر باشد'),
  email: emailSchema,
  phone: iranMobileField(),
  password: passwordSchema,
  referralCode: z.string().trim().optional(),
});

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: verificationCodeField(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const requestLoginCodeSchema = z.object({
  email: emailSchema,
});

export const verifyLoginCodeSchema = z.object({
  email: emailSchema,
  code: verificationCodeField(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type RequestLoginCodeFormValues = z.infer<typeof requestLoginCodeSchema>;
export type VerifyLoginCodeFormValues = z.infer<typeof verifyLoginCodeSchema>;
