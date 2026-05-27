import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class PlaceBidDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'مبلغ پیشنهاد باید بیشتر از صفر باشد' })
  amount!: number;

  @IsString()
  @MinLength(2, { message: 'نام و نام خانوادگی را وارد کنید' })
  bidderName!: string;

  @IsString()
  @MinLength(10, { message: 'شماره تماس معتبر وارد کنید' })
  bidderPhone!: string;

  @IsString()
  @MinLength(10, { message: 'آدرس را وارد کنید' })
  bidderAddress!: string;

  @IsOptional()
  @IsString()
  bidderCity?: string;
}
