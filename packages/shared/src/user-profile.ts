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

/** Fields required on seller profile before requesting Jeepo guarantee on a listing. */
export type GuaranteeProfileInput = {
  name?: string | null;
  city?: string | null;
  nationalId?: string | null;
  nationalIdCardImage?: string | null;
  consentSelfieImage?: string | null;
  shopLicenseImage?: string | null;
  address?: string | null;
  postalCode?: string | null;
  accountKind?: UserAccountKind | string | null;
};

export const GUARANTEE_PROFILE_FIELD_LABELS = {
  name: 'نام و نام خانوادگی',
  city: 'شهر',
  nationalId: 'کد ملی',
  nationalIdCardImage: 'تصویر کارت ملی',
  consentSelfieImage: 'تصویر سلفی با رضایت‌نامه',
  address: 'آدرس',
  postalCode: 'کد پستی',
  shopLicenseImage: 'تصویر پروانه فروشگاه',
} as const;

/** Human-readable labels for profile fields still missing for guarantee listings. */
export function getGuaranteeProfileMissingFields(user: GuaranteeProfileInput): string[] {
  const missing: string[] = [];
  if (!user.name?.trim()) missing.push(GUARANTEE_PROFILE_FIELD_LABELS.name);
  if (!user.city?.trim()) missing.push(GUARANTEE_PROFILE_FIELD_LABELS.city);
  if (!user.nationalId?.trim() || !isValidIranTenDigits(user.nationalId)) {
    missing.push(GUARANTEE_PROFILE_FIELD_LABELS.nationalId);
  }
  if (!user.nationalIdCardImage?.trim()) {
    missing.push(GUARANTEE_PROFILE_FIELD_LABELS.nationalIdCardImage);
  }
  if (!user.consentSelfieImage?.trim()) {
    missing.push(GUARANTEE_PROFILE_FIELD_LABELS.consentSelfieImage);
  }
  if (!user.address?.trim()) missing.push(GUARANTEE_PROFILE_FIELD_LABELS.address);
  if (!user.postalCode?.trim() || !isValidIranTenDigits(user.postalCode)) {
    missing.push(GUARANTEE_PROFILE_FIELD_LABELS.postalCode);
  }
  if (user.accountKind === 'SHOP' && !user.shopLicenseImage?.trim()) {
    missing.push(GUARANTEE_PROFILE_FIELD_LABELS.shopLicenseImage);
  }
  return missing;
}

export function isGuaranteeProfileComplete(user: GuaranteeProfileInput): boolean {
  return getGuaranteeProfileMissingFields(user).length === 0;
}
