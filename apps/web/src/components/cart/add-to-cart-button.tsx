'use client';

import {
  getProductColorLabel,
  parseProductColorIds,
  productRequiresColorChoice,
  resolveProductDiscount,
} from '@offroad/shared';
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
    salePrice?: number | null;
    images?: string[];
    stockQuantity?: number;
    colors?: string[] | null;
    color?: string | null;
    advertiser?: string;
    type?: string;
    hasGuarantee?: boolean;
  };
  quantity?: number;
  maxQuantity?: number;
  color?: string | null;
  requireColor?: boolean;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
  showLabel?: boolean;
};

export function AddToCartButton({
  product,
  quantity = 1,
  maxQuantity,
  color,
  requireColor = false,
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

    const colorIds = Array.isArray(product.colors)
      ? product.colors.filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
      : parseProductColorIds(product.color);

    const singleColorId = colorIds.length === 1 ? colorIds[0] : null;
    const effectiveColor = color ?? singleColorId;

    const needsColorChoice =
      (requireColor || productRequiresColorChoice(product)) && colorIds.length > 0;

    if (colorIds.length >= 2 && !effectiveColor) {
      toast.warning('لطفاً رنگ محصول را انتخاب کنید');
      if (typeof window !== 'undefined') {
        window.location.href = `/product/${product.id}`;
      }
      return;
    }

    if (needsColorChoice && colorIds.length === 1 && !effectiveColor) {
      toast.warning('لطفاً رنگ محصول را انتخاب کنید');
      return;
    }

    if (needsColorChoice && colorIds.length > 1 && !effectiveColor) {
      toast.warning('لطفاً رنگ محصول را انتخاب کنید');
      return;
    }

    const { effectivePrice } = resolveProductDiscount(product.price, product.salePrice);
    addItem({
      productId: product.id,
      title: product.title,
      price: effectivePrice,
      image: product.images?.[0] ?? null,
      quantity: qty,
      maxQuantity: stockCap,
      color: effectiveColor ?? null,
    });

    if (effectiveColor) {
      toast.success(
        `محصول «${product.title}» با رنگ ${getProductColorLabel(effectiveColor)} به سبد خرید اضافه شد`,
      );
    } else {
      toast.success('به سبد خرید اضافه شد');
    }
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
