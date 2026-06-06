export type PurchasableProduct = {
  type?: string;
  hasGuarantee?: boolean;
  purchasable?: boolean;
  status?: string;
  isAuction?: boolean;
  buyNowPrice?: number | null;
  auctionEndsAt?: string | Date | null;
  auctionActive?: boolean;
};

export function isPurchasable(product: PurchasableProduct): boolean {
  if (product.purchasable != null) return product.purchasable;
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
