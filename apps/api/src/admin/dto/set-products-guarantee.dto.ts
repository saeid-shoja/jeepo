import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/** Grant or revoke shop-guarantee badge for CLIENT listings (admin only). */
export class SetProductsGuaranteeDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  productId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  userId?: string;
}
