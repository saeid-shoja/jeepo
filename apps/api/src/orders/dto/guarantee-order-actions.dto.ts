import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class SubmitPackagingEvidenceDto {
  @IsString()
  @MaxLength(1_400_000)
  video!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(15)
  videoDurationSeconds!: number;

  @IsArray()
  @ArrayMinSize(1, { message: 'حداقل یک عکس از بسته‌بندی لازم است' })
  @ArrayMaxSize(5, { message: 'حداکثر ۵ عکس از بسته‌بندی مجاز است' })
  @IsString({ each: true })
  @MaxLength(140_000, { each: true })
  images!: string[];
}

export class SubmitShippingEvidenceDto {
  @IsString()
  @MaxLength(140_000)
  receipt!: string;
}

export class ResolveGuaranteedOrderItemDto {
  @IsIn(['PAY_SELLER', 'APPROVE_CANCEL', 'UNDER_REVIEW'])
  action!: 'PAY_SELLER' | 'APPROVE_CANCEL' | 'UNDER_REVIEW';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class ExtendGuaranteedOrderDeadlineDto {
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'تمدید مهلت باید حداقل یک روز باشد' })
  @Max(3650, { message: 'تمدید مهلت نمی‌تواند بیشتر از ۳۶۵۰ روز باشد' })
  days!: number;
}
