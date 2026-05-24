export interface IUser {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  CLIENT = 'CLIENT',
  ADMIN = 'ADMIN',
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
}

export enum ProductType {
  SHOP = 'SHOP',
  CLIENT = 'CLIENT',
}

export interface IProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  categoryId: string;
  category?: ICategory;
  userId?: string;
  user?: IUser;
  type: ProductType;
  hasGuarantee: boolean;
  isBoosted: boolean;
  status: ProductStatus;
  city?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory {
  id: string;
  name: string;
  slug: string;
  group?: 'PART';
  parentId?: string | null;
  sortOrder?: number;
  children?: ICategory[];
}

export interface ICarBrandOption {
  value: string;
  label: string;
}

export interface ICategoriesResponse {
  parts: ICategory[];
  carBrands: ICarBrandOption[];
}

export * from './car-brands';

export const CATEGORIES = [
  { name: 'موتورسیکلت و چهارچرخ', slug: 'motorcycle-atv' },
  { name: 'کمک فنر و شاسی', slug: 'suspension' },
  { name: 'لاستیک و رینگ', slug: 'tires-rims' },
  { name: 'چراغ و نور', slug: 'lighting' },
  { name: 'دنده و انتقال قدرت', slug: 'transmission' },
  { name: 'اکسسوری و تزئینات', slug: 'accessories' },
  { name: 'لوازم یدکی موتور', slug: 'engine-parts' },
  { name: 'لباس و تجهیزات', slug: 'clothing-gear' },
  { name: 'راهنما و مسیریاب', slug: 'navigation' },
  { name: 'سایر', slug: 'other' },
] as const;

export const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
] as const;

export function formatPrice(price: number): string {
  return price.toLocaleString('fa-IR');
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
