'use client';

import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatPrice } from '@offroad/shared';

import { Button } from '@/components/ui/button';
import type { CartItem } from '@/lib/cart-types';
import { useCart } from '@/stores/cart-store';

export function CartLineItem({ item }: { item: CartItem }) {
  const { setQuantity, removeItem } = useCart();
  const lineTotal = item.price * item.quantity;

  return (
    <div className="flex gap-4 border-b py-4 last:border-0">
      <Link
        href={`/product/${item.productId}`}
        className="bg-muted size-20 shrink-0 overflow-hidden rounded-lg"
      >
        {item.image ? (
          <img src={item.image} alt="" className="size-full object-cover" />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center text-xs">
            بدون تصویر
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/product/${item.productId}`} className="line-clamp-2 text-sm font-medium hover:text-primary">
            {item.title}
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-destructive"
            onClick={() => removeItem(item.productId)}
            aria-label="حذف"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-lg border">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setQuantity(item.productId, item.quantity - 1)}
              aria-label="کم کردن"
            >
              <Minus className="size-4" />
            </Button>
            <span className="min-w-8 text-center text-sm font-medium">{item.quantity}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setQuantity(item.productId, item.quantity + 1)}
              aria-label="زیاد کردن"
            >
              <Plus className="size-4" />
            </Button>
          </div>

          <div className="text-end">
            <p className="text-primary text-sm font-bold">
              {formatPrice(lineTotal)} <span className="text-muted-foreground text-xs font-normal">تومان</span>
            </p>
            <p className="text-muted-foreground text-xs">
              واحد: {formatPrice(item.price)} تومان
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
