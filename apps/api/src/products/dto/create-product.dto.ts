import { PRODUCT_NEIGHBORHOOD_MAX_LENGTH } from '@offroad/shared';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
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
import { Advertiser, ProductSituation, VehiclePaintCondition } from '../../prisma/generated/client';

export class CreateProductDto {
  @IsString()
  @MinLength(3, { message: 'عنوان باید حداقل ۳ کاراکتر باشد' })
  @NoContactInText()
  title!: string;

  @IsString()
  @MinLength(10, { message: 'توضیحات باید حداقل ۱۰ کاراکتر باشد' })
  @NoContactInText()
  description!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'قیمت نمی‌تواند منفی باشد' })
  price!: number;

  /** Approximate retail / new price (optional; mainly for USED listings). */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'قیمت نو محصول باید بیشتر از صفر باشد' })
  newPrice?: number;

  @IsString()
  categoryId!: string;

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

  /** تقویت شده — pin on top for 4 days (client listings) */
  @IsOptional()
  @IsBoolean()
  applyStrengthened?: boolean;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  })
  @IsString()
  @MaxLength(PRODUCT_NEIGHBORHOOD_MAX_LENGTH, {
    message: `محله حداکثر ${PRODUCT_NEIGHBORHOOD_MAX_LENGTH} کاراکتر باشد`,
  })
  neighborhood?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @Transform(({ obj }) => obj?.advertiser ?? obj?.type)
  @IsEnum(Advertiser)
  advertiser?: Advertiser;

  @IsOptional()
  @IsEnum(ProductSituation)
  situation?: ProductSituation;

  /** Odometer mileage in km — required for vehicle/motorcycle sale categories. */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'میزان کارکرد باید عدد صحیح باشد' })
  @Min(0, { message: 'میزان کارکرد نمی‌تواند منفی باشد' })
  mileageKm?: number;

  /** Body/paint condition — required for vehicle/motorcycle sale categories. */
  @IsOptional()
  @IsEnum(VehiclePaintCondition, { message: 'وضعیت رنگ را انتخاب کنید' })
  paintCondition?: VehiclePaintCondition;

  @IsOptional()
  @IsBoolean()
  isAuction?: boolean;

  @ValidateIf((o) => o.isAuction === true)
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'قیمت شروع مزایده را وارد کنید' })
  auctionStartPrice?: number;

  @ValidateIf((o) => o.isAuction === true)
  @IsDateString({}, { message: 'تاریخ پایان مزایده معتبر نیست' })
  auctionEndsAt?: string;

  @ValidateIf((o) => o.isAuction === true)
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'حداقل قیمت واقعی را وارد کنید' })
  realPriceMin?: number;

  @ValidateIf((o) => o.isAuction === true)
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'حداکثر قیمت واقعی را وارد کنید' })
  realPriceMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  buyNowPrice?: number;

  /** How many units are available for sale (default 1). */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'حداقل موجودی ۱ عدد است' })
  stockQuantity?: number;
}
