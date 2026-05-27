'use client';

import { Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type DateTimePickerProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (isoValue: string) => void;
  min?: string;
  required?: boolean;
  className?: string;
  hint?: string;
};

/** Native datetime-local picker styled for RTL forms */
export function DateTimePicker({
  id = 'auction-ends',
  label = 'زمان پایان مزایده',
  value,
  onChange,
  min,
  required,
  className,
  hint,
}: DateTimePickerProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id} className="flex items-center gap-2">
        <Calendar className="text-muted-foreground size-4" />
        {label}
      </Label>
      <Input
        id={id}
        type="datetime-local"
        value={value}
        min={min}
        required={required}
        dir="ltr"
        className="text-end"
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}

/** Default min: 1 hour from now (for datetime-local) */
export function defaultMinDateTimeLocal(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Convert datetime-local value to ISO string for API */
export function dateTimeLocalToIso(local: string): string {
  if (!local) return '';
  return new Date(local).toISOString();
}
