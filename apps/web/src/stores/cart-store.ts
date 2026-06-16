'use client';

import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { CART_STORAGE_KEY, type CartItem, cartItemCount, cartSubtotal } from '@/lib/cart-types';

type AddToCartInput = {
  productId: string;
  title: string;
  price: number;
  image?: string | null;
  quantity?: number;
  maxQuantity?: number;
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
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (input) => {
        const maxQty = input.maxQuantity;
        const qty = Math.max(1, input.quantity ?? 1);
        set((state) => {
          const existing = state.items.find((i) => i.productId === input.productId);
          if (existing) {
            const cap = maxQty ?? existing.maxQuantity;
            const nextQty = existing.quantity + qty;
            const capped = cap != null ? Math.min(nextQty, cap) : nextQty;
            return {
              items: state.items.map((i) =>
                i.productId === input.productId
                  ? { ...i, quantity: capped, maxQuantity: cap ?? i.maxQuantity }
                  : i,
              ),
            };
          }
          const capped = maxQty != null ? Math.min(qty, maxQty) : qty;
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
              },
            ],
          };
        });
      },

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      setQuantity: (productId, quantity) => {
        if (quantity < 1) {
          set((state) => ({
            items: state.items.filter((i) => i.productId !== productId),
          }));
          return;
        }
        set((state) => ({
          items: state.items.map((i) => {
            if (i.productId !== productId) return i;
            const cap = i.maxQuantity;
            const capped = cap != null ? Math.min(quantity, cap) : quantity;
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
