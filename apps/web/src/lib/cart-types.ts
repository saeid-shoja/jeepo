export type CartItem = {
  productId: string;
  title: string;
  price: number;
  image: string | null;
  quantity: number;
  maxQuantity?: number;
  /** Canonical color id when the buyer picked a variant. */
  color?: string | null;
};

export type CartState = {
  items: CartItem[];
};

export const CART_STORAGE_KEY = 'offroad-cart';

export function sameCartLine(
  item: Pick<CartItem, 'productId' | 'color'>,
  productId: string,
  color?: string | null,
): boolean {
  return item.productId === productId && (item.color ?? null) === (color ?? null);
}

/** Qty of this product already in the cart, excluding one color line. */
export function otherColorQuantity(
  items: CartItem[],
  productId: string,
  color?: string | null,
): number {
  return items
    .filter((item) => item.productId === productId && !sameCartLine(item, productId, color))
    .reduce((sum, item) => sum + item.quantity, 0);
}

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
