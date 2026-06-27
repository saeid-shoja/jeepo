import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { NoContactInText } from '../../common/no-contact-in-text.validator';
import { Advertiser, ProductSituation } from '../../prisma/generated/client';

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
  @IsString()
  phone?: string;

  @IsOptional()
  @Transform(({ obj }) => obj?.advertiser ?? obj?.type)
  @IsEnum(Advertiser)
  advertiser?: Advertiser;

  @IsOptional()
  @IsEnum(ProductSituation)
  situation?: ProductSituation;

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
