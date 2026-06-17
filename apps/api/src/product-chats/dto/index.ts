import { IsString, MinLength } from 'class-validator';

export class StartConversationDto {
  @IsString()
  productId!: string;
}

export class SendChatMessageDto {
  @IsString()
  @MinLength(1, { message: 'متن پیام را وارد کنید' })
  body!: string;
}
