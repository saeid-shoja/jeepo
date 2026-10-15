import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  canTransitionOrderStatus,
  getOrderStatusEmailCopy,
  getOrderStatusLabel,
  getProductColorLabel,
  isProductColorId,
  ORDER_NEEDS_ATTENTION_STATUSES,
  type OrderStatusCode,
  parseProductColorIds,
  productRequiresColorChoice,
  SITE_EMAIL,
  SITE_NAME_FA,
  SITE_TELEGRAM_SUPPORT,
} from "@offroad/shared";
import {
  getProductSalePrice,
  isPurchasableProduct,
} from "../common/purchasable";
import type { OrderEmailPayload } from "../mail/mail.service";
import { MailService } from "../mail/mail.service";
import type { OrderStatus, PaymentMethod } from "../prisma/generated/client";
import { PrismaService } from "../prisma/prisma.service";
import type {
  CreateOrderDto,
  OrderItemDto,
  PreviewOrderDto,
  SubmitPackagingEvidenceDto,
  SubmitShippingEvidenceDto,
} from "./dto";

type ResolvedLine = {
  productId: string;
  quantity: number;
  price: number;
  title: string;
  image: string | null;
  color: string | null;
};

const orderInclude = {
  user: {
    select: { id: true, name: true, phone: true, email: true, city: true },
  },
  items: {
    include: {
      product: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              city: true,
            },
          },
          category: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  },
} as const;

const ORDER_ADMIN_EMAIL = SITE_EMAIL;
const GUARANTEE_SELLER_RESPONSE_MS = 7 * 24 * 60 * 60 * 1000;
const GUARANTEE_BUYER_REVIEW_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_VIDEO_BYTES = 1024 * 1024;
const MAX_PROOF_IMAGE_BYTES = 100 * 1024;

