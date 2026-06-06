'use client';

import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      theme="light"
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
