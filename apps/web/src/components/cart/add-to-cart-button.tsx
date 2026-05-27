'use client';

import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { isPurchasable, type PurchasableProduct } from '@/lib/purchasable';
import { useCart } from '@/stores/cart-store';
import { cn } from '@/lib/utils';

type AddToCartButtonProps = {
  product: PurchasableProduct & {
    id: string;
    title: string;
    price: number;
    images?: string[];
  };
  quantity?: number;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'secondary';
  showLabel?: boolean;
};

export function AddToCartButton({
  product,
  quantity = 1,
  className,
  size = 'default',
  variant = 'default',
  showLabel = true,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  if (!isPurchasable(product)) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      image: product.images?.[0] ?? null,
      quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={cn('gap-2', className)}
      onClick={handleClick}
    >
      <ShoppingCart className="size-4" />
      {showLabel && (added ? 'اضافه شد' : 'افزودن به سبد')}
    </Button>
  );
}
