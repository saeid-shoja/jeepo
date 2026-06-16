import { z } from 'zod';
import { dateTimeLocalToIso } from '@/components/form/datetime-picker';

const situationSchema = z.enum(['NEW', 'USED']);

const phoneField = z
  .string()
  .optional()
  .refine((v) => !v || /^09\d{9}$/.test(v), 'شماره موبایل معتبر نیست');

const sharedProductFields = {
  title: z.string().min(5, 'عنوان باید حداقل ۵ کاراکتر باشد'),
  description: z.string().min(10, 'توضیحات باید حداقل ۱۰ کاراکتر باشد'),
  categoryId: z.string().min(1, 'دسته‌بندی را انتخاب کنید'),
  city: z.string().optional(),
  phone: phoneField,
  situation: situationSchema,
  carBrands: z.array(z.string()),
  images: z.array(z.string()),
  hasGuarantee: z.boolean(),
  applyStrengthened: z.boolean(),
  stockQuantity: z
    .number()
    .int('تعداد باید عدد صحیح باشد')
    .min(1, 'حداقل ۱ عدد')
    .max(9999, 'حداکثر ۹۹۹۹ عدد'),
};

export const newProductSchema = z
  .object({
    ...sharedProductFields,
    price: z.number(),
    isAuction: z.boolean(),
    auctionStartPrice: z.number(),
    auctionEndsAtLocal: z.string(),
    realPriceMin: z.number(),
    realPriceMax: z.number(),
    buyNowPrice: z.number(),
  })
  .superRefine((data, ctx) => {
    if (!data.isAuction) {
      if (data.price <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'قیمت محصول را وارد کنید',
          path: ['price'],
        });
      }
      return;
    }

    if (data.auctionStartPrice <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'قیمت شروع مزایده را وارد کنید',
        path: ['auctionStartPrice'],
      });
    }
    if (data.buyNowPrice <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'قیمت خرید فوری را وارد کنید',
        path: ['buyNowPrice'],
      });
    }
    if (
      data.buyNowPrice > 0 &&
      data.auctionStartPrice > 0 &&
      data.buyNowPrice <= data.auctionStartPrice
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'قیمت خرید فوری باید بیشتر از قیمت شروع باشد',
        path: ['buyNowPrice'],
      });
    }
    if (data.realPriceMin <= 0 || data.realPriceMax <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'بازه قیمت واقعی را کامل وارد کنید',
        path: ['realPriceMin'],
      });
    }
    if (data.realPriceMin > data.realPriceMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'حداقل قیمت واقعی نمی‌تواند بیشتر از حداکثر باشد',
        path: ['realPriceMin'],
      });
    }
    if (!data.auctionEndsAtLocal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'زمان پایان مزایده را انتخاب کنید',
        path: ['auctionEndsAtLocal'],
      });
    } else {
      const ends = new Date(dateTimeLocalToIso(data.auctionEndsAtLocal));
      if (ends.getTime() <= Date.now()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'زمان پایان باید در آینده باشد',
          path: ['auctionEndsAtLocal'],
        });
      }
    }
  });

const { applyStrengthened: _applyStrengthened, ...editProductFields } = sharedProductFields;

export const editProductSchema = z.object({
  ...editProductFields,
  price: z.number().positive('قیمت محصول را وارد کنید'),
  stockQuantity: z
    .number()
    .int('تعداد باید عدد صحیح باشد')
    .min(1, 'حداقل ۱ عدد')
    .max(9999, 'حداکثر ۹۹۹۹ عدد'),
});

export type NewProductFormValues = z.infer<typeof newProductSchema>;
export type EditProductFormValues = z.infer<typeof editProductSchema>;
