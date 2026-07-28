'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { ProductSituation } from '@/lib/product-utils';
import { cn } from '@/lib/utils';

const OPTIONS: { value: ProductSituation; label: string }[] = [
  { value: 'USED', label: 'کارکرده' },
  { value: 'NEW', label: 'نو' },
];

type ProductSituationSelectProps = {
  value: ProductSituation;
  onChange: (value: ProductSituation) => void;
  className?: string;
};

export function ProductSituationSelect({
  value,
  onChange,
  className,
}: ProductSituationSelectProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label>وضعیت کالا</Label>
      <div className="flex gap-2">
        {OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <Button
              key={opt.value}
              type="button"
              variant={selected ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => onChange(opt.value)}
            >
              {opt.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
