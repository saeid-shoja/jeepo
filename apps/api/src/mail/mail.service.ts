import { Inject, Injectable, Logger } from '@nestjs/common';
import { formatPrice, SITE_EMAIL, SITE_NAME_FA } from '@offroad/shared';
import { Resend } from 'resend';
import type { PaymentMethod } from '../prisma/generated/client';
import {
  buildEmailLayout,
  emailButton,
  emailCodeBox,
  emailGreeting,
  emailHighlightBox,
  emailInfoBox,
  escapeHtml,
} from './mail-layout';

type OrderParty = {
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
};

export type OrderEmailLine = {
  title: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  sellerLabel: string;
  seller: OrderParty;
};

export type OrderEmailPayload = {
  orderId: string;
  createdAt: Date;
  total: number;
  paymentMethod: PaymentMethod | null;
  address: string | null;
  phone: string | null;
  note: string | null;
  buyer: OrderParty;
  items: OrderEmailLine[];
};

const PAYMENT_LABELS: Record<string, string> = {
  ONLINE: 'پرداخت آنلاین',
};

function formatParty(label: string, party: OrderParty): string {
  return `
    <h3 style="margin:16px 0 8px;font-size:16px">${escapeHtml(label)}</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:4px 0;color:#666;width:120px">نام</td><td>${escapeHtml(party.name)}</td></tr>
      <tr><td style="padding:4px 0;color:#666">موبایل</td><td dir="ltr">${escapeHtml(party.phone ?? '—')}</td></tr>
      <tr><td style="padding:4px 0;color:#666">ایمیل</td><td dir="ltr">${escapeHtml(party.email ?? '—')}</td></tr>
      <tr><td style="padding:4px 0;color:#666">شهر</td><td>${escapeHtml(party.city ?? '—')}</td></tr>
    </table>
  `;
}

