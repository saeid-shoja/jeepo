export type PurchasableProduct = {
  type?: string;
  userId?: string | null;
  hasGuarantee?: boolean;
  purchasable?: boolean;
  status?: string;
  stockQuantity?: number;
  isAuction?: boolean;
  buyNowPrice?: number | null;
  auctionEndsAt?: string | Date | null;
  auctionActive?: boolean;
};

/** Whether the signed-in viewer may add this listing to cart (excludes own guaranteed ads). */
export function canViewerPurchase(
  product: PurchasableProduct,
  viewerUserId?: string | null,
): boolean {
  if (!isPurchasable(product)) return false;
  if (viewerUserId && product.userId === viewerUserId && product.hasGuarantee) {
    return false;
  }
  return true;
}

export function isPurchasable(product: PurchasableProduct): boolean {
  if (product.purchasable != null) return product.purchasable;
  if ((product.stockQuantity ?? 1) < 1) return false;
  if (product.isAuction) {
    return Boolean(product.auctionActive && product.buyNowPrice && product.buyNowPrice > 0);
  }
  return (
    product.status !== 'DEPRECATED' && (product.type === 'SHOP' || Boolean(product.hasGuarantee))
  );
}

export function getBuyNowPrice(product: {
  isAuction?: boolean;
  buyNowPrice?: number | null;
  price: number;
}): number {
  if (product.isAuction && product.buyNowPrice != null && product.buyNowPrice > 0) {
    return product.buyNowPrice;
  }
  return product.price;
}
