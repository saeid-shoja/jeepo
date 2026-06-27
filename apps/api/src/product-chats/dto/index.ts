import { IsString, MinLength } from 'class-validator';

export class StartConversationDto {
  @IsString({ message: 'شناسه آگهی نامعتبر است' })
  @MinLength(1, { message: 'شناسه آگهی نامعتبر است' })
  productId!: string;
}

export class SendChatMessageDto {
  @IsString()
  @MinLength(1, { message: 'متن پیام را وارد کنید' })
  body!: string;
}
