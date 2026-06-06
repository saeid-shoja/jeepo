'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={(resolvedTheme as 'light' | 'dark') ?? 'system'}
      richColors
      dir="rtl"
      position="top-center"
      closeButton
      toastOptions={{
        classNames: {
          toast: 'font-[inherit]',
          title: 'text-sm font-medium',
          description: 'text-sm',
        },
      }}
    />
  );
}
