import { MOTORCYCLE_ATV_SUBCATEGORIES } from './category-defaults';
import { toEnglishDigits } from './digits';
import { findProvinceNameByCity } from './iran-locations';

export const CATEGORIES = [
  ...MOTORCYCLE_ATV_SUBCATEGORIES.map(({ name, slug }) => ({ name, slug })),
  { name: 'کمک فنر و شاسی', slug: 'suspension' },
  { name: 'لاستیک و رینگ', slug: 'tires-rims' },
  { name: 'چراغ و نور', slug: 'lighting' },
  { name: 'دنده و انتقال قدرت و دف', slug: 'transmission' },
  { name: 'اکسسوری و تزئینات', slug: 'accessories' },
  { name: 'لباس و تجهیزات', slug: 'clothing-gear' },
  { name: 'راهنما و مسیریاب', slug: 'navigation' },
  { name: 'سایر', slug: 'other' },
] as const;

export const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

/** Free active client listings per user; each additional listing requires a fee. */
export const FREE_CLIENT_LISTING_LIMIT = 2;

/** Effective listing cap: user override or platform default. */
export function resolveUserListingLimit(maxActiveListings?: number | null): number {
  if (maxActiveListings != null && maxActiveListings > 0) {
    return Math.floor(maxActiveListings);
  }
  return FREE_CLIENT_LISTING_LIMIT;
}
/** Fee per listing beyond the free quota (Toman). */
export const EXTRA_LISTING_FEE = 35_000;
/** Days to pay for a pending listing draft before it is removed. */
export const LISTING_PAYMENT_GRACE_DAYS = 3;

/** Listing premium fees (Toman) */
export const GUARANTEE_FEE_RATE = 0.05;
export const GUARANTEE_FEE_PERCENT = Math.round(GUARANTEE_FEE_RATE * 100);
/** User-facing label for guarantee commission (percentage part; purchase fees may apply separately). */
export const GUARANTEE_FEE_LABEL = `${GUARANTEE_FEE_PERCENT.toLocaleString('fa-IR')}٪ قیمت فروش به‌علاوه کارمزد تراکنش`;
/** پله شده — one-time bump to top (updates listedAt) */
export const BOOST_LISTING_FEE = 100_000;
/** تقویت شده — pinned on top for 4 days (ignores listedAt while active) */
export const STRENGTHENED_LISTING_FEE = 100_000;
export const STRENGTHENED_DURATION_DAYS = 4;

export function isStrengthenedActive(strengthenedUntil?: Date | string | null): boolean {
  if (!strengthenedUntil) return false;
  return new Date(strengthenedUntil).getTime() > Date.now();
}

export function strengthenedEndsAt(from = new Date()): Date {
  const ends = new Date(from);
  ends.setDate(ends.getDate() + STRENGTHENED_DURATION_DAYS);
  return ends;
}

export function listingPaymentDueAt(from = new Date()): Date {
  const due = new Date(from);
  due.setDate(due.getDate() + LISTING_PAYMENT_GRACE_DAYS);
  return due;
}

export function getGuaranteeFee(productPrice: number): number {
  if (!Number.isFinite(productPrice) || productPrice <= 0) return 0;
  return Math.round(productPrice * GUARANTEE_FEE_RATE);
}

/** Max length for product neighborhood (محله). */
export const PRODUCT_NEIGHBORHOOD_MAX_LENGTH = 15;

/** Format city + neighborhood for display (e.g. «تهران، ونک»). */
export function formatProductLocation(
  city?: string | null,
  neighborhood?: string | null,
): string {
  const cityPart = city?.trim() || '';
  const neighPart = neighborhood?.trim() || '';
  if (cityPart && neighPart) return `${cityPart}، ${neighPart}`;
  return cityPart || neighPart || '';
}

/** Format province + city + neighborhood (e.g. «تهران، تهران، ونک»). */
export function formatProductLocationWithProvince(
  city?: string | null,
  neighborhood?: string | null,
): string {
  const province = findProvinceNameByCity(city);
  const parts = [province, city?.trim(), neighborhood?.trim()].filter(Boolean);
  return parts.join('، ');
}

export function formatPrice(price: number): string {
  if (!Number.isFinite(price)) return '۰';
  return Math.round(price).toLocaleString('fa-IR', {
    useGrouping: true,
    maximumFractionDigits: 0,
  });
}

/** Strip formatting and parse digits from user input (ASCII, Persian, Arabic-Indic). */
export function parsePriceInput(value: string): number {
  const digits = toEnglishDigits(value).replace(/[^\d]/g, '');
  if (!digits) return 0;
  return Number(digits);
}

export function timeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.max(0, now.getTime() - date.getTime());
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (weeks >= 1) return `${weeks} هفته پیش`;
  if (days >= 1) return `${days} روز پیش`;
  if (hours >= 1) return `${hours} ساعت پیش`;
  if (minutes >= 1) return `${minutes} دقیقه پیش`;
  return 'لحظاتی پیش';
}
