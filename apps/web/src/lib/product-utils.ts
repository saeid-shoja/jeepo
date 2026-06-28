export type ProductSituation = 'NEW' | 'USED' | 'IN_STOCK' | 'OUT_OF_STOCK' | null;

export function getSituationLabel(situation: ProductSituation): string | null {
  if (situation === 'IN_STOCK') return 'موجود در انبار';
  if (situation === 'OUT_OF_STOCK') return 'ناموجود';
  if (situation === 'USED') return 'کارکرده';
  if (situation === 'NEW') return 'نو';
  return null;
}

export function isShopProduct(product: { advertiser?: string; type?: string }): boolean {
  return product.advertiser === 'SHOP' || product.type === 'SHOP';
}

/** Shop listings use stock; client ads use NEW/USED situation from the form. */
export function resolveProductSituation(product: {
  situation?: ProductSituation | null;
  advertiser?: string;
  type?: string;
  stockQuantity?: number;
}): ProductSituation {
  if (isShopProduct(product)) {
    if ((product.stockQuantity ?? 1) < 1) return 'OUT_OF_STOCK';
    return 'IN_STOCK';
  }
  return product.situation ?? null;
}

export function getSituationBadgeClass(situation: ProductSituation): string {
  if (situation === 'IN_STOCK') return 'bg-emerald-600 text-white hover:bg-emerald-600';
  if (situation === 'OUT_OF_STOCK') return 'bg-red-600 text-white hover:bg-red-600';
  if (situation === 'USED') return 'bg-amber-600 text-white hover:bg-amber-600';
  return 'bg-sky-600 text-white hover:bg-sky-600';
}

export const PRICE_FILTER_MAX = 500_000_000;
export const PRICE_FILTER_STEP = 1_000_000;

export const POSTED_WITHIN_OPTIONS = [
  { value: '', label: 'همه زمان‌ها' },
  { value: '24h', label: '۲۴ ساعت اخیر' },
  { value: '7d', label: '۷ روز اخیر' },
  { value: '30d', label: '۳۰ روز اخیر' },
] as const;

export const SITUATION_FILTER_OPTIONS = [
  { value: '', label: 'همه' },
  { value: 'NEW', label: 'نو' },
  { value: 'USED', label: 'کارکرده' },
] as const;

export const GUARANTEE_FILTER_OPTIONS = [
  { value: '', label: 'همه' },
  { value: 'true', label: 'دارای ضمانت' },
  { value: 'false', label: 'بدون ضمانت' },
] as const;
