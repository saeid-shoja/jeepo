'use client';

import { cn } from '@/lib/utils';

type FieldErrorProps = {
  message?: string;
  className?: string;
};

export function FieldError({ message, className }: FieldErrorProps) {
  if (!message) return null;
  return <p className={cn('text-destructive text-sm', className)}>{message}</p>;
}
