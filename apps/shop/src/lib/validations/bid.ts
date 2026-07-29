import { formatPrice } from '@offroad/shared';
import { z } from 'zod';
import { iranMobileField } from '@/lib/validations/digits';

const bidBaseSchema = z.object({
  bidAmount: z.number().positive('مبلغ پیشنهاد باید بیشتر از صفر باشد'),
  bidderName: z.string().min(2, 'نام را وارد کنید'),
  bidderPhone: iranMobileField('شماره تماس را وارد کنید'),
  bidderAddress: z.string().min(10, 'آدرس کامل را وارد کنید'),
  bidderCity: z.string().optional(),
});

export const bidSchema = bidBaseSchema;

export function createBidSchema(minNextBid: number) {
  return bidBaseSchema.superRefine((data, ctx) => {
    if (data.bidAmount < minNextBid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `حداقل مبلغ پیشنهاد ${formatPrice(minNextBid)} تومان است`,
        path: ['bidAmount'],
      });
    }
  });
}

export type BidFormValues = z.infer<typeof bidBaseSchema>;
