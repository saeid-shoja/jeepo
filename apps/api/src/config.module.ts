import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  providers: [
    {
      provide: 'JWT_SECRET',
      useValue: process.env.JWT_SECRET || 'offroad-shop-secret-key-1403',
    },
    {
      provide: 'JWT_EXPIRES_IN',
      useValue: process.env.JWT_EXPIRES_IN || '7d',
    },
    {
      provide: 'RESEND_API_KEY',
      useValue: process.env.RESEND_API_KEY || '',
    },
    {
      provide: 'MAIL_FROM',
      useValue: process.env.MAIL_FROM || 'jeepo <onboarding@resend.dev>',
    },
  ],
  exports: ['JWT_SECRET', 'JWT_EXPIRES_IN', 'RESEND_API_KEY', 'MAIL_FROM'],
})
export class ConfigModule {}
