import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { Advertiser, ProductStatus } from '../../prisma/generated/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FindAdminProductsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ obj }) => obj?.advertiser ?? obj?.type)
  @IsEnum(Advertiser)
  advertiser?: Advertiser;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
