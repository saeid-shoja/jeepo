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
  ],
  exports: ['JWT_SECRET', 'JWT_EXPIRES_IN'],
})
export class ConfigModule {}
