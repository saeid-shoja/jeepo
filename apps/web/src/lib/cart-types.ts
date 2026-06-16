export type CartItem = {
  productId: string;
  title: string;
  price: number;
  image: string | null;
  quantity: number;
  maxQuantity?: number;
};

export type CartState = {
  items: CartItem[];
};

export const CART_STORAGE_KEY = 'offroad-cart';

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