/** Remove sold client listings (تضمین جیپو) and auctions from public lists. */
function shouldDeactivateSoldListing(product: {
  advertiser: string;
  hasGuarantee: boolean;
  isAuction: boolean;
  stockQuantity: number;
}): boolean {
  if (product.advertiser !== "CLIENT") return false;
  if (product.stockQuantity > 0) return false;
  return product.hasGuarantee || product.isAuction;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  private async resolveItems(
    items: OrderItemDto[],
    buyerId: string,
  ): Promise<ResolvedLine[]> {
    if (!items.length) {
      throw new BadRequestException("سبد خرید خالی است");
    }

    const merged = new Map<string, OrderItemDto>();
    for (const item of items) {
      const key = `${item.productId}::${item.color ?? ""}`;
      const prev = merged.get(key);
      if (prev) {
        prev.quantity += item.quantity;
      } else {
        merged.set(key, { ...item });
      }
    }
    const normalized = [...merged.values()];

    const productIds = [...new Set(normalized.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException("برخی محصولات یافت نشدند");
    }

    const byId = new Map(products.map((p) => [p.id, p]));
    const qtyByProduct = new Map<string, number>();
    for (const item of normalized) {
      qtyByProduct.set(
        item.productId,
        (qtyByProduct.get(item.productId) ?? 0) + item.quantity,
      );
    }

    const lines: ResolvedLine[] = [];

    for (const item of normalized) {
      const product = byId.get(item.productId);
      if (!product) {
        throw new BadRequestException("محصول یافت نشد");
      }
      if (!isPurchasableProduct(product)) {
        throw new BadRequestException(
          `محصول «${product.title}» قابل خرید آنلاین نیست`,
        );
      }
      if (
        buyerId &&
        product.userId === buyerId &&
        (product.hasGuarantee || product.advertiser === "SHOP")
      ) {
        throw new BadRequestException("نمی‌توانید آگهی خود را خریداری کنید");
      }

      const available = product.stockQuantity ?? 1;
      const totalRequested = qtyByProduct.get(product.id) ?? item.quantity;
      if (totalRequested > available) {
        throw new BadRequestException(
          `موجودی «${product.title}» کافی نیست (حداکثر ${available} عدد)`,
        );
      }
      if (item.quantity < 1) {
        throw new BadRequestException("تعداد باید حداقل ۱ باشد");
      }

      const availableColors = parseProductColorIds(product.color);
      let color: string | null = item.color ?? null;
      if (productRequiresColorChoice(product) && !color) {
        throw new BadRequestException(`رنگ «${product.title}» را انتخاب کنید`);
      }
      if (color) {
        if (!isProductColorId(color) || !availableColors.includes(color)) {
          throw new BadRequestException(
            `رنگ انتخاب‌شده برای «${product.title}» موجود نیست`,
          );
        }
      } else {
        color = null;
      }

      const images: string[] = JSON.parse(product.images || "[]");
      lines.push({
        productId: product.id,
        quantity: item.quantity,
        price: getProductSalePrice(product),
        title: product.title,
        image: images[0] ?? null,
        color,
      });
    }

    return lines;
  }

  async preview(data: PreviewOrderDto) {
    const lines = await this.resolveItems(data.items, "");
    const subtotal = lines.reduce(
      (sum, line) => sum + line.price * line.quantity,
      0,
    );

    return {
      items: lines.map((line) => ({
        productId: line.productId,
        title: line.title,
        image: line.image,
        quantity: line.quantity,
        unitPrice: line.price,
        lineTotal: line.price * line.quantity,
        color: line.color,
        colorLabel: line.color ? getProductColorLabel(line.color) : null,
      })),
      subtotal,
      total: subtotal,
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    };
  }

  async findAll() {
    return this.prisma.order.findMany({
      where: {
        items: {
          none: { product: { advertiser: "CLIENT", hasGuarantee: true } },
        },
      },
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  async findAllGuaranteed() {
    return this.prisma.order.findMany({
      where: {
        items: {
          some: { product: { advertiser: "CLIENT", hasGuarantee: true } },
        },
      },
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findSellerOrders(sellerId: string) {
    return this.prisma.order.findMany({
      where: {
        paidAt: { not: null },
        items: {
          some: {
            guaranteeStatus: { not: null },
            product: {
              userId: sellerId,
              advertiser: "CLIENT",
              hasGuarantee: true,
            },
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            city: true,
          },
        },
        items: {
          where: {
            guaranteeStatus: { not: null },
            product: {
              userId: sellerId,
              advertiser: "CLIENT",
              hasGuarantee: true,
            },
          },
          include: {
            product: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                    city: true,
                  },
                },
                category: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  private async getGuaranteedItem(orderId: string, itemId: string) {
    const item = await this.prisma.orderItem.findFirst({
      where: { id: itemId, orderId },
      include: {
        product: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                city: true,
              },
            },
            category: { select: { id: true, name: true, slug: true } },
          },
        },
        order: { include: orderInclude },
      },
    });
    if (!item) throw new NotFoundException("قلم سفارش یافت نشد");
    if (item.product.advertiser !== "CLIENT" || !item.product.hasGuarantee) {
      throw new BadRequestException("این کالا مشمول تضمین جیپو نیست");
    }
    return item;
  }

  private async getSellerGuaranteedItem(
    orderId: string,
    itemId: string,
    sellerId: string,
  ) {
    const item = await this.getGuaranteedItem(orderId, itemId);
    if (!item.guaranteeStatus) {
      throw new BadRequestException("این کالا هنوز وارد فرایند تضمین نشده است");
    }
    if (item.product.userId !== sellerId) {
      throw new ForbiddenException("شما فروشنده این کالا نیستید");
    }
    return item;
  }

  private dataUrlByteLength(value: string, kind: "video" | "image"): number {
    const comma = value.indexOf(",");
    const header = comma >= 0 ? value.slice(0, comma) : "";
    const payload = comma >= 0 ? value.slice(comma + 1) : "";
    const prefix = kind === "video" ? "data:video/" : "data:image/";
    if (!header.startsWith(prefix) || !header.endsWith(";base64") || !payload) {
      throw new BadRequestException(
        kind === "video" ? "فایل ویدیو معتبر نیست" : "فایل عکس معتبر نیست",
      );
    }
    return Buffer.from(payload, "base64").byteLength;
  }

  private async updateGuaranteedItem(
    orderId: string,
    itemId: string,
    from: string,
    to: string,
    extra: {
      packagingVideo?: string;
      packagingImages?: string[];
      shippingReceipt?: string;
      shippedAt?: Date;
    } = {},
  ) {
    const updated = await this.prisma.orderItem.updateMany({
      where: { id: itemId, orderId, guaranteeStatus: from as never },
      data: {
        guaranteeStatus: to as never,
        guaranteeStatusChangedAt: new Date(),
        ...extra,
      },
    });
    if (!updated.count)
      throw new ConflictException("وضعیت این کالا قبلاً تغییر کرده است");
    return this.getGuaranteedItem(orderId, itemId);
  }

  private notifyGuaranteedBuyer(
    item: Awaited<ReturnType<OrdersService["getGuaranteedItem"]>>,
    copy: { subjectSuffix: string; heading: string; body: string },
  ) {
    const email = item.order.user.email;
    if (!email) return;
    const payload = this.buildOrderEmailPayload(item.order);
    void this.mailService
      .sendBuyerOrderStatusUpdate(email, item.order.user.name, payload, copy)
      .catch((err) =>
        this.logger.warn(`Guaranteed order email failed: ${String(err)}`),
      );
  }

  private async notifyGuaranteedAdmins(
    item: Awaited<ReturnType<OrdersService["getGuaranteedItem"]>>,
    status: string,
    details: string,
  ) {
    const emails = await this.listAdminNotificationEmails();
    await Promise.all(
      emails.map((email) =>
        this.mailService
          .sendGuaranteedOrderAdminAlert(email, {
            orderId: item.orderId,
            itemId: item.id,
            buyerId: item.order.user.id,
            buyerName: item.order.user.name,
            sellerId: item.product.userId ?? "—",
            sellerName: item.product.user?.name ?? "—",
            productTitle: item.product.title,
            quantity: item.quantity,
            total: item.price * item.quantity,
            status,
            details,
          })
          .catch((err) =>
            this.logger.warn(
              `Guaranteed order admin email failed: ${String(err)}`,
            ),
          ),
      ),
    );
  }

  async sellerConfirmItem(orderId: string, itemId: string, sellerId: string) {
    const item = await this.getSellerGuaranteedItem(orderId, itemId, sellerId);
    if (item.guaranteeStatus !== "WAITING_SELLER_CONFIRMATION") {
      throw new BadRequestException("این سفارش در انتظار تأیید فروشنده نیست");
    }
    const updated = await this.updateGuaranteedItem(
      orderId,
      itemId,
      "WAITING_SELLER_CONFIRMATION",
      "PACKAGING",
    );
    this.notifyGuaranteedBuyer(updated, {
      subjectSuffix: "سفارش تأیید شد",
      heading: "سفارش شما دریافت و تأیید شد",
      body: "فروشنده سفارش را دریافت کرده و در حال بسته‌بندی آن است.",
    });
    return updated;
  }

  async submitPackagingEvidence(
    orderId: string,
    itemId: string,
    sellerId: string,
    evidence: SubmitPackagingEvidenceDto,
  ) {
    const item = await this.getSellerGuaranteedItem(orderId, itemId, sellerId);
    if (item.guaranteeStatus !== "PACKAGING") {
      throw new BadRequestException("این سفارش در مرحله بسته‌بندی نیست");
    }
    if (evidence.videoDurationSeconds > 15) {
      throw new BadRequestException("مدت ویدیو نباید بیشتر از ۱۵ ثانیه باشد");
    }
    if (this.dataUrlByteLength(evidence.video, "video") > MAX_VIDEO_BYTES) {
      throw new BadRequestException("حجم ویدیو نباید بیشتر از ۱ مگابایت باشد");
    }
    if (evidence.images.length < 1 || evidence.images.length > 5) {
      throw new BadRequestException("از ۱ تا ۵ عکس بسته‌بندی بارگذاری کنید");
    }
    for (const image of evidence.images) {
      if (this.dataUrlByteLength(image, "image") > MAX_PROOF_IMAGE_BYTES) {
        throw new BadRequestException(
          "حجم هر عکس نباید بیشتر از ۱۰۰ کیلوبایت باشد",
        );
      }
    }

    const updated = await this.updateGuaranteedItem(
      orderId,
      itemId,
      "PACKAGING",
      "READY_TO_SHIP",
      {
        packagingVideo: evidence.video,
        packagingImages: evidence.images,
      },
    );
    this.notifyGuaranteedBuyer(updated, {
      subjectSuffix: "بسته‌بندی تکمیل شد",
      heading: "سفارش آماده ارسال است",
      body: "فروشنده بسته‌بندی سفارش را تکمیل کرده و آن را برای ارسال آماده می‌کند.",
    });
    return updated;
  }

  async sellerMarkShipped(
    orderId: string,
    itemId: string,
    sellerId: string,
    evidence: SubmitShippingEvidenceDto,
  ) {
    const item = await this.getSellerGuaranteedItem(orderId, itemId, sellerId);
    if (item.guaranteeStatus !== "READY_TO_SHIP") {
      throw new BadRequestException("ابتدا بسته‌بندی سفارش را تکمیل کنید");
    }
    if (
      this.dataUrlByteLength(evidence.receipt, "image") > MAX_PROOF_IMAGE_BYTES
    ) {
      throw new BadRequestException(
        "حجم تصویر بارنامه نباید بیشتر از ۱۰۰ کیلوبایت باشد",
      );
    }
    const now = new Date();
    const updated = await this.updateGuaranteedItem(
      orderId,
      itemId,
      "READY_TO_SHIP",
      "SHIPPED",
      {
        shippingReceipt: evidence.receipt,
        shippedAt: now,
      },
    );
    this.notifyGuaranteedBuyer(updated, {
      subjectSuffix: "سفارش ارسال شد",
      heading: "سفارش شما ارسال شد",
      body: "فروشنده سفارش را ارسال کرده است. پس از دریافت، تأیید یا گزارش مشکل تا ۷ روز در پنل شما فعال است.",
    });
    return updated;
  }

  private async getBuyerGuaranteedItem(
    orderId: string,
    itemId: string,
    buyerId: string,
  ) {
    const item = await this.getGuaranteedItem(orderId, itemId);
    if (item.order.userId !== buyerId) {
      throw new ForbiddenException("این سفارش متعلق به شما نیست");
    }
    return item;
  }

  async buyerCancelItem(orderId: string, itemId: string, buyerId: string) {
    const item = await this.getBuyerGuaranteedItem(orderId, itemId, buyerId);
    const paidAt = item.order.paidAt ?? item.order.createdAt;
    if (
      item.guaranteeStatus !== "WAITING_SELLER_CONFIRMATION" ||
      Date.now() < paidAt.getTime() + GUARANTEE_SELLER_RESPONSE_MS
    ) {
      throw new BadRequestException(
        "لغو سفارش پس از ۷ روز عدم تأیید فروشنده فعال می‌شود",
      );
    }
    const updated = await this.updateGuaranteedItem(
      orderId,
      itemId,
      "WAITING_SELLER_CONFIRMATION",
      "REFUND_PENDING",
    );
    const copy = {
      subjectSuffix: "خرید لغو شد",
      heading: "خرید شما با موفقیت لغو شد",
      body: "خرید شما با موفقیت لغو شد و هزینه کالا به زودی به حساب شما برگشت داده می‌شود.",
    };
    this.notifyGuaranteedBuyer(updated, copy);
    void this.notifyGuaranteedAdmins(
      updated,
      "در انتظار بازپرداخت",
      "خریدار پس از ۷ روز عدم تأیید فروشنده سفارش را لغو کرد.",
    );
    return updated;
  }

  private assertBuyerReviewWindow(
    item: Awaited<ReturnType<OrdersService["getGuaranteedItem"]>>,
  ) {
    if (
      item.guaranteeStatus !== "SHIPPED" ||
      !item.shippedAt ||
      Date.now() > item.shippedAt.getTime() + GUARANTEE_BUYER_REVIEW_MS
    ) {
      throw new BadRequestException(
        "مهلت ۷ روزه بررسی سفارش پایان یافته یا کالا هنوز ارسال نشده است",
      );
    }
  }

  async buyerConfirmItem(orderId: string, itemId: string, buyerId: string) {
    const item = await this.getBuyerGuaranteedItem(orderId, itemId, buyerId);
    this.assertBuyerReviewWindow(item);
    const updated = await this.updateGuaranteedItem(
      orderId,
      itemId,
      "SHIPPED",
      "BUYER_CONFIRMED",
    );
    this.notifyGuaranteedBuyer(updated, {
      subjectSuffix: "دریافت کالا تأیید شد",
      heading: "شما محصول خود را با موفقیت و با تضمین جیپو دریافت کردید",
      body: "شما محصول خود را با موفقیت و با تضمین جیپو دریافت کردید و هزینه محصول پس از بررسی ادمین به فروشنده واریز خواهد شد.",
    });
    void this.notifyGuaranteedAdmins(
      updated,
      "نیازمند تأیید واریز",
      "خریدار دریافت صحیح کالا را تأیید کرد.",
    );
    return updated;
  }

  async buyerReportItem(orderId: string, itemId: string, buyerId: string) {
    const item = await this.getBuyerGuaranteedItem(orderId, itemId, buyerId);
    this.assertBuyerReviewWindow(item);
    const updated = await this.updateGuaranteedItem(
      orderId,
      itemId,
      "SHIPPED",
      "UNDER_REVIEW",
    );
    this.notifyGuaranteedBuyer(updated, {
      subjectSuffix: "گزارش سفارش ثبت شد",
      heading: "گزارش تخلف در ارسال کالا",
      body: "برای پیگیری مشکل، ویدیوی کالا و توضیحات خود را برای پشتیبانی جیپو در تلگرام ارسال کنید.",
    });
    void this.notifyGuaranteedAdmins(
      updated,
      "در حال بررسی",
      "خریدار گزارش مشکل در ارسال را ثبت کرد.",
    );
    const supportUsername = SITE_TELEGRAM_SUPPORT.replace(/^@/, "");
    return {
      ...updated,
      supportUrl: `https://t.me/${supportUsername}?text=${encodeURIComponent(`گزارش سفارش ${orderId}، قلم ${itemId}`)}`,
    };
  }

  async adminResolveItem(
    orderId: string,
    itemId: string,
    action: "PAY_SELLER" | "APPROVE_CANCEL" | "MARK_REFUNDED" | "UNDER_REVIEW",
  ) {
    const item = await this.getGuaranteedItem(orderId, itemId);
    if (!item.guaranteeStatus) {
      throw new BadRequestException("این کالا هنوز وارد فرایند تضمین نشده است");
    }
    let next: string;
    if (action === "PAY_SELLER") {
      if (item.guaranteeStatus !== "BUYER_CONFIRMED") {
        throw new BadRequestException(
          "پرداخت به فروشنده فقط پس از تأیید دریافت خریدار ممکن است",
        );
      }
      next = "PAID_TO_SELLER";
    } else if (action === "APPROVE_CANCEL") {
      if (
        !["REFUND_PENDING", "UNDER_REVIEW"].includes(item.guaranteeStatus ?? "")
      ) {
        throw new BadRequestException(
          "این سفارش در انتظار تأیید لغو یا بررسی نیست",
        );
      }
      next = "CANCELLED";
    } else if (action === "MARK_REFUNDED") {
      if (item.guaranteeStatus !== "CANCELLED") {
        throw new BadRequestException("ابتدا لغو سفارش را تأیید کنید");
      }
      next = "REFUNDED";
    } else {
      if (
        ["PAID_TO_SELLER", "REFUNDED", "CANCELLED"].includes(
          item.guaranteeStatus ?? "",
        )
      ) {
        throw new BadRequestException("وضعیت نهایی سفارش قابل بررسی مجدد نیست");
      }
      next = "UNDER_REVIEW";
    }
    const updated = await this.updateGuaranteedItem(
      orderId,
      itemId,
      item.guaranteeStatus ?? "",
      next,
    );
    const copy =
      action === "PAY_SELLER"
        ? {
            subjectSuffix: "پرداخت فروشنده تأیید شد",
            heading: "تأیید نهایی سفارش",
            body: "ادمین پرداخت مبلغ کالا به فروشنده را تأیید کرد.",
          }
        : action === "APPROVE_CANCEL"
          ? {
              subjectSuffix: "لغو سفارش تأیید شد",
              heading: "لغو خرید تأیید شد",
              body: "لغو خرید شما تأیید شد و بازگشت وجه به‌زودی انجام می‌شود.",
            }
          : action === "MARK_REFUNDED"
            ? {
                subjectSuffix: "بازپرداخت انجام شد",
                heading: "بازپرداخت سفارش انجام شد",
                body: "وجه سفارش به شما بازگردانده شد.",
              }
            : {
                subjectSuffix: "سفارش در حال بررسی",
                heading: "سفارش شما در حال بررسی است",
                body: "ادمین جیپو در حال بررسی گزارش این سفارش است.",
              };
    this.notifyGuaranteedBuyer(updated, copy);
    return updated;
  }

  async findOne(id: string, userId: string, userRole: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });

    if (!order) {
      throw new NotFoundException("سفارش یافت نشد");
    }

    if (userRole !== "ADMIN" && order.userId !== userId) {
      throw new ForbiddenException("شما اجازه مشاهده این سفارش را ندارید");
    }

    return order;
  }

  private sellerLabel(product: {
    advertiser: string;
    user: { name: string } | null;
  }): string {
    if (product.advertiser === "SHOP") return `فروشگاه ${SITE_NAME_FA}`;
    return product.user?.name ? `فروشنده: ${product.user.name}` : "فروشنده";
  }

  private buildOrderEmailPayload(order: {
    id: string;
    createdAt: Date;
    total: number;
    paymentMethod: PaymentMethod | null;
    address: string | null;
    phone: string | null;
    note: string | null;
    user: {
      name: string;
      phone: string | null;
      email: string | null;
      city: string | null;
    };
    items: Array<{
      quantity: number;
      price: number;
      product: {
        title: string;
        advertiser: string;
        user: {
          name: string;
          phone: string | null;
          email: string | null;
          city: string | null;
        } | null;
      };
    }>;
  }): OrderEmailPayload {
    return {
      orderId: order.id,
      createdAt: order.createdAt,
      total: order.total,
      paymentMethod: order.paymentMethod,
      address: order.address,
      phone: order.phone,
      note: order.note,
      buyer: {
        name: order.user.name,
        phone: order.user.phone,
        email: order.user.email,
        city: order.user.city,
      },
      items: order.items.map((item) => {
        const seller =
          item.product.advertiser === "SHOP" || !item.product.user
            ? {
                name: `فروشگاه ${SITE_NAME_FA}`,
                phone: null,
                email: null,
                city: null,
              }
            : {
                name: item.product.user.name,
                phone: item.product.user.phone,
                email: item.product.user.email,
                city: item.product.user.city,
              };

        return {
          title: item.product.title,
          quantity: item.quantity,
          unitPrice: item.price,
          lineTotal: item.price * item.quantity,
          sellerLabel: this.sellerLabel(item.product),
          seller,
        };
      }),
    };
  }

  private async notifyOrderPlaced(order: {
    id: string;
    createdAt: Date;
    total: number;
    paymentMethod: PaymentMethod | null;
    address: string | null;
    phone: string | null;
    note: string | null;
    user: {
      name: string;
      phone: string;
      email: string | null;
      city: string | null;
    };
    items: Array<{
      quantity: number;
      price: number;
      product: {
        title: string;
        advertiser: string;
        user: {
          name: string;
          phone: string;
          email: string | null;
          city: string | null;
        } | null;
      };
    }>;
  }) {
    const payload = this.buildOrderEmailPayload(order);

    const mailTasks: Promise<void>[] = [];

    if (order.user.email) {
      mailTasks.push(
        this.mailService
          .sendBuyerPurchaseSuccess(order.user.email, order.user.name, payload)
          .catch((err) => {
            this.logger.warn(`Buyer email failed: ${String(err)}`);
          }),
      );
    }

    const sellerItems = new Map<
      string,
      { name: string; items: typeof payload.items; buyer: typeof payload.buyer }
    >();
    for (let i = 0; i < order.items.length; i++) {
      const item = order.items[i];
      const line = payload.items[i];
      const email = item.product.user?.email?.toLowerCase();
      if (!email || !line) continue;

      const existing = sellerItems.get(email);
      if (existing) {
        existing.items.push(line);
      } else {
        sellerItems.set(email, {
          name: item.product.user!.name,
          items: [line],
          buyer: payload.buyer,
        });
      }
    }

    for (const [email, seller] of sellerItems) {
      mailTasks.push(
        this.mailService
          .sendSellerProductSold(
            email,
            seller.name,
            payload.orderId,
            seller.items,
            seller.buyer,
          )
          .catch((err) => {
            this.logger.warn(`Seller email to ${email} failed: ${String(err)}`);
          }),
      );
    }

    mailTasks.push(
      this.mailService
        .sendOrderPlaced(ORDER_ADMIN_EMAIL, payload, "مدیر")
        .catch((err) => {
          this.logger.warn(`Admin order email failed: ${String(err)}`);
        }),
    );

    await Promise.all(mailTasks);
  }

  async create(userId: string, data: CreateOrderDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("کاربر یافت نشد");

    const lines = await this.resolveItems(data.items, userId);
    const total = lines.reduce(
      (sum, line) => sum + line.price * line.quantity,
      0,
    );

    const order = await this.prisma.order.create({
      data: {
        userId,
        total,
        status: "PENDING",
        address: data.address,
        phone: data.phone ?? user.phone,
        note: data.note,
        paymentMethod: data.paymentMethod,
        items: {
          create: lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            price: line.price,
            color: line.color,
          })),
        },
      },
      include: orderInclude,
    });

    return order;
  }

  /**
   * Re-read catalog prices for a pending order before charging the gateway.
   * Ensures Zibal amount always matches current DB prices, not stale cart/client values.
   */
  async refreshPendingOrderPricing(
    orderId: string,
    userId: string,
  ): Promise<number> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new NotFoundException("سفارش یافت نشد");
    if (order.userId !== userId) {
      throw new ForbiddenException("دسترسی به این سفارش مجاز نیست");
    }
    if (order.status !== "PENDING") {
      throw new BadRequestException("این سفارش دیگر در انتظار پرداخت نیست");
    }

    const lines = await this.resolveItems(
      order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        color: item.color ?? undefined,
      })),
      userId,
    );
    const total = lines.reduce(
      (sum, line) => sum + line.price * line.quantity,
      0,
    );
    const lineByKey = new Map(
      lines.map((line) => [`${line.productId}::${line.color ?? ""}`, line]),
    );

    await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const line = lineByKey.get(`${item.productId}::${item.color ?? ""}`);
        if (!line) {
          throw new BadRequestException(
            "برخی اقلام سفارش دیگر قابل خرید نیستند",
          );
        }
        await tx.orderItem.update({
          where: { id: item.id },
          data: {
            price: line.price,
            quantity: line.quantity,
            color: line.color,
          },
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: { total },
      });
    });

    return total;
  }

  async fulfillAfterPayment(
    orderId: string,
    payment: { trackId: string; refNumber: string | null; paidAt: Date },
  ) {
    const existing = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!existing) throw new NotFoundException("سفارش یافت نشد");
    if (existing.status !== "PENDING") {
      return this.prisma.order.findUnique({
        where: { id: orderId },
        include: orderInclude,
      });
    }

    const order = await this.prisma.$transaction(async (tx) => {
      for (const item of existing.items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new BadRequestException("موجودی یکی از محصولات کافی نیست");
        }

        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: {
            advertiser: true,
            hasGuarantee: true,
            isAuction: true,
            stockQuantity: true,
          },
        });
        if (product && shouldDeactivateSoldListing(product)) {
          await tx.product.update({
            where: { id: item.productId },
            data: { status: "DEPRECATED", deprecatedAt: new Date() },
          });
        }
        await tx.orderItem.update({
          where: { id: item.id },
          data: {
            guaranteeStatus: product?.hasGuarantee
              ? "WAITING_SELLER_CONFIRMATION"
              : null,
            guaranteeStatusChangedAt: product?.hasGuarantee
              ? payment.paidAt
              : null,
          },
        });
      }

      return tx.order.update({
        where: { id: orderId },
        data: {
          status: "CONFIRMED",
          paymentTrackId: payment.trackId,
          paymentRefNumber: payment.refNumber,
          paidAt: payment.paidAt,
          statusChangedAt: payment.paidAt,
        },
        include: orderInclude,
      });
    });

    void this.notifyOrderPlaced(order);

    return order;
  }

  async updateStatus(id: string, status: OrderStatus) {
    const existing = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!existing) throw new NotFoundException("سفارش یافت نشد");

    if (
      existing.items.some(
        (item) =>
          item.product.advertiser === "CLIENT" && item.product.hasGuarantee,
      )
    ) {
      throw new BadRequestException(
        "وضعیت کالاهای تضمینی باید از مسیر جداگانه هر قلم تغییر کند",
      );
    }

    if (existing.status === status) {
      return existing;
    }

    if (!canTransitionOrderStatus(existing.status, status)) {
      throw new BadRequestException(
        `تغییر وضعیت از «${getOrderStatusLabel(existing.status)}» به «${getOrderStatusLabel(status)}» مجاز نیست`,
      );
    }

    const now = new Date();
    const updated = await this.prisma.order.update({
      where: { id },
      data: { status, statusChangedAt: now },
      include: orderInclude,
    });

    void this.notifyBuyerStatusChange(updated, status as OrderStatusCode);

    return updated;
  }

  /** Orders still needing admin follow-up (for daily digest). */
  async findOrdersNeedingAttention() {
    return this.prisma.order.findMany({
      where: {
        status: { in: [...ORDER_NEEDS_ATTENTION_STATUSES] as OrderStatus[] },
      },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: { select: { id: true } },
      },
      orderBy: [{ statusChangedAt: "asc" }, { createdAt: "asc" }],
    });
  }

  async listAdminNotificationEmails(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: { role: "ADMIN", email: { not: null } },
      select: { email: true },
    });
    const emails = new Set<string>();
    emails.add(ORDER_ADMIN_EMAIL.toLowerCase());
    for (const admin of admins) {
      if (admin.email) emails.add(admin.email.toLowerCase());
    }
    return [...emails];
  }

  private async notifyBuyerStatusChange(
    order: Parameters<OrdersService["buildOrderEmailPayload"]>[0],
    status: OrderStatusCode,
  ) {
    const buyerEmail = order.user.email;
    if (!buyerEmail) {
      this.logger.warn(
        `Order ${order.id}: buyer has no email — skip status mail`,
      );
      return;
    }

    const payload = this.buildOrderEmailPayload(order);
    const copy = getOrderStatusEmailCopy(status);
    await this.mailService
      .sendBuyerOrderStatusUpdate(buyerEmail, order.user.name, payload, copy)
      .catch((err) => {
        this.logger.warn(
          `Buyer status email failed for ${order.id}: ${String(err)}`,
        );
      });
  }
}
