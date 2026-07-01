'use client';

import {
  normalizeLoginIdentifier,
  normalizeTelegramIdInput,
  toEnglishDigits,
} from '@offroad/shared';
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type DigitsInputProps = React.ComponentProps<typeof Input>;

function patchChangeValue(
  e: React.ChangeEvent<HTMLInputElement>,
  normalize: (value: string) => string,
) {
  const normalized = normalize(e.target.value);
  if (normalized !== e.target.value) {
    e.target.value = normalized;
  }
}

export const DigitsInput = React.forwardRef<HTMLInputElement, DigitsInputProps>(
  ({ onChange, className, dir = 'ltr', ...props }, ref) => (
    <Input
      ref={ref}
      dir={dir}
      className={cn('text-end', className)}
      {...props}
      onChange={(e) => {
        patchChangeValue(e, toEnglishDigits);
        onChange?.(e);
      }}
    />
  ),
);
DigitsInput.displayName = 'DigitsInput';

export const LoginIdentifierInput = React.forwardRef<HTMLInputElement, DigitsInputProps>(
  ({ onChange, className, dir = 'ltr', ...props }, ref) => (
    <Input
      ref={ref}
      dir={dir}
      className={cn('text-end', className)}
      {...props}
      onChange={(e) => {
        patchChangeValue(e, normalizeLoginIdentifier);
        onChange?.(e);
      }}
    />
  ),
);
LoginIdentifierInput.displayName = 'LoginIdentifierInput';

export const TelegramIdInput = React.forwardRef<HTMLInputElement, DigitsInputProps>(
  ({ onChange, className, dir = 'ltr', ...props }, ref) => (
    <Input
      ref={ref}
      dir={dir}
      className={cn('text-end', className)}
      {...props}
      onChange={(e) => {
        patchChangeValue(e, normalizeTelegramIdInput);
        onChange?.(e);
      }}
    />
  ),
);
TelegramIdInput.displayName = 'TelegramIdInput';
