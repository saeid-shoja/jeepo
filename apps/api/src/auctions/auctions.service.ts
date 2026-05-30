import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { getAuctionCurrentPrice, getMinimumNextBid, isAuctionActive } from '../common/auction';
import type { PrismaService } from '../prisma/prisma.service';
import type { PlaceBidDto } from './dto';

@Injectable()
export class AuctionsService {
  constructor(private prisma: PrismaService) {}

  async getSummary(productId: string, userId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        _count: { select: { auctionBids: true } },
        auctionBids: {
          orderBy: { amount: 'desc' },
          take: 1,
          select: { amount: true, userId: true, createdAt: true },
        },
      },
    });

    if (!product?.isAuction) {
      throw new NotFoundException('مزایده یافت نشد');
    }

    const startPrice = product.auctionStartPrice ?? product.price;
    const currentPrice = getAuctionCurrentPrice(startPrice, product.auctionCurrentPrice);
    const minNextBid = getMinimumNextBid(currentPrice);
    const endsAt = product.auctionEndsAt;
    const active = endsAt != null && isAuctionActive(endsAt) && product.status === 'ACTIVE';

    let userHighestBid: number | null = null;
    let userWasOutbid = false;

    if (userId) {
      const userBid = await this.prisma.auctionBid.findFirst({
        where: { productId, userId },
        orderBy: { amount: 'desc' },
      });
      if (userBid) {
        userHighestBid = userBid.amount;
        const topBid = product.auctionBids[0];
        userWasOutbid =
          active && topBid != null && topBid.userId !== userId && userBid.amount < topBid.amount;
      }
    }

    return {
      productId: product.id,
      bidCount: product._count.auctionBids,
      currentPrice,
      startPrice,
      minNextBid,
      minIncrement: minNextBid - currentPrice,
      buyNowPrice: product.buyNowPrice,
      realPriceMin: product.realPriceMin,
      realPriceMax: product.realPriceMax,
      auctionEndsAt: endsAt,
      active,
      ended: !active,
      userHighestBid,
      userWasOutbid,
      latestBidAt: product.auctionBids[0]?.createdAt ?? null,
    };
  }

  async placeBid(productId: string, userId: string, dto: PlaceBidDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        auctionBids: {
          orderBy: { amount: 'desc' },
          take: 1,
        },
      },
    });

    if (!product?.isAuction) {
      throw new NotFoundException('مزایده یافت نشد');
    }

    if (product.status !== 'ACTIVE') {
      throw new BadRequestException('این مزایده فعال نیست');
    }

    if (!product.auctionEndsAt || !isAuctionActive(product.auctionEndsAt)) {
      throw new BadRequestException('مزایده به پایان رسیده است');
    }

    const startPrice = product.auctionStartPrice ?? product.price;
    const currentPrice = getAuctionCurrentPrice(startPrice, product.auctionCurrentPrice);
    const minNextBid = getMinimumNextBid(currentPrice);

    if (dto.amount < minNextBid) {
      throw new BadRequestException(
        `حداقل پیشنهاد ${minNextBid.toLocaleString('fa-IR')} تومان است`,
      );
    }

    const previousTop = product.auctionBids[0];
    const outbidUserId = previousTop && previousTop.userId !== userId ? previousTop.userId : null;

    const bid = await this.prisma.$transaction(async (tx) => {
      const created = await tx.auctionBid.create({
        data: {
          productId,
          userId,
          amount: dto.amount,
          bidderName: dto.bidderName,
          bidderPhone: dto.bidderPhone,
          bidderAddress: dto.bidderAddress,
          bidderCity: dto.bidderCity,
        },
      });

      await tx.product.update({
        where: { id: productId },
        data: {
          auctionCurrentPrice: dto.amount,
          price: dto.amount,
        },
      });

      return created;
    });

    const bidCount = await this.prisma.auctionBid.count({ where: { productId } });

    return {
      bid: {
        id: bid.id,
        amount: bid.amount,
        createdAt: bid.createdAt,
      },
      currentPrice: dto.amount,
      minNextBid: getMinimumNextBid(dto.amount),
      bidCount,
      outbidUserId,
      message: 'پیشنهاد شما با موفقیت ثبت شد',
    };
  }

  async finalizeEndedAuctions() {
    const now = new Date();
    const ended = await this.prisma.product.findMany({
      where: {
        isAuction: true,
        status: 'ACTIVE',
        auctionEndsAt: { lte: now },
      },
    });

    for (const product of ended) {
      await this.prisma.product.update({
        where: { id: product.id },
        data: { status: 'INACTIVE' },
      });
    }

    return ended.length;
  }
}
