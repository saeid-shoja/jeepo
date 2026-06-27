import { Type } from 'class-transformer';
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
} from 'class-validator';
import { NoContactInText } from '../../common/no-contact-in-text.validator';
import { ProductSituation, ProductStatus } from '../../prisma/generated/client';

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
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(ProductSituation)
  situation?: ProductSituation;

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

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'حداقل موجودی ۱ عدد است' })
  stockQuantity?: number;
}
