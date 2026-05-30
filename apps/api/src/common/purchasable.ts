import type { Advertiser, ProductStatus } from '../prisma/generated/client';
import { isAuctionActive } from './auction';

type PurchasableProduct = {
  advertiser: Advertiser;
  hasGuarantee: boolean;
  status: ProductStatus;
  isAuction?: boolean;
  buyNowPrice?: number | null;
  auctionEndsAt?: Date | null;
};

export function getProductSalePrice(product: PurchasableProduct & { price: number }): number {
  if (product.isAuction && product.buyNowPrice != null && product.buyNowPrice > 0) {
    return product.buyNowPrice;
  }
  return product.price;
}

export function isPurchasableProduct(product: PurchasableProduct): boolean {
  if (product.status !== 'ACTIVE') return false;

  if (product.isAuction) {
    if (product.buyNowPrice == null || product.buyNowPrice <= 0) return false;
    if (!product.auctionEndsAt) return false;
    return isAuctionActive(product.auctionEndsAt);
  }

  return product.advertiser === 'SHOP' || product.hasGuarantee;
}
