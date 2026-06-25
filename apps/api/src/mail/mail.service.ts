import { Inject, Injectable, Logger } from '@nestjs/common';
import { SITE_NAME_FA } from '@offroad/shared';
import { Resend } from 'resend';

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
}
