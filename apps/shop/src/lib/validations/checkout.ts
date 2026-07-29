import { z } from 'zod';
import { iranMobileField } from '@/lib/validations/digits';

export const checkoutSchema = z.object({
  city: z.string().trim().min(1, 'شهر را انتخاب کنید'),
  address: z.string().trim().min(5, 'آدرس دقیق (خیابان، پلاک، واحد) را وارد کنید'),
  phone: iranMobileField(),
  note: z.string().optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
