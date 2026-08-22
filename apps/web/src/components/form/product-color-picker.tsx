'use client';

import { getProductColorSwatchStyle, PRODUCT_COLORS, type ProductColorId } from '@offroad/shared';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type ProductColorPickerProps = {
  value: string[];
  onChange: (ids: ProductColorId[]) => void;
};

export function ProductColorPicker({ value, onChange }: ProductColorPickerProps) {
  const selected = new Set(value);

  const toggle = (id: ProductColorId) => {
    if (selected.has(id)) {
      onChange(value.filter((item) => item !== id) as ProductColorId[]);
      return;
    }
    onChange([...value, id] as ProductColorId[]);
  };

  return (
    <div className="flex flex-wrap gap-3">
      {PRODUCT_COLORS.map((color) => {
        const isOn = selected.has(color.id);
        const style = getProductColorSwatchStyle(color);
        const checkClass = color.ink === 'dark' ? 'text-neutral-900' : 'text-white';

        return (
          <div key={color.id}>
            <button
              type="button"
              aria-pressed={isOn}
              aria-label={color.label}
              onClick={() => toggle(color.id)}
              className="flex flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  'relative size-9 rounded-full border border-black/15 shadow-sm transition hover:scale-105',
                  isOn && 'ring-2 ring-primary ring-offset-2',
                )}
                style={style}
              >
                {isOn ? (
                  <Check className={cn('absolute inset-0 m-auto size-4 stroke-[3]', checkClass)} />
                ) : null}
              </span>
              <span className="text-muted-foreground max-w-16 text-center text-[11px] leading-tight">
                {color.label}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
