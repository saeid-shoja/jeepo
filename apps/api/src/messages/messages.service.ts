import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { MessageTarget, UserMessageType } from '../prisma/generated/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateMessageDto } from './dto';

const MESSAGE_TYPE_LABELS: Record<UserMessageType, string> = {
  ANNOUNCEMENT: 'اطلاعیه',
  NOTIFICATION: 'اعلان',
  MESSAGE: 'پیام',
};

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  private mapUserMessage(message: {
    id: string;
    readAt: Date | null;
    createdAt: Date;
    batch: {
      title: string;
      body: string;
      type: UserMessageType;
      createdAt: Date;
      sentBy: { name: string };
    };
  }) {
    return {
      id: message.id,
      title: message.batch.title,
      body: message.batch.body,
      type: message.batch.type,
      typeLabel: MESSAGE_TYPE_LABELS[message.batch.type],
      read: message.readAt != null,
      readAt: message.readAt,
      createdAt: message.createdAt,
      sentAt: message.batch.createdAt,
      sentByName: message.batch.sentBy.name,
    };
  }

  async sendMessage(sentById: string, dto: CreateMessageDto) {
    const title = dto.title?.trim();
    const body = dto.body?.trim();

    if (!title) {
      throw new BadRequestException('عنوان پیام را وارد کنید');
    }
    if (title.length < 2) {
      throw new BadRequestException('عنوان باید حداقل ۲ کاراکتر باشد');
    }
    if (!body) {
      throw new BadRequestException('متن پیام را وارد کنید');
    }
    if (body.length < 2) {
      throw new BadRequestException('متن پیام باید حداقل ۲ کاراکتر باشد');
    }
    if (!dto.target || !['ALL', 'USER'].includes(dto.target)) {
      throw new BadRequestException('مخاطب پیام را انتخاب کنید');
    }

    let recipients: { id: string }[];

    if (dto.target === 'USER') {
      if (!dto.userId) {
        throw new BadRequestException('شناسه کاربر الزامی است');
      }
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
        select: { id: true },
      });
      if (!user) {
        throw new NotFoundException('کاربر یافت نشد');
      }
      recipients = [user];
    } else {
      recipients = await this.prisma.user.findMany({
        select: { id: true },
      });
    }

    if (recipients.length === 0) {
      throw new BadRequestException('کاربری برای ارسال پیام یافت نشد');
    }

    const batch = await this.prisma.$transaction(async (tx) => {
      const createdBatch = await tx.messageBatch.create({
        data: {
          title,
          body,
          type: dto.type ?? 'ANNOUNCEMENT',
          target: dto.target as MessageTarget,
          targetUserId: dto.target === 'USER' ? dto.userId : null,
          sentById,
          recipientCount: recipients.length,
        },
      });

      await tx.userMessage.createMany({
        data: recipients.map((user) => ({
          batchId: createdBatch.id,
          userId: user.id,
        })),
      });

      return createdBatch;
    });

    return {
      id: batch.id,
      recipientCount: batch.recipientCount,
      message: 'پیام با موفقیت ارسال شد',
    };
  }

  async sendNotificationToUser(userId: string, title: string, body: string) {
    const admin = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    if (!admin) {
      return null;
    }

    return this.sendMessage(admin.id, {
      title,
      body,
      type: 'NOTIFICATION',
      target: 'USER',
      userId,
    });
  }

  async listBatches() {
    const batches = await this.prisma.messageBatch.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        sentBy: { select: { name: true } },
        targetUser: { select: { name: true, phone: true } },
      },
    });

    return batches.map((batch) => ({
      id: batch.id,
      title: batch.title,
      body: batch.body,
      type: batch.type,
      typeLabel: MESSAGE_TYPE_LABELS[batch.type],
      target: batch.target,
      targetLabel: batch.target === 'ALL' ? 'همه کاربران' : 'یک کاربر',
      targetUser: batch.targetUser,
      recipientCount: batch.recipientCount,
      sentByName: batch.sentBy.name,
      createdAt: batch.createdAt,
    }));
  }

  async getUserMessages(userId: string) {
    const messages = await this.prisma.userMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        batch: {
          select: {
            title: true,
            body: true,
            type: true,
            createdAt: true,
            sentBy: { select: { name: true } },
          },
        },
      },
    });

    return messages.map((message) => this.mapUserMessage(message));
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.userMessage.count({
      where: { userId, readAt: null },
    });
    return { count };
  }

  async markAsRead(userId: string, messageId: string) {
    const message = await this.prisma.userMessage.findFirst({
      where: { id: messageId, userId },
      include: {
        batch: {
          select: {
            title: true,
            body: true,
            type: true,
            createdAt: true,
            sentBy: { select: { name: true } },
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('پیام یافت نشد');
    }

    if (message.readAt) {
      return this.mapUserMessage(message);
    }

    const updated = await this.prisma.userMessage.update({
      where: { id: message.id },
      data: { readAt: new Date() },
      include: {
        batch: {
          select: {
            title: true,
            body: true,
            type: true,
            createdAt: true,
            sentBy: { select: { name: true } },
          },
        },
      },
    });

    return this.mapUserMessage(updated);
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.userMessage.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }
}
