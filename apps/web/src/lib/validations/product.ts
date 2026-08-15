import {
  containsLinkOrPhone,
  isVehicleSaleCategory,
  NO_CONTACT_IN_TEXT_MESSAGE,
  PRODUCT_COLOR_MAX_LENGTH,
  PRODUCT_NEIGHBORHOOD_MAX_LENGTH,
  toEnglishDigits,
  VEHICLE_PAINT_CONDITIONS,
} from '@offroad/shared';
import { z } from 'zod';
import { dateTimeLocalToIso } from '@/components/form/datetime-picker';
import {
  dataUrlByteSize,
  isVideoDataUrl,
  isWebpDataUrl,
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_VIDEO_MAX_BYTES,
  productImageFormatError,
  productImageSizeError,
  productVideoFormatError,
  productVideoSizeError,
} from '@/lib/product-image';
import { IRAN_MOBILE_REGEX } from '@/lib/validations/digits';

const situationSchema = z.enum(['NEW', 'USED']);
const paintConditionSchema = z.enum(
  VEHICLE_PAINT_CONDITIONS.map((o) => o.value) as [
    (typeof VEHICLE_PAINT_CONDITIONS)[number]['value'],
    ...(typeof VEHICLE_PAINT_CONDITIONS)[number]['value'][],
  ],
);

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

      const label = `رسانه ${(index + 1).toLocaleString('fa-IR')}`;

      if (isVideoDataUrl(image)) {
        if (dataUrlByteSize(image) > PRODUCT_VIDEO_MAX_BYTES) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: productVideoSizeError(label),
            path: [index],
          });
        }
        return;
      }

      if (!image.startsWith('data:image/')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: requireWebp ? productImageFormatError(label) : productVideoFormatError(label),
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

/** Shop (admin) may set 0 = out of stock; client listings require at least 1. */
function stockQuantityField(allowZeroStock: boolean) {
  return z
    .number()
    .int('تعداد باید عدد صحیح باشد')
    .min(
      allowZeroStock ? 0 : 1,
      allowZeroStock ? 'موجودی نمی‌تواند منفی باشد' : 'تعداد باید حداقل ۱ باشد',
    )
    .max(9999, 'حداکثر ۹۹۹۹ عدد');
}

const sharedProductFieldsBase = {
  title: listingTextField(5, 'عنوان باید حداقل ۵ کاراکتر باشد'),
  description: listingTextField(10, 'توضیحات باید حداقل ۱۰ کاراکتر باشد'),
  categoryId: z.string().min(1, 'دسته‌بندی را انتخاب کنید'),
  /** Synced from selected category — used to require vehicle-sale fields. */
  categorySlug: z.string().optional().or(z.literal('')),
  city: z.string().optional(),
  neighborhood: neighborhoodField.optional().or(z.literal('')),
  phone: phoneField,
  situation: situationSchema,
  carBrands: z.array(z.string()),
  hasGuarantee: z.boolean(),
  applyStrengthened: z.boolean(),
  /** Optional product color. */
  color: z
    .string()
    .max(PRODUCT_COLOR_MAX_LENGTH, `رنگ حداکثر ${PRODUCT_COLOR_MAX_LENGTH} کاراکتر باشد`)
    .optional()
    .or(z.literal('')),
  /** Approximate retail / new price; required when situation is USED (non-auction). */
  newPrice: z.number(),
  /** Optional discounted selling price; must be lower than price when set. */
  salePrice: z.number(),
  mileageKm: z.number().nullable(),
  paintCondition: z.union([paintConditionSchema, z.literal('')]),
};

function refineVehicleSaleFields(
  data: {
    categorySlug?: string;
    mileageKm: number | null;
    paintCondition: string;
  },
  ctx: z.RefinementCtx,
) {
  if (!data.categorySlug || !isVehicleSaleCategory(data.categorySlug)) return;
  if (data.mileageKm == null || !Number.isFinite(data.mileageKm) || data.mileageKm < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'میزان کارکرد (کیلومتر) را وارد کنید',
      path: ['mileageKm'],
    });
  }
  if (!data.paintCondition) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'وضعیت رنگ را انتخاب کنید',
      path: ['paintCondition'],
    });
  }
}

function refineNewProductForm(
  data: {
    categorySlug?: string;
    mileageKm: number | null;
    paintCondition: string;
    isAuction: boolean;
    price: number;
    salePrice: number;
    situation: 'NEW' | 'USED';
    newPrice: number;
    auctionStartPrice: number;
    buyNowPrice: number;
    realPriceMin: number;
    realPriceMax: number;
    auctionEndsAtLocal: string;
  },
  ctx: z.RefinementCtx,
) {
  refineVehicleSaleFields(data, ctx);

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
    if (data.salePrice > 0) {
      if (data.price <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'ابتدا قیمت اصلی را وارد کنید',
          path: ['price'],
        });
      } else if (data.salePrice >= data.price) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'قیمت با تخفیف باید کمتر از قیمت اصلی باشد',
          path: ['salePrice'],
        });
      }
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
}

export function createNewProductSchema(options: { allowZeroStock: boolean }) {
  return z
    .object({
      ...sharedProductFieldsBase,
      stockQuantity: stockQuantityField(options.allowZeroStock),
      images: createImagesField(true),
      price: z.number(),
      salePrice: z.number(),
      isAuction: z.boolean(),
      auctionStartPrice: z.number(),
      auctionEndsAtLocal: z.string(),
      realPriceMin: z.number(),
      realPriceMax: z.number(),
      buyNowPrice: z.number(),
    })
    .superRefine(refineNewProductForm);
}

/** Default: client listings (stock ≥ 1). */
export const newProductSchema = createNewProductSchema({ allowZeroStock: false });

export function createEditProductSchema(options: { allowZeroStock: boolean }) {
  const { applyStrengthened: _applyStrengthened, ...editProductFields } = sharedProductFieldsBase;

  return z
    .object({
      ...editProductFields,
      stockQuantity: stockQuantityField(options.allowZeroStock),
      /** Legacy JPEG/PNG data-URLs allowed until re-uploaded; size is always enforced. */
      images: createImagesField(false),
      price: z.number().positive('قیمت محصول را وارد کنید'),
      salePrice: z.number(),
    })
    .superRefine((data, ctx) => {
      refineVehicleSaleFields(data, ctx);

      if (data.situation === 'USED' && data.newPrice <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'قیمت تقریبی نو محصول را وارد کنید',
          path: ['newPrice'],
        });
      }
      if (data.salePrice > 0 && data.salePrice >= data.price) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'قیمت با تخفیف باید کمتر از قیمت اصلی باشد',
          path: ['salePrice'],
        });
      }
    });
}

/** Default: client listings (stock ≥ 1). */
export const editProductSchema = createEditProductSchema({ allowZeroStock: false });

export type NewProductFormValues = z.infer<typeof newProductSchema>;
export type EditProductFormValues = z.infer<typeof editProductSchema>;
