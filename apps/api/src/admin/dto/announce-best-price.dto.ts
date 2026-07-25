import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class AnnounceBestPriceDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'حداقل یک محصول را انتخاب کنید' })
  @IsString({ each: true })
  productIds!: string[];
}
