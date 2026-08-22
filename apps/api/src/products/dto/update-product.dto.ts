import { PRODUCT_COLOR_IDS, PRODUCT_NEIGHBORHOOD_MAX_LENGTH } from '@offroad/shared';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { NoContactInText } from '../../common/no-contact-in-text.validator';
import {
  ListingIntent,
  ProductSituation,
  ProductStatus,
  VehiclePaintCondition,
} from '../../prisma/generated/client';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'عنوان باید حداقل ۳ کاراکتر باشد' })
  @NoContactInText()
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'توضیحات باید حداقل ۱۰ کاراکتر باشد' })
  @NoContactInText()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'قیمت نمی‌تواند منفی باشد' })
  price?: number;

  @IsOptional()
  @ValidateIf((_, value) => value != null)
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'قیمت با تخفیف باید بیشتر از صفر باشد' })
  salePrice?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value != null)
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'قیمت نو محصول باید بیشتر از صفر باشد' })
  newPrice?: number | null;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  carBrands?: string[];

  @IsOptional()
  @IsBoolean()
  hasGuarantee?: boolean;

  @IsOptional()
  @IsBoolean()
  isBoosted?: boolean;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  })
  @IsString()
  @MaxLength(PRODUCT_NEIGHBORHOOD_MAX_LENGTH, {
    message: `محله حداکثر ${PRODUCT_NEIGHBORHOOD_MAX_LENGTH} کاراکتر باشد`,
  })
  neighborhood?: string | null;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(ProductSituation)
  situation?: ProductSituation;

  @IsOptional()
  @IsEnum(ListingIntent)
  listingIntent?: ListingIntent;

  @IsOptional()
  @ValidateIf((_, value) => value != null)
  @Type(() => Number)
  @IsInt({ message: 'میزان کارکرد باید عدد صحیح باشد' })
  @Min(0, { message: 'میزان کارکرد نمی‌تواند منفی باشد' })
  mileageKm?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value != null)
  @IsEnum(VehiclePaintCondition, { message: 'وضعیت رنگ را انتخاب کنید' })
  paintCondition?: VehiclePaintCondition | null;

  @IsOptional()
  @IsBoolean()
  isAuction?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  auctionStartPrice?: number;

  @IsOptional()
  @IsDateString()
  auctionEndsAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  realPriceMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  realPriceMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  buyNowPrice?: number;

  /** Shop may use 0 (out of stock); client listings require ≥ 1 (enforced in service). */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'موجودی باید عدد صحیح باشد' })
  @Min(0, { message: 'موجودی نمی‌تواند منفی باشد' })
  stockQuantity?: number;

  /** Selected listing colors (canonical ids). Empty array clears. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(PRODUCT_COLOR_IDS, { each: true, message: 'رنگ انتخاب‌شده نامعتبر است' })
  colors?: string[];

  /** @deprecated use colors — empty string / null clears. */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null) return null;
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  })
  @ValidateIf((_, v) => v != null)
  @IsString()
  color?: string | null;
}
