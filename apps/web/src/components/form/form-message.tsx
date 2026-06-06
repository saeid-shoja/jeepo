'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

/** Fires a colorful error toast when `message` is set. */
export function FormError({ message }: { message?: string; className?: string }) {
  useEffect(() => {
    if (message) toast.error(message);
  }, [message]);
  return null;
}

/** Fires a colorful success toast when `message` is set. */
export function FormSuccess({ message }: { message?: string }) {
  useEffect(() => {
    if (message) toast.success(message);
  }, [message]);
  return null;
}
