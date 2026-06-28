import { IsString, MinLength } from 'class-validator';

export class ReportProductDto {
  @IsString()
  @MinLength(5, { message: 'عنوان گزارش باید حداقل ۵ کاراکتر باشد' })
  title!: string;

  @IsString()
  @MinLength(50, { message: 'توضیحات گزارش باید حداقل ۵۰ کاراکتر باشد' })
  description!: string;
}
