import { z } from 'zod';
import { optionalIranMobileField } from '@/lib/validations/digits';

export const checkoutSchema = z.object({
  address: z.string().min(10, 'آدرس تحویل را کامل وارد کنید'),
  phone: optionalIranMobileField(),
  note: z.string().optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
