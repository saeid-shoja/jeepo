'use client';

import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { canViewerPurchase, type PurchasableProduct } from '@/lib/purchasable';
import { cn } from '@/lib/utils';
import { useAuth } from '@/stores/auth-store';
import { useCart } from '@/stores/cart-store';

type AddToCartButtonProps = {
  product: PurchasableProduct & {
    id: string;
    title: string;
    price: number;
    images?: string[];
    stockQuantity?: number;
  };
  quantity?: number;
  maxQuantity?: number;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
  showLabel?: boolean;
};

export function AddToCartButton({
  product,
  quantity = 1,
  maxQuantity,
  className,
  size = 'default',
  variant = 'default',
  showLabel = true,
}: AddToCartButtonProps) {
  const { user } = useAuth();
  const { addItem } = useCart();

  if (!canViewerPurchase(product, user?.id)) return null;

  const stockCap = maxQuantity ?? product.stockQuantity ?? 1;
  if (stockCap < 1) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const qty = Math.min(quantity, stockCap);
    addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      image: product.images?.[0] ?? null,
      quantity: qty,
      maxQuantity: stockCap,
    });
    toast.success('به سبد خرید اضافه شد');
  };

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={cn('gap-2 mt-1 text-[13px] w-full hover:scale-105', className)}
      onClick={handleClick}
    >
      <ShoppingCart className="size-3.5" />
      {showLabel && 'افزودن به سبد'}
    </Button>
  );
}
