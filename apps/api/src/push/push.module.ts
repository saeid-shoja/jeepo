import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from './push.service';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: PushService,
      useFactory: (prisma: PrismaService, publicKey: string, privateKey: string, subject: string) =>
        new PushService(prisma, publicKey, privateKey, subject),
      inject: [PrismaService, 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT'],
    },
  ],
  exports: [PushService],
})
export class PushModule {}
