'use client';

import {
  formatPrice,
  getProductColor,
  getProductColorLabel,
  getProductColorSwatchStyle,
} from '@offroad/shared';
import { Minus, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { CartItem } from '@/lib/cart-types';
import { useCart } from '@/stores/cart-store';

export function CartLineItem({ item }: { item: CartItem }) {
  const { setQuantity, removeItem } = useCart();
  const lineTotal = item.price * item.quantity;
  const colorSwatch = item.color ? getProductColor(item.color) : undefined;

  return (
    <div className="flex gap-4 border-b py-4 last:border-0">
      <Link
        href={`/product/${item.productId}`}
        className="bg-muted size-20 shrink-0 overflow-hidden rounded-lg"
      >
        {item.image ? (
          <Image
            width={300}
            height={400}
            src={item.image}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center text-xs">
            بدون تصویر
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/product/${item.productId}`}
              className="line-clamp-2 text-sm font-medium hover:text-primary"
            >
              {item.title}
            </Link>
            {item.color ? (
              <span className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
                <span
                  className="size-3.5 shrink-0 rounded-full border border-black/15"
                  style={
                    colorSwatch
                      ? getProductColorSwatchStyle(colorSwatch)
                      : { backgroundColor: '#ccc' }
                  }
                />
                {getProductColorLabel(item.color)}
              </span>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-destructive"
            onClick={() => removeItem(item.productId, item.color)}
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
              onClick={() => setQuantity(item.productId, item.quantity - 1, item.color)}
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
              onClick={() => setQuantity(item.productId, item.quantity + 1, item.color)}
              disabled={item.maxQuantity != null && item.quantity >= item.maxQuantity}
              aria-label="زیاد کردن"
            >
              <Plus className="size-4" />
            </Button>
          </div>

          <div className="text-end">
            <p className="text-primary text-sm font-bold">
              {formatPrice(lineTotal)}{' '}
              <span className="text-muted-foreground text-xs font-normal">تومان</span>
            </p>
            <p className="text-muted-foreground text-xs">واحد: {formatPrice(item.price)} تومان</p>
          </div>
        </div>
      </div>
    </div>
  );
}
