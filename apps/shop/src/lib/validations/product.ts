import {
  containsLinkOrPhone,
  NO_CONTACT_IN_TEXT_MESSAGE,
  PRODUCT_COLOR_MAX_LENGTH,
  PRODUCT_NEIGHBORHOOD_MAX_LENGTH,
  toEnglishDigits,
} from '@offroad/shared';
import { z } from 'zod';
import { dateTimeLocalToIso } from '@/components/form/datetime-picker';
import {
  dataUrlByteSize,
  isWebpDataUrl,
  PRODUCT_IMAGE_MAX_BYTES,
  productImageFormatError,
  productImageSizeError,
} from '@/lib/product-image';
import { IRAN_MOBILE_REGEX } from '@/lib/validations/digits';

const situationSchema = z.enum(['NEW', 'USED']);

const phoneField = z
  .string()
  .refine((v) => !v || IRAN_MOBILE_REGEX.test(toEnglishDigits(v)), 'شماره موبایل معتبر نیست');

const listingTextField = (minLen: number, minMsg: string) =>
  z
    .string()
    .min(minLen, minMsg)
    .refine((value) => !containsLinkOrPhone(value), NO_CONTACT_IN_TEXT_MESSAGE);

const neighborhoodField = z
  .string()
  .trim()
  .max(
    PRODUCT_NEIGHBORHOOD_MAX_LENGTH,
    `محله حداکثر ${PRODUCT_NEIGHBORHOOD_MAX_LENGTH} کاراکتر باشد`,
  );

function createImagesField(requireWebp: boolean) {
  return z.array(z.string()).superRefine((images, ctx) => {
    images.forEach((image, index) => {
      if (/^https?:\/\//i.test(image)) return;

      const label = `تصویر ${(index + 1).toLocaleString('fa-IR')}`;

      if (!image.startsWith('data:image/')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: productImageFormatError(label),
          path: [index],
        });
        return;
      }

      if (dataUrlByteSize(image) > PRODUCT_IMAGE_MAX_BYTES) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: productImageSizeError(label),
          path: [index],
        });
        return;
      }

      if (requireWebp && !isWebpDataUrl(image)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: productImageFormatError(label),
          path: [index],
        });
      }
    });
  });
}

const sharedProductFields = {
  title: listingTextField(5, 'عنوان باید حداقل ۵ کاراکتر باشد'),
  description: listingTextField(10, 'توضیحات باید حداقل ۱۰ کاراکتر باشد'),
  categoryId: z.string().min(1, 'دسته‌بندی را انتخاب کنید'),
  city: z.string().optional(),
  neighborhood: neighborhoodField.optional().or(z.literal('')),
  phone: phoneField,
  situation: situationSchema,
  carBrands: z.array(z.string()),
  hasGuarantee: z.boolean(),
  applyStrengthened: z.boolean(),
  stockQuantity: z
    .number()
    .int('تعداد باید عدد صحیح باشد')
    .min(0, 'موجودی نمی‌تواند منفی باشد')
    .max(9999, 'حداکثر ۹۹۹۹ عدد'),
  color: z
    .string()
    .max(PRODUCT_COLOR_MAX_LENGTH, `رنگ حداکثر ${PRODUCT_COLOR_MAX_LENGTH} کاراکتر باشد`)
    .optional()
    .or(z.literal('')),
  /** Approximate retail / new price; required when situation is USED (non-auction). */
  newPrice: z.number(),
};

export const newProductSchema = z
  .object({
    ...sharedProductFields,
    images: createImagesField(true),
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
      if (data.situation === 'USED' && data.newPrice <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'قیمت تقریبی نو محصول را وارد کنید',
          path: ['newPrice'],
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

export const editProductSchema = z
  .object({
    ...editProductFields,
    /** Legacy JPEG/PNG data-URLs allowed until re-uploaded; size is always enforced. */
    images: createImagesField(false),
    price: z.number().positive('قیمت محصول را وارد کنید'),
    stockQuantity: z
      .number()
      .int('تعداد باید عدد صحیح باشد')
      .min(0, 'موجودی نمی‌تواند منفی باشد')
      .max(9999, 'حداکثر ۹۹۹۹ عدد'),
  })
  .superRefine((data, ctx) => {
    if (data.situation === 'USED' && data.newPrice <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'قیمت تقریبی نو محصول را وارد کنید',
        path: ['newPrice'],
      });
    }
  });

export type NewProductFormValues = z.infer<typeof newProductSchema>;
export type EditProductFormValues = z.infer<typeof editProductSchema>;
