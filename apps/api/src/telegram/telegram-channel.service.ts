import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  formatDiscountPercent,
  formatPrice,
  formatProductLocationWithProvince,
  resolveProductDiscount,
  SITE_URL,
} from '@offroad/shared';
import { PrismaService } from '../prisma/prisma.service';
import { escapeTelegramHtml, TelegramService } from './telegram.service';
import type { TelegramChannelTopics, TelegramProductAnnouncementKind } from './telegram-channels';

@Injectable()
export class TelegramChannelService {
  private readonly logger = new Logger(TelegramChannelService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
    @Inject('TELEGRAM_CHANNEL_CHAT_ID') private readonly channelChatId: string,
    @Inject('TELEGRAM_CHANNEL_TOPICS') private readonly topics: TelegramChannelTopics,
    @Inject('WEB_URL') private readonly webUrl: string,
  ) {}

  isChannelConfigured(): boolean {
    return this.telegram.isConfigured() && Boolean(this.channelChatId);
  }

  /** Mirror in-app announcements and automated notifications to the news topic. */
  announceNews(title: string, body: string): void {
    if (!this.isChannelConfigured()) return;
    const text = `<b>${escapeTelegramHtml(title)}</b>\n\n${escapeTelegramHtml(body)}`;
    void this.telegram
      .sendMessageToTopic(this.channelChatId, this.topics.NEWS, text)
      .catch((err) => this.logger.warn(`News topic post failed: ${err}`));
  }

  announceStrengthened(productId: string): void {
    void this.postProduct(productId, 'STRENGTHENED').catch((err) =>
      this.logger.warn(`Strengthened announcement failed: ${err}`),
    );
  }

  announceBoost(productId: string): void {
    void this.postProduct(productId, 'BOOST').catch((err) =>
      this.logger.warn(`Boost announcement failed: ${err}`),
    );
  }

  /** Admin-curated «قیمت مناسب» posts to the BEST_PRICE topic. */
  async announceBestPrice(productId: string): Promise<void> {
    await this.postProduct(productId, 'BEST_PRICE');
  }

  /** Post when a listing becomes ACTIVE (shop, auction, or guarantee). */
  announceProductActive(productId: string): void {
    void this.postProductActive(productId).catch((err) =>
      this.logger.warn(`Product active announcement failed: ${err}`),
    );
  }

  private async postProductActive(productId: string): Promise<void> {
    if (!this.isChannelConfigured()) return;

    const product = await this.loadProduct(productId);
    if (!product || product.status !== 'ACTIVE') return;

    if (product.isAuction) {
      await this.postProduct(productId, 'AUCTION');
      return;
    }
    if (product.hasGuarantee) {
      await this.postProduct(productId, 'GUARANTEE');
      return;
    }
    if (product.advertiser === 'SHOP') {
      await this.postProduct(productId, 'SHOP');
    }
  }

  private async postProduct(
    productId: string,
    kind: TelegramProductAnnouncementKind,
  ): Promise<void> {
    if (!this.isChannelConfigured()) return;

    const product = await this.loadProduct(productId);
    if (!product) return;

    const threadId = topicForKind(kind, this.topics);
    const caption = this.buildCaption(product, kind);
    const firstImage = this.firstImage(product.images);
    const withPhoto = (kind === 'GUARANTEE' || kind === 'BEST_PRICE') && firstImage;

    if (withPhoto && firstImage) {
      await this.telegram.sendPhotoToTopic(this.channelChatId, threadId, firstImage, caption);
      return;
    }

    await this.telegram.sendMessageToTopic(this.channelChatId, threadId, caption, {
      disableWebPagePreview: false,
    });
  }

  private async loadProduct(productId: string) {
    return this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        title: true,
        price: true,
        salePrice: true,
        images: true,
        status: true,
        advertiser: true,
        hasGuarantee: true,
        isAuction: true,
        isBoosted: true,
        auctionStartPrice: true,
        city: true,
        neighborhood: true,
      },
    });
  }

  private buildCaption(
    product: {
      id: string;
      title: string;
      price: number;
      salePrice?: number | null;
      isAuction: boolean;
      auctionStartPrice: number | null;
      city: string | null;
      neighborhood: string | null;
      hasGuarantee: boolean;
      isBoosted: boolean;
    },
    kind?: TelegramProductAnnouncementKind,
  ): string {
    const url = this.buildProductPublicUrl(product.id);
    const listPrice =
      product.isAuction && product.auctionStartPrice != null
        ? product.auctionStartPrice
        : product.price;
    const discount = resolveProductDiscount(listPrice, product.salePrice);
    const location = formatProductLocationWithProvince(product.city, product.neighborhood);
    const lines = [`<b>${escapeTelegramHtml(product.title)}</b>`];

    if (discount.hasDiscount) {
      lines.push(
        `💰 <s>${escapeTelegramHtml(formatPrice(discount.originalPrice))}</s> <b>${escapeTelegramHtml(formatPrice(discount.effectivePrice))}</b> (${escapeTelegramHtml(formatDiscountPercent(discount.discountPercent!))} تخفیف)`,
      );
    } else {
      lines.push(`💰 ${escapeTelegramHtml(formatPrice(listPrice))}`);
    }

    if (kind !== 'SHOP' && location) lines.push(`📍 ${escapeTelegramHtml(location)}`);
    if (kind === 'BEST_PRICE') lines.push('🏷 قیمت مناسب');
    if (product.hasGuarantee) lines.push('🛡 تضمین جیپو');
    if (product.isBoosted) lines.push('📈 پله‌شده');
    lines.push(`🔗 <a href="${url}">مشاهده آگهی در جیپو</a>`);
    lines.push(url);
    return lines.join('\n');
  }

  /** Telegram does not linkify localhost — always use public URL in channel posts. */
  private buildProductPublicUrl(productId: string): string {
    const base = this.webUrl.replace(/\/$/, '');
    const publicBase = /localhost|127\.0\.0\.1/i.test(base) ? SITE_URL.replace(/\/$/, '') : base;
    return `${publicBase}/product/${productId}`;
  }

  private firstImage(imagesJson: string): string | null {
    try {
      const images = JSON.parse(imagesJson) as string[];
      return images[0] ?? null;
    } catch {
      return null;
    }
  }
}

function topicForKind(
  kind: TelegramProductAnnouncementKind,
  topics: TelegramChannelTopics,
): number {
  switch (kind) {
    case 'SHOP':
      return topics.SHOP;
    case 'GUARANTEE':
      return topics.GUARANTEE;
    case 'BEST_PRICE':
      return topics.BEST_PRICE;
    case 'AUCTION':
      return topics.AUCTION;
    case 'STRENGTHENED':
      return topics.STRENGTHENED;
    case 'BOOST':
      return topics.BOOST;
  }
}
