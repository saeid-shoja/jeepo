import { MOTORCYCLE_ATV_SUBCATEGORIES } from './category-defaults';

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

/** Listing premium fees (Toman) */
export const GUARANTEE_FEE_RATE = 0.05;
export const BOOST_LISTING_FEE = 100_000;

export function getGuaranteeFee(productPrice: number): number {
  if (!Number.isFinite(productPrice) || productPrice <= 0) return 0;
  return Math.round(productPrice * GUARANTEE_FEE_RATE);
}

export function formatPrice(price: number): string {
  if (!Number.isFinite(price)) return '۰';
  return Math.round(price).toLocaleString('fa-IR', {
    useGrouping: true,
    maximumFractionDigits: 0,
  });
}

/** Strip formatting and parse digits from user input */
export function parsePriceInput(value: string): number {
  const digits = value.replace(/[^\d]/g, '');
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
