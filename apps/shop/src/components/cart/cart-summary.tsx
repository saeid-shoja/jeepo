'use client';

import { formatPrice } from '@offroad/shared';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/stores/cart-store';

type CartSummaryProps = {
  checkoutHref?: string;
  showCheckoutButton?: boolean;
};

export function CartSummary({
  checkoutHref = '/checkout',
  showCheckoutButton = true,
}: CartSummaryProps) {
  const { items, subtotal, itemCount } = useCart();

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">خلاصه سفارش</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">تعداد اقلام</span>
          <span>{itemCount} عدد</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">جمع جزء</span>
          <span>{formatPrice(subtotal)} تومان</span>
        </div>
        <div className="border-t pt-3 flex justify-between font-bold">
          <span>مبلغ قابل پرداخت</span>
          <span className="text-primary">{formatPrice(subtotal)} تومان</span>
        </div>
        {showCheckoutButton && (
          <Button asChild className="w-full">
            <Link href={checkoutHref}>ادامه و تسویه حساب</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
