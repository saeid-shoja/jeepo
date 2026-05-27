'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useCart } from '@/stores/cart-store';

export function CartNavButton() {
  const { itemCount } = useCart();

  return (
    <Button variant="outline" size="icon" className="relative" asChild>
      <Link href="/cart" aria-label="سبد خرید">
        <ShoppingCart className="size-4" />
        {itemCount > 0 && (
          <span className="bg-primary text-primary-foreground absolute -top-1.5 -left-1.5 flex size-5 items-center justify-center rounded-full text-[10px] font-bold">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </Link>
    </Button>
  );
}
