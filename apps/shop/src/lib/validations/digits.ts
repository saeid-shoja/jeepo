import {
  normalizeLoginIdentifier,
  normalizeTelegramIdInput,
  toEnglishDigits,
} from '@offroad/shared';
import { z } from 'zod';

export const IRAN_MOBILE_REGEX = /^09\d{9}$/;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const loginIdentifierField = z
  .string()
  .min(1, 'شماره موبایل یا ایمیل را وارد کنید')
  .refine((value) => {
    const normalized = normalizeLoginIdentifier(value);
    return IRAN_MOBILE_REGEX.test(normalized) || EMAIL_REGEX.test(normalized);
  }, 'شماره موبایل (مثال: 09123456789) یا ایمیل معتبر وارد کنید');

export const iranMobileField = (emptyMessage = 'شماره موبایل را وارد کنید') =>
  z
    .string()
    .min(1, emptyMessage)
    .refine((v) => IRAN_MOBILE_REGEX.test(toEnglishDigits(v)), 'شماره موبایل معتبر نیست');

export const optionalIranMobileField = () =>
  z
    .string()
    .refine((v) => !v || IRAN_MOBILE_REGEX.test(toEnglishDigits(v)), 'شماره موبایل معتبر نیست');

export const verificationCodeField = () =>
  z
    .string()
    .min(1, 'کد تأیید را وارد کنید')
    .refine((v) => /^\d{6}$/.test(toEnglishDigits(v)), 'کد تأیید باید ۶ رقم باشد');

export const telegramIdField = () =>
  z.string().refine((value) => {
    const normalized = normalizeTelegramIdInput(value.trim());
    return (
      !normalized ||
      /^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(normalized) ||
      /^\d{5,15}$/.test(normalized)
    );
  }, 'آیدی تلگرام معتبر نیست (مثال: @username)');

/** Parse integer form values (ASCII, Persian, Arabic-Indic). */
export function parseIntegerInput(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  const digits = toEnglishDigits(String(value ?? '')).replace(/[^\d]/g, '');
  if (!digits) return 0;
  return Number(digits);
}
