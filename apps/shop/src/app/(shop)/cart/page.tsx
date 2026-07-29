'use client';

import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';

import { CartLineItem } from '@/components/cart/cart-line-item';
import { CartSummary } from '@/components/cart/cart-summary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/stores/cart-store';

export default function CartPage() {
  const { items } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <ShoppingBag className="text-muted-foreground mx-auto size-14 opacity-40" />
        <h1 className="mt-4 text-xl font-bold">سبد خرید شما خالی است</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          محصولات فروشگاه یا دارای تضمین فروشگاه را به سبد اضافه کنید.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">مشاهده فروشگاه</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">سبد خرید</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">اقلام سبد ({items.length} محصول)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {items.map((item) => (
              <CartLineItem key={item.productId} item={item} />
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-1">
          <CartSummary />
        </div>
      </div>
    </div>
  );
}
