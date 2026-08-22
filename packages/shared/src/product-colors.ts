/** Canonical product colors for listings and cart variants. */
export const PRODUCT_COLORS = [
  { id: 'white', label: 'سفید', hex: '#f8fafc', ink: 'dark' },
  { id: 'black', label: 'مشکی', hex: '#171717', ink: 'light' },
  { id: 'gray', label: 'خاکستری', hex: '#6b7280', ink: 'light' },
  { id: 'silver', label: 'نقره‌ای', hex: '#c0c0c0', ink: 'dark' },
  { id: 'red', label: 'قرمز', hex: '#dc2626', ink: 'light' },
  { id: 'blue', label: 'آبی', hex: '#2563eb', ink: 'light' },
  { id: 'navy', label: 'سرمه‌ای', hex: '#1e3a5a', ink: 'light' },
  { id: 'green', label: 'سبز', hex: '#16a34a', ink: 'light' },
  { id: 'yellow', label: 'زرد', hex: '#eab308', ink: 'dark' },
  { id: 'orange', label: 'نارنجی', hex: '#f97316', ink: 'light' },
  { id: 'brown', label: 'قهوه‌ای', hex: '#92400e', ink: 'light' },
  { id: 'beige', label: 'بژ', hex: '#d6c0a0', ink: 'dark' },
  { id: 'purple', label: 'بنفش', hex: '#7c3aed', ink: 'light' },
  { id: 'pink', label: 'صورتی', hex: '#ec4899', ink: 'light' },
  { id: 'gold', label: 'طلایی', hex: '#d4a017', ink: 'dark' },
  {
    id: 'multicolor',
    label: 'چند رنگ',
    hex: '#888888',
    ink: 'light',
    gradient:
      'linear-gradient(135deg, #ef4444 0%, #eab308 28%, #22c55e 52%, #3b82f6 76%, #a855f7 100%)',
  },
] as const;

export type ProductColorId = (typeof PRODUCT_COLORS)[number]['id'];
export type ProductColor = (typeof PRODUCT_COLORS)[number];

export const PRODUCT_COLOR_IDS: ProductColorId[] = PRODUCT_COLORS.map((c) => c.id);

const COLOR_BY_ID = new Map<string, ProductColor>(PRODUCT_COLORS.map((c) => [c.id, c]));
const COLOR_ID_BY_LABEL = new Map<string, ProductColorId>(
  PRODUCT_COLORS.map((c) => [c.label, c.id]),
);

export function isProductColorId(value: string): value is ProductColorId {
  return COLOR_BY_ID.has(value);
}

export function getProductColor(id: string): ProductColor | undefined {
  return COLOR_BY_ID.get(id);
}

/** Circle fill for swatches — solid hex, or the fixed multicolor gradient. */
export function getProductColorSwatchStyle(color: ProductColor): {
  backgroundImage?: string;
  backgroundColor?: string;
} {
  if ('gradient' in color && typeof color.gradient === 'string') {
    return { backgroundImage: color.gradient };
  }
  return { backgroundColor: color.hex };
}

export function getProductColorLabel(id: string): string {
  return COLOR_BY_ID.get(id)?.label ?? id;
}

function resolveColorToken(token: string): ProductColorId | null {
  const trimmed = token.trim();
  if (!trimmed) return null;
  if (isProductColorId(trimmed)) return trimmed;
  return COLOR_ID_BY_LABEL.get(trimmed) ?? null;
}

/** Parse stored JSON ids, comma-separated ids/labels, or a single legacy label. */
export function parseProductColorIds(raw?: string | null): ProductColorId[] {
  if (!raw?.trim()) return [];
  const trimmed = raw.trim();
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return uniqueColorIds(parsed.map((item) => (typeof item === 'string' ? item : '')));
      }
    } catch {
      /* fall through */
    }
  }
  return uniqueColorIds(trimmed.split(/[،,]/));
}

function uniqueColorIds(tokens: string[]): ProductColorId[] {
  const seen = new Set<ProductColorId>();
  const ids: ProductColorId[] = [];
  for (const token of tokens) {
    const id = resolveColorToken(token);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

export function serializeProductColorIds(ids?: string[] | null): string | null {
  const unique = uniqueColorIds(ids ?? []);
  return unique.length ? JSON.stringify(unique) : null;
}

export function formatProductColorLabels(ids: string[]): string {
  return ids.map((id) => getProductColorLabel(id)).join('، ');
}

/** Shop catalog and guaranteed listings let the buyer pick a color for the cart. */
export function isProductColorSelectable(product: {
  advertiser?: string | null;
  type?: string | null;
  hasGuarantee?: boolean | null;
}): boolean {
  return product.advertiser === 'SHOP' || product.type === 'SHOP' || Boolean(product.hasGuarantee);
}

/** True when checkout must include a chosen color id. */
export function productRequiresColorChoice(product: {
  advertiser?: string | null;
  type?: string | null;
  hasGuarantee?: boolean | null;
  colors?: string[] | null;
  color?: string | null;
}): boolean {
  if (!isProductColorSelectable(product)) return false;
  const ids = Array.isArray(product.colors) ? product.colors : parseProductColorIds(product.color);
  return ids.length > 0;
}
