import { Inject, Injectable, Logger } from '@nestjs/common';
import { formatPrice, SITE_NAME_FA } from '@offroad/shared';
import { Resend } from 'resend';
import type { PaymentMethod } from '../prisma/generated/client';

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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

  return `
    <div dir="rtl" style="font-family:Tahoma,sans-serif;line-height:1.8;color:#111;max-width:640px">
      <h2 style="margin:0 0 12px">${escapeHtml(heading)}</h2>
      ${introHtml ? `<p style="margin:0 0 16px">${introHtml}</p>` : ''}
      <p style="color:#666;font-size:14px;margin:0 0 16px">شماره سفارش: <span dir="ltr">${escapeHtml(payload.orderId)}</span></p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px">
        <tr><td style="padding:4px 0;color:#666;width:140px">تاریخ</td><td>${payload.createdAt.toLocaleString('fa-IR')}</td></tr>
        <tr><td style="padding:4px 0;color:#666">مبلغ کل</td><td><strong>${formatPrice(payload.total)} تومان</strong></td></tr>
        <tr><td style="padding:4px 0;color:#666">روش پرداخت</td><td>${escapeHtml(paymentLabel)}</td></tr>
        <tr><td style="padding:4px 0;color:#666">آدرس تحویل</td><td>${escapeHtml(payload.address ?? '—')}</td></tr>
        <tr><td style="padding:4px 0;color:#666">تلفن تماس</td><td dir="ltr">${escapeHtml(payload.phone ?? '—')}</td></tr>
        <tr><td style="padding:4px 0;color:#666">یادداشت</td><td>${escapeHtml(payload.note ?? '—')}</td></tr>
      </table>
      ${formatParty('خریدار', payload.buyer)}
      ${sellers.map(([label, seller]) => formatParty(label, seller)).join('')}
      <h3 style="margin:20px 0 8px;font-size:16px">اقلام سفارش</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead>
          <tr style="background:#f5f5f5">
            <th style="padding:8px;text-align:right">محصول</th>
            <th style="padding:8px">تعداد</th>
            <th style="padding:8px">قیمت واحد</th>
            <th style="padding:8px">جمع</th>
            <th style="padding:8px;text-align:right">فروشنده</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <p style="color:#666;font-size:14px;margin-top:20px">با تشکر،<br/>تیم ${SITE_NAME_FA}</p>
    </div>
  `;
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
    const html = `
      <div dir="rtl" style="font-family:Tahoma,sans-serif;line-height:1.8;color:#111">
        <h2>به ${SITE_NAME_FA} خوش آمدید!</h2>
        <p>سلام ${name}،</p>
        <p>ثبت‌نام شما با موفقیت انجام شد. از اینکه به جمع کاربران ${SITE_NAME_FA} پیوستید خوشحالیم.</p>
        <p>اکنون می‌توانید آگهی ثبت کنید، محصولات را جستجو کنید و از امکانات فروشگاه استفاده کنید.</p>
        <p style="color:#666;font-size:14px">با تشکر،<br/>تیم ${SITE_NAME_FA}</p>
      </div>
    `;

    await this.send(to, `خوش آمدید به ${SITE_NAME_FA}`, html);
  }

  async sendVerificationCode(to: string, name: string, code: string): Promise<void> {
    const logCode = () => this.logger.warn(`Verification code for ${to}: ${code}`);

    if (!this.resend) {
      logCode();
      return;
    }

    const html = `
      <div dir="rtl" style="font-family:Tahoma,sans-serif;line-height:1.8;color:#111">
        <h2>تأیید ایمیل</h2>
        <p>سلام ${name}،</p>
        <p>برای تکمیل ثبت‌نام در ${SITE_NAME_FA}، کد زیر را در سایت وارد کنید:</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:4px;direction:ltr;text-align:center">${code}</p>
        <p style="color:#666;font-size:14px">این کد تا ۱۵ دقیقه معتبر است.</p>
      </div>
    `;

    const sent = await this.send(to, `کد تأیید ایمیل ${SITE_NAME_FA}`, html);
    if (!sent) logCode();
  }

  async sendNewPassword(to: string, name: string, password: string): Promise<void> {
    const html = `
      <div dir="rtl" style="font-family:Tahoma,sans-serif;line-height:1.8;color:#111">
        <h2>رمز عبور جدید</h2>
        <p>سلام ${name}،</p>
        <p>درخواست بازیابی رمز عبور برای حساب شما در ${SITE_NAME_FA} ثبت شد.</p>
        <p>رمز عبور جدید شما:</p>
        <p style="font-size:18px;font-weight:bold;letter-spacing:1px;direction:ltr;text-align:right">${password}</p>
        <p>پس از ورود، توصیه می‌کنیم رمز عبور را از بخش پروفایل تغییر دهید.</p>
        <p style="color:#666;font-size:14px">اگر این درخواست را شما ثبت نکرده‌اید، این ایمیل را نادیده بگیرید.</p>
      </div>
    `;

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

    const html = `
      <div dir="rtl" style="font-family:Tahoma,sans-serif;line-height:1.8;color:#111;max-width:640px">
        <h2 style="margin:0 0 12px">محصول شما با موفقیت فروخته شد</h2>
        <p>سلام ${escapeHtml(sellerName)}،</p>
        <p>یکی از آگهی‌های شما در ${SITE_NAME_FA} خریداری شد.</p>
        <p style="color:#666;font-size:14px">شماره سفارش: <span dir="ltr">${escapeHtml(orderId)}</span></p>
        <h3 style="margin:16px 0 8px;font-size:16px">اقلام فروخته‌شده</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px">
          <thead>
            <tr style="background:#f5f5f5">
              <th style="padding:8px;text-align:right">محصول</th>
              <th style="padding:8px">تعداد</th>
              <th style="padding:8px">مبلغ</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        ${formatParty('خریدار', buyer)}
        <p style="color:#666;font-size:14px;margin-top:20px">با تشکر،<br/>تیم ${SITE_NAME_FA}</p>
      </div>
    `;

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
}
