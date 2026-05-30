import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Advertiser, ProductStatus } from '../../prisma/generated/client';

export class FindAdminProductsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ obj }) => obj?.advertiser ?? obj?.type)
  @IsEnum(Advertiser)
  advertiser?: Advertiser;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
