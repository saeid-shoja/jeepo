'use client';

import { useEffect, useState } from 'react';
import { formatPrice } from '@offroad/shared';
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
  placeholder = 'مثلاً: 5000000',
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
    const digits = e.target.value.replace(/\D/g, '');
    setDraft(digits);
    onChange(digits ? Number(digits) : 0);
  };

  const displayValue = focused
    ? draft
    : value > 0
      ? formatPrice(value)
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
