import { z } from 'zod';

const phoneSchema = z
  .string()
  .trim()
  .min(1, 'شماره موبایل را وارد کنید')
  .regex(/^09\d{9}$/, 'شماره موبایل معتبر نیست. از اعداد انگلیسی استفاده کنید (مثال: 09123456789)');

const passwordSchema = z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد');

const emailSchema = z.string().trim().min(1, 'ایمیل را وارد کنید').email('ایمیل معتبر نیست');

const loginIdentifierSchema = z
  .string()
  .trim()
  .min(1, 'شماره موبایل یا ایمیل را وارد کنید')
  .refine(
    (value) => /^09\d{9}$/.test(value.trim()) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
    'شماره موبایل (مثال: 09123456789) یا ایمیل معتبر وارد کنید',
  );

export const loginSchema = z.object({
  identifier: loginIdentifierSchema,
  password: z.string().min(1, 'رمز عبور را وارد کنید'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'نام باید حداقل ۲ کاراکتر باشد'),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  city: z.string().trim().min(1, 'شهر را انتخاب کنید'),
  telegramId: z
    .string()
    .trim()
    .refine(
      (value) => !value || /^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(value) || /^\d{5,15}$/.test(value),
      'آیدی تلگرام معتبر نیست (مثال: @username)',
    ),
});

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: z
    .string()
    .min(1, 'کد تأیید را وارد کنید')
    .regex(/^\d{6}$/, 'کد تأیید باید ۶ رقم باشد'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