function buildOrderEmailHtml(
  payload: OrderEmailPayload,
  heading: string,
  introHtml?: string,
): string {
  const paymentLabel = payload.paymentMethod
    ? (PAYMENT_LABELS[payload.paymentMethod] ?? 'نامشخص')
    : 'نامشخص';

  const itemRows = payload.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(item.title)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;white-space:nowrap">${formatPrice(item.unitPrice)} تومان</td>
          <td style="padding:8px;border-bottom:1px solid #eee;white-space:nowrap">${formatPrice(item.lineTotal)} تومان</td>
          <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(item.sellerLabel)}<br/><span style="color:#666;font-size:12px">${escapeHtml(item.seller.name)} · ${escapeHtml(item.seller.phone ?? '—')}</span></td>
        </tr>
      `,
    )
    .join('');

  const sellers = [
    ...new Map(payload.items.map((item) => [item.sellerLabel, item.seller])).entries(),
  ];

  const bodyHtml = `
    ${introHtml ? `<p style="margin:0 0 16px;">${introHtml}</p>` : ''}
    <p style="color:#64748b;font-size:14px;margin:0 0 16px;">شماره سفارش: <span dir="ltr" style="color:#1e3a5f;font-weight:bold;">${escapeHtml(payload.orderId)}</span></p>
    ${emailInfoBox(`
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#64748b;width:140px;">تاریخ</td><td>${payload.createdAt.toLocaleString('fa-IR')}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">مبلغ کل</td><td><strong style="color:#d62828;">${formatPrice(payload.total)} تومان</strong></td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">روش پرداخت</td><td>${escapeHtml(paymentLabel)}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">آدرس تحویل</td><td>${escapeHtml(payload.address ?? '—')}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">تلفن تماس</td><td dir="ltr">${escapeHtml(payload.phone ?? '—')}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">یادداشت</td><td>${escapeHtml(payload.note ?? '—')}</td></tr>
      </table>
    `)}
    ${formatParty('خریدار', payload.buyer)}
    ${sellers.map(([label, seller]) => formatParty(label, seller)).join('')}
    <h3 style="margin:20px 0 10px;font-size:16px;color:#1e3a5f;">اقلام سفارش</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#f1f5f9;">
          <th style="padding:10px;text-align:right;color:#475569;">محصول</th>
          <th style="padding:10px;color:#475569;">تعداد</th>
          <th style="padding:10px;color:#475569;">قیمت واحد</th>
          <th style="padding:10px;color:#475569;">جمع</th>
          <th style="padding:10px;text-align:right;color:#475569;">فروشنده</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
  `;

  return buildEmailLayout({ title: heading, bodyHtml });
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;

  constructor(
    @Inject('RESEND_API_KEY') private readonly apiKey: string,
    @Inject('MAIL_FROM') private readonly from: string,
  ) {
    this.resend = this.apiKey ? new Resend(this.apiKey) : null;
  }

  private async send(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.resend) {
      this.logger.warn(`Mail skipped (RESEND_API_KEY missing). To: ${to}, subject: ${subject}`);
      return false;
    }

    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject,
      html,
    });

    if (error) {
      this.logger.error(`Resend error: ${error.message}`);
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(`Dev fallback: email not sent. To: ${to}, subject: ${subject}`);
        return false;
      }
      throw new Error('ارسال ایمیل با خطا مواجه شد');
    }

    return true;
  }

  async sendWelcome(to: string, name: string): Promise<void> {
    const bodyHtml = `
      ${emailGreeting(name)}
      <p style="margin:0 0 12px;">ثبت‌نام شما با موفقیت انجام شد. از اینکه به جمع کاربران ${escapeHtml(SITE_NAME_FA)} پیوستید خوشحالیم.</p>
      <p style="margin:0;">اکنون می‌توانید آگهی ثبت کنید، محصولات را جستجو کنید و از امکانات فروشگاه استفاده کنید.</p>
    `;
    const html = buildEmailLayout({
      title: `به ${SITE_NAME_FA} خوش آمدید!`,
      previewText: 'ثبت‌نام شما با موفقیت انجام شد',
      bodyHtml,
    });
    await this.send(to, `خوش آمدید به ${SITE_NAME_FA}`, html);
  }

  async sendVerificationCode(to: string, name: string, code: string): Promise<void> {
    const logCode = () => this.logger.warn(`Verification code for ${to}: ${code}`);

    if (!this.resend) {
      logCode();
      return;
    }

    const bodyHtml = `
      ${emailGreeting(name)}
      <p style="margin:0 0 8px;">برای تکمیل ثبت‌نام در ${escapeHtml(SITE_NAME_FA)}، کد زیر را در سایت وارد کنید:</p>
      ${emailCodeBox('کد تأیید ایمیل', code)}
    `;
    const html = buildEmailLayout({
      title: 'تأیید ایمیل',
      previewText: 'کد تأیید ثبت‌نام',
      bodyHtml,
    });

    const sent = await this.send(to, `کد تأیید ایمیل ${SITE_NAME_FA}`, html);
    if (!sent) logCode();
  }

  async sendLoginCode(to: string, name: string, code: string): Promise<void> {
    const logCode = () => this.logger.warn(`Login code for ${to}: ${code}`);

    if (!this.resend) {
      logCode();
      return;
    }

    const bodyHtml = `
      ${emailGreeting(name)}
      <p style="margin:0 0 8px;">برای ورود به حساب ${escapeHtml(SITE_NAME_FA)}، کد زیر را وارد کنید:</p>
      ${emailCodeBox('کد ورود', code)}
      <p style="margin:0;font-size:13px;color:#94a3b8;">اگر این درخواست را شما ثبت نکرده‌اید، این ایمیل را نادیده بگیرید.</p>
    `;
    const html = buildEmailLayout({
      title: 'ورود به حساب',
      previewText: 'کد ورود یک‌بار مصرف',
      bodyHtml,
    });

    const sent = await this.send(to, `کد ورود ${SITE_NAME_FA}`, html);
    if (!sent) logCode();
  }

  async sendNewPassword(to: string, name: string, password: string): Promise<void> {
    const RTL_TEXT = 'direction:rtl;text-align:right';
    const bodyHtml = `
      ${emailGreeting(name)}
      <p style="margin:0 0 12px;">درخواست بازیابی رمز عبور برای حساب شما در ${escapeHtml(SITE_NAME_FA)} ثبت شد.</p>
      ${emailHighlightBox(`<div style="display:inline-block;background:linear-gradient(135deg,#fef2f2 0%,#fff7ed 100%);border:2px dashed #d62828;border-radius:14px;padding:22px 28px;min-width:200px;text-align:center;"><p style="margin:0;font-size:34px;font-weight:bold;color:#d62828;letter-spacing:8px;direction:ltr;text-align:center;font-family:'Courier New',monospace;${RTL_TEXT}"><strong>رمز عبور جدید:</strong><br/><span dir="ltr" style="font-size:20px;font-weight:bold;font-family:monospace;">${escapeHtml(password)}</span></p></div>`)}
      <p style="margin:0;">پس از ورود، توصیه می‌کنیم رمز عبور را از بخش پروفایل تغییر دهید.</p>
      <p style="margin:12px 0 0;font-size:13px;color:#94a3b8;">اگر این درخواست را شما ثبت نکرده‌اید، این ایمیل را نادیده بگیرید.</p>
    `;
    const html = buildEmailLayout({
      title: 'رمز عبور جدید',
      previewText: 'بازیابی رمز عبور',
      bodyHtml,
    });
    await this.send(to, `رمز عبور جدید ${SITE_NAME_FA}`, html);
  }

  async sendOrderPlaced(to: string, payload: OrderEmailPayload, audience: string): Promise<void> {
    const subject = `سفارش جدید ${SITE_NAME_FA} — ${payload.orderId.slice(-8)}`;
    const html = buildOrderEmailHtml(payload, `سفارش جدید (${audience})`);
    await this.send(to, subject, html);
  }

  async sendBuyerPurchaseSuccess(
    to: string,
    name: string,
    payload: OrderEmailPayload,
  ): Promise<void> {
    const subject = `خرید موفق — سفارش ${payload.orderId.slice(-8)} | ${SITE_NAME_FA}`;
    const html = buildOrderEmailHtml(
      payload,
      'خرید شما با موفقیت ثبت شد',
      `سلام ${escapeHtml(name)}، سفارش شما در ${SITE_NAME_FA} با موفقیت ثبت شد.`,
    );
    await this.send(to, subject, html);
  }

  async sendSellerProductSold(
    to: string,
    sellerName: string,
    orderId: string,
    items: OrderEmailLine[],
    buyer: OrderParty,
  ): Promise<void> {
    const itemRows = items
      .map(
        (item) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(item.title)}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;white-space:nowrap">${formatPrice(item.lineTotal)} تومان</td>
          </tr>
        `,
      )
      .join('');

    const html = buildEmailLayout({
      title: 'محصول شما با موفقیت فروخته شد',
      bodyHtml: `
        ${emailGreeting(sellerName)}
        <p style="margin:0 0 12px;">یکی از آگهی‌های شما در ${escapeHtml(SITE_NAME_FA)} خریداری شد.</p>
        <p style="color:#64748b;font-size:14px;margin:0 0 16px;">شماره سفارش: <span dir="ltr">${escapeHtml(orderId)}</span></p>
        <h3 style="margin:16px 0 10px;font-size:16px;color:#1e3a5f;">اقلام فروخته‌شده</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;border:1px solid #e2e8f0;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="padding:10px;text-align:right;">محصول</th>
              <th style="padding:10px;">تعداد</th>
              <th style="padding:10px;">مبلغ</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        ${formatParty('خریدار', buyer)}
      `,
    });

    await this.send(to, `فروش موفق — سفارش ${orderId.slice(-8)} | ${SITE_NAME_FA}`, html);
  }

  async sendOrderPlacedToMany(
    recipients: Array<{ email: string; audience: string }>,
    payload: OrderEmailPayload,
  ): Promise<void> {
    const unique = new Map<string, string>();
    for (const recipient of recipients) {
      if (recipient.email) unique.set(recipient.email.toLowerCase(), recipient.audience);
    }

    await Promise.all(
      [...unique.entries()].map(([email, audience]) =>
        this.sendOrderPlaced(email, payload, audience).catch((err) => {
          this.logger.warn(`Order email to ${email} failed: ${String(err)}`);
        }),
      ),
    );
  }

  async sendBuyerOrderStatusUpdate(
    to: string,
    name: string,
    payload: OrderEmailPayload,
    copy: { subjectSuffix: string; heading: string; body: string },
  ): Promise<void> {
    const subject = `${copy.subjectSuffix} — سفارش ${payload.orderId.slice(-8)} | ${SITE_NAME_FA}`;
    const html = buildOrderEmailHtml(
      payload,
      copy.heading,
      `سلام ${escapeHtml(name)}، ${escapeHtml(copy.body)}`,
    );
    await this.send(to, subject, html);
  }

  async sendAdminOrdersDigest(
    to: string,
    orders: Array<{
      id: string;
      status: string;
      statusLabel: string;
      total: number;
      buyerName: string;
      createdAt: Date;
      statusChangedAt: Date;
      itemCount: number;
    }>,
  ): Promise<void> {
    if (orders.length === 0) return;

    const rows = orders
      .map(
        (o) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;font-family:monospace;direction:ltr">${escapeHtml(o.id.slice(-8))}</td>
          <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(o.buyerName)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(o.statusLabel)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee">${o.itemCount.toLocaleString('fa-IR')}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;white-space:nowrap">${formatPrice(o.total)} تومان</td>
          <td style="padding:8px;border-bottom:1px solid #eee">${o.statusChangedAt.toLocaleString('fa-IR')}</td>
        </tr>
      `,
      )
      .join('');

    const html = buildEmailLayout({
      title: 'یادآوری سفارش‌های نیازمند بررسی',
      bodyHtml: `
        <p style="margin:0 0 12px;">در پایان روز، ${orders.length.toLocaleString('fa-IR')} سفارش هنوز نیازمند اقدام ادمین است.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #e2e8f0;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="padding:8px;text-align:right;">کد</th>
              <th style="padding:8px;text-align:right;">خریدار</th>
              <th style="padding:8px;text-align:right;">وضعیت</th>
              <th style="padding:8px;text-align:right;">اقلام</th>
              <th style="padding:8px;text-align:right;">مبلغ</th>
              <th style="padding:8px;text-align:right;">آخرین تغییر</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin:16px 0 0;font-size:13px;color:#64748b;">لطفاً از پنل ادمین → سفارشات، وضعیت این سفارش‌ها را به‌روز کنید.</p>
      `,
    });

    await this.send(
      to,
      `یادآوری ${orders.length.toLocaleString('fa-IR')} سفارش باز | ${SITE_NAME_FA}`,
      html,
    );
  }

  async sendListingApproved(
    to: string,
    name: string,
    title: string,
    productUrl: string,
  ): Promise<void> {
    const html = buildEmailLayout({
      title: 'آگهی شما تأیید شد',
      bodyHtml: `
        ${emailGreeting(name)}
        <p style="margin:0 0 12px;">آگهی «<strong>${escapeHtml(title)}</strong>» پس از بررسی توسط تیم ${escapeHtml(SITE_NAME_FA)} تأیید و در سایت منتشر شد.</p>
        ${emailButton('مشاهده آگهی', productUrl)}
        <p style="margin:0;font-size:13px;color:#94a3b8;">لینک: <a href="${escapeHtml(productUrl)}" style="color:#d62828;">${escapeHtml(productUrl)}</a></p>
      `,
    });

    await this.send(to, `آگهی شما منتشر شد — ${SITE_NAME_FA}`, html);
  }

  async sendGuaranteeListingPending(payload: {
    product: {
      id: string;
      title: string;
      description: string;
      price: number;
      newPrice?: number | null;
      city: string | null;
      neighborhood?: string | null;
      categoryName: string | null;
      phone?: string | null;
      situation?: string | null;
      stockQuantity?: number;
      url: string;
    };
    seller: {
      id: string;
      name: string;
      phone: string;
      email: string | null;
      city: string | null;
    };
  }): Promise<void> {
    const html = buildEmailLayout({
      title: 'آگهی با تضمین فروشگاه — در انتظار تأیید',
      bodyHtml: `
        <p style="margin:0 0 16px;">یک آگهی با گزینه «تضمین فروشگاه» ثبت شده و تا تأیید ادمین در فروشگاه نمایش داده نمی‌شود.</p>
        <h3 style="margin:16px 0 10px;font-size:16px;color:#1e3a5f;">اطلاعات آگهی</h3>
        ${emailInfoBox(`
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:6px 0;color:#64748b;width:140px;">عنوان</td><td>${escapeHtml(payload.product.title)}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">شناسه</td><td dir="ltr">${escapeHtml(payload.product.id)}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">دسته</td><td>${escapeHtml(payload.product.categoryName ?? '—')}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">قیمت</td><td>${formatPrice(payload.product.price)} تومان</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">قیمت نو</td><td>${payload.product.newPrice != null ? `${formatPrice(payload.product.newPrice)} تومان` : '—'}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">وضعیت کالا</td><td>${escapeHtml(payload.product.situation ?? '—')}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">موجودی</td><td>${payload.product.stockQuantity ?? 1}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">شهر / محله</td><td>${escapeHtml([payload.product.city, payload.product.neighborhood].filter(Boolean).join(' — ') || '—')}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">تلفن آگهی</td><td dir="ltr">${escapeHtml(payload.product.phone ?? '—')}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">لینک</td><td><a href="${escapeHtml(payload.product.url)}" style="color:#d62828;">${escapeHtml(payload.product.url)}</a></td></tr>
          </table>
        `)}
        <h3 style="margin:16px 0 10px;font-size:16px;color:#1e3a5f;">توضیحات</h3>
        <p style="margin:0 0 16px;white-space:pre-wrap;">${escapeHtml(payload.product.description)}</p>
        ${formatParty('فروشنده', {
          name: payload.seller.name,
          phone: payload.seller.phone,
          email: payload.seller.email,
          city: payload.seller.city,
        })}
        <p style="margin:0;font-size:13px;color:#94a3b8;">زمان: ${new Date().toLocaleString('fa-IR')}</p>
      `,
    });

    await this.send(
      SITE_EMAIL,
      `تضمین فروشگاه — تأیید آگهی: ${payload.product.title.slice(0, 40)}`,
      html,
    );
  }

  async sendProductReport(payload: {
    reportTitle: string;
    reportDescription: string;
    product: {
      id: string;
      title: string;
      price: number;
      city: string | null;
      advertiser: string;
      categoryName: string | null;
      url: string;
    };
    advertiser: {
      id: string;
      name: string;
      phone: string;
      email: string | null;
      city: string | null;
      telegramId: string | null;
    } | null;
    reporter: {
      id: string;
      name: string;
      phone: string;
      email: string | null;
    };
  }): Promise<void> {
    const advertiserLabel =
      payload.product.advertiser === 'SHOP' ? 'فروشگاه جیپو' : 'کاربر (آگهی شخصی)';

    const html = buildEmailLayout({
      title: `گزارش تخلف آگهی — ${escapeHtml(SITE_NAME_FA)}`,
      bodyHtml: `
        <h3 style="margin:0 0 8px;font-size:16px;color:#1e3a5f;">عنوان گزارش</h3>
        <p style="margin:0 0 16px;">${escapeHtml(payload.reportTitle)}</p>
        <h3 style="margin:0 0 8px;font-size:16px;color:#1e3a5f;">توضیحات گزارش</h3>
        <p style="margin:0 0 16px;white-space:pre-wrap;">${escapeHtml(payload.reportDescription)}</p>
        <h3 style="margin:0 0 10px;font-size:16px;color:#1e3a5f;">اطلاعات آگهی</h3>
        ${emailInfoBox(`
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:6px 0;color:#64748b;width:140px;">عنوان</td><td>${escapeHtml(payload.product.title)}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">شناسه</td><td dir="ltr">${escapeHtml(payload.product.id)}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">دسته</td><td>${escapeHtml(payload.product.categoryName ?? '—')}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">قیمت</td><td>${formatPrice(payload.product.price)} تومان</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">شهر</td><td>${escapeHtml(payload.product.city ?? '—')}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">نوع آگهی</td><td>${escapeHtml(advertiserLabel)}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">لینک</td><td><a href="${escapeHtml(payload.product.url)}" style="color:#d62828;">${escapeHtml(payload.product.url)}</a></td></tr>
          </table>
        `)}
        ${
          payload.advertiser
            ? formatParty('آگهی‌دهنده', {
                name: payload.advertiser.name,
                phone: payload.advertiser.phone,
                email: payload.advertiser.email,
                city: payload.advertiser.city,
              }) +
              (
                payload.advertiser.telegramId
                  ? `<p style="font-size:14px;">تلگرام: @${escapeHtml(payload.advertiser.telegramId)}</p>`
                  : ''
              )
            : ''
        }
        ${formatParty('گزارش‌دهنده', {
          name: payload.reporter.name,
          phone: payload.reporter.phone,
          email: payload.reporter.email,
          city: null,
        })}
        <p style="margin:0;font-size:13px;color:#94a3b8;">زمان: ${new Date().toLocaleString('fa-IR')}</p>
      `,
    });

    await this.send(
      SITE_EMAIL,
      `گزارش آگهی: ${payload.reportTitle} — ${payload.product.title.slice(0, 40)}`,
      html,
    );
  }
}
