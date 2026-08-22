'use client';

import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import {
  CART_STORAGE_KEY,
  type CartItem,
  cartItemCount,
  cartSubtotal,
  otherColorQuantity,
  sameCartLine,
} from '@/lib/cart-types';

type AddToCartInput = {
  productId: string;
  title: string;
  price: number;
  image?: string | null;
  quantity?: number;
  maxQuantity?: number;
  color?: string | null;
};

/** Supports legacy `{ items: [] }` localStorage shape */
const cartStorage: StateStorage = {
  getItem: (name) => {
    const raw = localStorage.getItem(name);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { state?: { items?: CartItem[] }; items?: CartItem[] };
      if (parsed.state) return raw;
      if (Array.isArray(parsed.items)) {
        return JSON.stringify({ state: { items: parsed.items }, version: 0 });
      }
    } catch {
      /* ignore */
    }
    return raw;
  },
  setItem: (name, value) => localStorage.setItem(name, value),
  removeItem: (name) => localStorage.removeItem(name),
};

type CartState = {
  items: CartItem[];
  addItem: (input: AddToCartInput) => void;
  removeItem: (productId: string, color?: string | null) => void;
  setQuantity: (productId: string, quantity: number, color?: string | null) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (input) => {
        const maxQty = input.maxQuantity;
        const qty = Math.max(1, input.quantity ?? 1);
        const color = input.color ?? null;
        set((state) => {
          const remaining =
            maxQty != null
              ? Math.max(0, maxQty - otherColorQuantity(state.items, input.productId, color))
              : undefined;
          const existing = state.items.find((i) => sameCartLine(i, input.productId, color));
          if (existing) {
            const cap = remaining ?? existing.maxQuantity;
            const nextQty = existing.quantity + qty;
            const capped = cap != null ? Math.min(nextQty, cap) : nextQty;
            if (capped < 1) return state;
            return {
              items: state.items.map((i) =>
                sameCartLine(i, input.productId, color)
                  ? { ...i, quantity: capped, maxQuantity: maxQty ?? i.maxQuantity }
                  : i,
              ),
            };
          }
          const capped = remaining != null ? Math.min(qty, remaining) : qty;
          if (capped < 1) return state;
          return {
            items: [
              ...state.items,
              {
                productId: input.productId,
                title: input.title,
                price: input.price,
                image: input.image ?? null,
                quantity: capped,
                maxQuantity: maxQty,
                color,
              },
            ],
          };
        });
      },

      removeItem: (productId, color) =>
        set((state) => ({
          items: state.items.filter((i) => !sameCartLine(i, productId, color)),
        })),

      setQuantity: (productId, quantity, color) => {
        if (quantity < 1) {
          set((state) => ({
            items: state.items.filter((i) => !sameCartLine(i, productId, color)),
          }));
          return;
        }
        set((state) => ({
          items: state.items.map((i) => {
            if (!sameCartLine(i, productId, color)) return i;
            const remaining =
              i.maxQuantity != null
                ? Math.max(0, i.maxQuantity - otherColorQuantity(state.items, productId, color))
                : undefined;
            const capped = remaining != null ? Math.min(quantity, remaining) : quantity;
            return { ...i, quantity: capped };
          }),
        }));
      },

      clearCart: () => set({ items: [] }),
    }),
    {
      name: CART_STORAGE_KEY,
      storage: createJSONStorage(() => cartStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

/** Convenience hook with derived totals */
export function useCart() {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const clearCart = useCartStore((s) => s.clearCart);

  return {
    items,
    itemCount: cartItemCount(items),
    subtotal: cartSubtotal(items),
    addItem,
    removeItem,
    setQuantity,
    clearCart,
  };
}
