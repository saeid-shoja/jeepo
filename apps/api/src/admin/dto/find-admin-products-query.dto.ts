import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Advertiser, ProductStatus } from '../../prisma/generated/client';

export const ADMIN_PRODUCT_TABS = [
  'shop',
  'client',
  'pending_approval',
  'auction',
] as const;

export type AdminProductTab = (typeof ADMIN_PRODUCT_TABS)[number];

export class FindAdminProductsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(ADMIN_PRODUCT_TABS)
  tab?: AdminProductTab;

  @IsOptional()
  @Transform(({ obj }) => obj?.advertiser ?? obj?.type)
  @IsEnum(Advertiser)
  advertiser?: Advertiser;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
