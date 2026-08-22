'use client';

import { getProductColor, getProductColorSwatchStyle, type ProductColorId } from '@offroad/shared';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type ProductColorSwatchesProps = {
  colorIds: string[];
  selectedId?: string | null;
  selectable?: boolean;
  onSelect?: (id: ProductColorId) => void;
  size?: 'sm' | 'md';
  showLabels?: boolean;
};

export function ProductColorSwatches({
  colorIds,
  selectedId,
  selectable = false,
  onSelect,
  size = 'md',
  showLabels = false,
}: ProductColorSwatchesProps) {
  const ids = colorIds.filter((id) => getProductColor(id));
  if (ids.length === 0) return null;

  const dim = size === 'sm' ? 'size-6' : 'size-8';

  return (
    <div className="flex flex-wrap items-start gap-2">
      {ids.map((id) => {
        const color = getProductColor(id)!;
        const selected = selectedId === id;
        const style = getProductColorSwatchStyle(color);
        const checkClass = color.ink === 'dark' ? 'text-neutral-900' : 'text-white';
        const swatchClass = cn(
          'relative shrink-0 rounded-full border border-black/15 shadow-sm',
          dim,
          selected && selectable && 'ring-2 ring-primary',
        );

        return (
          <div key={id} className="flex flex-col items-center gap-1">
            {selectable ? (
              <button
                type="button"
                aria-label={color.label}
                aria-pressed={selected}
                title={color.label}
                onClick={() => onSelect?.(id as ProductColorId)}
                className={cn(
                  swatchClass,
                  'cursor-pointer ring-offset-2 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
                style={style}
              >
                {selected ? (
                  <Check
                    className={cn('absolute inset-0 m-auto size-3.5 stroke-[3]', checkClass)}
                  />
                ) : null}
              </button>
            ) : (
              <span title={color.label} className={swatchClass} style={style} />
            )}
            {showLabels ? (
              <span className="text-muted-foreground max-w-14 text-center text-[10px] leading-tight">
                {color.label}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
