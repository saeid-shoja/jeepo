import { PRODUCT_COLOR_IDS } from '@offroad/shared';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class OrderItemDto {
  @IsString()
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  @IsIn(PRODUCT_COLOR_IDS, { message: 'رنگ انتخاب‌شده نامعتبر است' })
  color?: string;
}
