'use client';

import { formatPrice, parsePriceInput } from '@offroad/shared';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type PriceInputProps = {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
};

export function PriceInput({
  value,
  onChange,
  className,
  placeholder = 'مثلاً: ۵٬۰۰۰٬۰۰۰',
  required,
  id,
}: PriceInputProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!focused) {
      setDraft(value > 0 ? String(value) : '');
    }
  }, [value, focused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parsePriceInput(e.target.value);
    setDraft(parsed > 0 ? String(parsed) : '');
    onChange(parsed);
  };

  const numeric = focused ? (draft ? Number(draft) : 0) : value;
  const displayValue = focused
    ? numeric > 0
      ? numeric.toLocaleString('en-US')
      : ''
    : numeric > 0
      ? formatPrice(numeric)
      : '';

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      dir="ltr"
      className={cn('text-end', className)}
      value={displayValue}
      onChange={handleChange}
      onFocus={() => {
        setFocused(true);
        setDraft(value > 0 ? String(value) : '');
      }}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      required={required && value <= 0}
      aria-invalid={required && value <= 0}
    />
  );
}
