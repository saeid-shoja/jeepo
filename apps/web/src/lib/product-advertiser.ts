/** Product listing source: shop inventory vs user ad */
export type Advertiser = 'SHOP' | 'CLIENT';

export function getProductAdvertiser(product: {
  advertiser?: string | null;
  type?: string | null;
}): Advertiser {
  const value = product.advertiser ?? product.type;
  return value === 'SHOP' ? 'SHOP' : 'CLIENT';
}

export function isShopProduct(product: {
  advertiser?: string | null;
  type?: string | null;
}): boolean {
  return getProductAdvertiser(product) === 'SHOP';
}

export function isClientProduct(product: {
  advertiser?: string | null;
  type?: string | null;
}): boolean {
  return getProductAdvertiser(product) === 'CLIENT';
}

/** In-app chat is only for active user listings — not shop inventory or auctions. */
export function canStartProductChat(
  product: {
    advertiser?: string | null;
    type?: string | null;
    isAuction?: boolean;
    userId?: string | null;
    status?: string;
  },
  viewerUserId?: string | null,
): boolean {
  if (!isClientProduct(product)) return false;
  if (product.isAuction) return false;
  if (!product.userId || product.status !== 'ACTIVE') return false;
  if (viewerUserId && product.userId === viewerUserId) return false;
  return true;
}
