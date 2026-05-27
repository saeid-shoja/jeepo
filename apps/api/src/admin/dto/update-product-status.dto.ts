import { IsEnum } from 'class-validator';
import { ProductStatus } from '../../prisma/generated/client';

export class UpdateProductStatusDto {
  @IsEnum(ProductStatus, { message: 'وضعیت محصول معتبر نیست' })
  status!: ProductStatus;
}
