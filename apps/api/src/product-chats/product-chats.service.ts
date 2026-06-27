import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { SendChatMessageDto } from './dto';

const conversationInclude = {
  product: {
    select: {
      id: true,
      title: true,
      price: true,
      images: true,
      status: true,
      userId: true,
    },
  },
  buyer: { select: { id: true, name: true } },
  seller: { select: { id: true, name: true } },
} as const;

@Injectable()
export class ProductChatsService {
  constructor(private prisma: PrismaService) {}

  private parseImages(images: string): string[] {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private mapConversation(
    conversation: {
      id: string;
      productId: string;
      buyerId: string;
      sellerId: string;
      lastMessageAt: Date;
      createdAt: Date;
      product: {
        id: string;
        title: string;
        price: number;
        images: string;
        status: string;
        userId: string | null;
      };
      buyer: { id: string; name: string };
      seller: { id: string; name: string };
      messages?: Array<{
        id: string;
        body: string;
        senderId: string;
        readAt: Date | null;
        createdAt: Date;
      }>;
    },
    viewerUserId: string,
  ) {
    const isBuyer = conversation.buyerId === viewerUserId;
    const otherParty = isBuyer ? conversation.seller : conversation.buyer;
    const lastMessage = conversation.messages?.[0] ?? null;
    const unreadCount =
      conversation.messages?.filter((m) => m.senderId !== viewerUserId && !m.readAt).length ?? 0;

    return {
      id: conversation.id,
      productId: conversation.productId,
      buyerId: conversation.buyerId,
      sellerId: conversation.sellerId,
      role: isBuyer ? ('buyer' as const) : ('seller' as const),
      lastMessageAt: conversation.lastMessageAt,
      createdAt: conversation.createdAt,
      unreadCount,
      otherParty: { id: otherParty.id, name: otherParty.name },
      product: {
        id: conversation.product.id,
        title: conversation.product.title,
        price: conversation.product.price,
        status: conversation.product.status,
        image: this.parseImages(conversation.product.images)[0] ?? null,
      },
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            body: lastMessage.body,
            senderId: lastMessage.senderId,
            isMine: lastMessage.senderId === viewerUserId,
            readAt: lastMessage.readAt,
            createdAt: lastMessage.createdAt,
          }
        : null,
    };
  }

  private mapMessage(
    message: {
      id: string;
      body: string;
      senderId: string;
      readAt: Date | null;
      createdAt: Date;
      sender: { id: string; name: string };
    },
    viewerUserId: string,
  ) {
    return {
      id: message.id,
      body: message.body,
      senderId: message.senderId,
      senderName: message.sender.name,
      isMine: message.senderId === viewerUserId,
      readAt: message.readAt,
      createdAt: message.createdAt,
    };
  }

  private async getProductForChat(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, userId: true, status: true, title: true },
    });
    if (!product) throw new NotFoundException('آگهی یافت نشد');
    if (!product.userId) {
      throw new BadRequestException('این آگهی مالک مشخصی ندارد');
    }
    if (product.status !== 'ACTIVE') {
      throw new BadRequestException('گفتگو فقط برای آگهی‌های فعال امکان‌پذیر است');
    }
    return product;
  }

  private async assertParticipant(conversationId: string, userId: string) {
    const conversation = await this.prisma.productConversation.findUnique({
      where: { id: conversationId },
      include: conversationInclude,
    });
    if (!conversation) throw new NotFoundException('گفتگو یافت نشد');
    if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
      throw new ForbiddenException('شما به این گفتگو دسترسی ندارید');
    }
    return conversation;
  }

  async startConversation(userId: string, productId: string) {
    const normalizedProductId = productId?.trim();
    if (!normalizedProductId) {
      throw new BadRequestException('شناسه آگهی نامعتبر است');
    }

    const product = await this.getProductForChat(normalizedProductId);
    const sellerId = product.userId;
    if (!sellerId) {
      throw new BadRequestException('این آگهی مالک مشخصی ندارد');
    }
    if (sellerId === userId) {
      throw new BadRequestException('نمی‌توانید با خودتان گفتگو کنید');
    }

    await this.prisma.productConversation.upsert({
      where: { productId_buyerId: { productId: normalizedProductId, buyerId: userId } },
      create: {
        productId: normalizedProductId,
        buyerId: userId,
        sellerId,
      },
      update: {},
    });

    const conversation = await this.prisma.productConversation.findUniqueOrThrow({
      where: { productId_buyerId: { productId: normalizedProductId, buyerId: userId } },
      include: {
        ...conversationInclude,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    return this.mapConversation(conversation, userId);
  }

  async listConversations(userId: string) {
    const conversations = await this.prisma.productConversation.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        ...conversationInclude,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    const items = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await this.prisma.productChatMessage.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: userId },
            readAt: null,
          },
        });
        const mapped = this.mapConversation(conversation, userId);
        return { ...mapped, unreadCount };
      }),
    );

    return items;
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.productChatMessage.count({
      where: {
        readAt: null,
        senderId: { not: userId },
        conversation: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
        },
      },
    });
    return { count };
  }

  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.assertParticipant(conversationId, userId);

    const messages = await this.prisma.productChatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, name: true } } },
    });

    await this.prisma.productChatMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return {
      ...this.mapConversation({ ...conversation, messages: messages.slice(-1) }, userId),
      unreadCount: 0,
      messages: messages.map((m) => this.mapMessage(m, userId)),
    };
  }

  async sendMessage(conversationId: string, userId: string, dto: SendChatMessageDto) {
    await this.assertParticipant(conversationId, userId);
    const body = dto.body.trim();
    if (!body) throw new BadRequestException('متن پیام را وارد کنید');

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.productChatMessage.create({
        data: {
          conversationId,
          senderId: userId,
          body,
        },
        include: { sender: { select: { id: true, name: true } } },
      });

      await tx.productConversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: created.createdAt },
      });

      return created;
    });

    return this.mapMessage(message, userId);
  }

  async markAsRead(conversationId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);
    const result = await this.prisma.productChatMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }
}
