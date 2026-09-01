import { formatDiscountPercent, formatPrice, resolveProductDiscount } from '@offroad/shared';
import { cn } from '@/lib/utils';

type ProductPriceDisplayProps = {
  price: number;
  salePrice?: number | null;
  /** Card list vs product detail page. */
  variant?: 'card' | 'detail';
  className?: string;
};

export function ProductPriceDisplay({
  price,
  salePrice,
  variant = 'card',
  className,
}: ProductPriceDisplayProps) {
  const { hasDiscount, originalPrice, effectivePrice, discountPercent } = resolveProductDiscount(
    price,
    salePrice,
  );

  if (!hasDiscount) {
    return (
      <p
        className={cn(
          'font-semibold',
          variant === 'detail' ? 'text-3xl font-bold text-foreground' : 'text-sm',
          className,
        )}
      >
        {formatPrice(price)}{' '}
        <span className={variant === 'detail' ? 'text-lg font-normal' : 'text-[8px] font-normal'}>
          تومان
        </span>
      </p>
    );
  }

  return (
    <div className={cn('space-y-0.5', className)}>
      <p className={cn('text-destructive', variant === 'detail' ? 'text-base' : 'text-xs')}>
        <span className="line-through">{formatPrice(originalPrice)} تومان</span>
        {discountPercent != null && (
          <span
            className={cn(
              'text-white mr-1 font-semibold py-2 px-1 bg-primary rounded-full',
              variant === 'detail' ? 'text-sm' : 'text-[10px]',
            )}
          >
            {formatDiscountPercent(discountPercent)}
          </span>
        )}
      </p>
      <p
        className={cn(
          'font-bold',
          variant === 'detail' ? 'text-4xl text-foreground' : 'text-base font-semibold',
        )}
      >
        {formatPrice(effectivePrice)}{' '}
        <span
          className={
            variant === 'detail' ? 'text-lg font-normal text-foreground' : 'text-[8px] font-normal'
          }
        >
          تومان
        </span>
      </p>
    </div>
  );
}
