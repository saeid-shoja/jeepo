import { toEnglishDigits } from './digits';

export const USER_ACCOUNT_KINDS = ['REGULAR', 'SHOP'] as const;
export type UserAccountKind = (typeof USER_ACCOUNT_KINDS)[number];

export const USER_ACCOUNT_KIND_LABELS: Record<UserAccountKind, string> = {
  REGULAR: 'کاربر معمولی',
  SHOP: 'فروشگاه',
};

/** Max length for free-text address. */
export const USER_ADDRESS_MAX_LENGTH = 400;

/** Iranian national ID / postal code: exactly 10 digits. */
export const IRAN_TEN_DIGIT_REGEX = /^\d{10}$/;

export function normalizeTenDigits(value: string): string {
  return toEnglishDigits(value).replace(/\D/g, '');
}

export function isValidIranTenDigits(value: string | null | undefined): boolean {
  if (value == null || value === '') return true;
  return IRAN_TEN_DIGIT_REGEX.test(normalizeTenDigits(value));
}

export function isValidSellerRating(value: number | null | undefined): boolean {
  if (value == null) return true;
  return Number.isFinite(value) && value >= 0 && value <= 5;
}

/** Format rating for product/seller UI. */
export function formatSellerRatingLabel(rating: number | null | undefined): string {
  if (rating == null || !Number.isFinite(rating)) return 'کاربر بدون امتیاز';
  const rounded = Math.round(rating * 10) / 10;
  const display =
    Number.isInteger(rounded) || Math.abs(rounded - Math.round(rounded)) < 0.05
      ? Math.round(rounded).toLocaleString('fa-IR')
      : rounded.toLocaleString('fa-IR', { maximumFractionDigits: 1 });
  return `کاربر ${display}`;
}

/**
 * Public seller pages show active listing count only when the user's
 * listing ceiling is below this threshold (privacy for large accounts).
 */
export const PUBLIC_LISTING_COUNT_MAX_CEILING = 20;

export function shouldShowPublicListingCount(listingCeiling: number): boolean {
  return listingCeiling < PUBLIC_LISTING_COUNT_MAX_CEILING;
}
