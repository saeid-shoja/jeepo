import { randomBytes, randomInt } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResendVerificationDto,
  VerifyEmailDto,
} from './dto';

const FORGOT_PASSWORD_MESSAGE =
  'اگر ایمیل شما در سیستم ثبت شده باشد، رمز عبور جدید به آن ارسال می‌شود';

const VERIFICATION_TTL_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

function generateRandomPassword(length = 10): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join('');
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isPhoneIdentifier(value: string): boolean {
  return /^09\d{9}$/.test(value.trim());
}

function isEmailIdentifier(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

function generateVerificationCode(): string {
  return String(randomInt(100_000, 1_000_000));
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    @Inject('JWT_SECRET') _jwtSecret: string,
  ) {}

  private buildAuthResponse(user: {
    id: string;
    phone: string;
    email: string | null;
    name: string;
    role: string;
    city: string | null;
  }) {
    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    return {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        role: user.role,
        city: user.city,
      },
    };
  }

  private async assertRegistrationAvailable(
    tx: Pick<PrismaService, 'user' | 'pendingRegistration'>,
    phone: string,
    email: string,
  ) {
    const [existingPhone, existingEmail] = await Promise.all([
      tx.user.findUnique({ where: { phone } }),
      tx.user.findUnique({ where: { email } }),
    ]);

    if (existingPhone) {
      throw new ConflictException('این شماره موبایل قبلاً ثبت نام کرده است');
    }
    if (existingEmail) {
      throw new ConflictException('این ایمیل قبلاً ثبت شده است');
    }

    const [pendingPhone, pendingEmail] = await Promise.all([
      tx.pendingRegistration.findUnique({ where: { phone } }),
      tx.pendingRegistration.findUnique({ where: { email } }),
    ]);

    if (pendingPhone && pendingPhone.email !== email) {
      throw new ConflictException('این شماره موبایل در حال ثبت‌نام است');
    }
    if (pendingEmail && pendingEmail.phone !== phone) {
      throw new ConflictException('این ایمیل در حال ثبت‌نام است');
    }
  }

  private async sendPendingVerificationCode(pending: { email: string; name: string }) {
    const code = generateVerificationCode();
    const hashedCode = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
    const now = new Date();

    await this.prisma.pendingRegistration.update({
      where: { email: pending.email },
      data: {
        verificationCode: hashedCode,
        verificationExpiresAt: expiresAt,
        lastCodeSentAt: now,
      },
    });

    await this.mailService.sendVerificationCode(pending.email, pending.name, code);
  }

  async register(data: RegisterDto) {
    const phone = data.phone;
    const email = data.email;
    const name = data.name;
    const city = data.city;

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const code = generateVerificationCode();
    const hashedCode = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await this.assertRegistrationAvailable(tx, phone, email);

      await tx.pendingRegistration.deleteMany({
        where: { OR: [{ phone }, { email }] },
      });

      await tx.pendingRegistration.create({
        data: {
          phone,
          email,
          name,
          password: hashedPassword,
          city,
          verificationCode: hashedCode,
          verificationExpiresAt: expiresAt,
          lastCodeSentAt: now,
        },
      });
    });

    try {
      await this.mailService.sendVerificationCode(email, name, code);
    } catch {
      await this.prisma.pendingRegistration.deleteMany({ where: { email } }).catch(() => {
        /* pending may already be gone */
      });
      throw new BadRequestException('ارسال کد تأیید به ایمیل با خطا مواجه شد. دوباره تلاش کنید');
    }

    return {
      requiresVerification: true,
      email,
      maskedEmail: maskEmail(email),
      message: 'کد تأیید به ایمیل شما ارسال شد',
    };
  }

  async verifyEmail(data: VerifyEmailDto) {
    const email = normalizeEmail(data.email);
    const pending = await this.prisma.pendingRegistration.findUnique({ where: { email } });

    if (!pending) {
      const existingUser = await this.prisma.user.findUnique({ where: { email } });
      if (existingUser?.emailVerified) {
        return this.buildAuthResponse(existingUser);
      }
      throw new BadRequestException('ثبت‌نام یافت نشد. لطفاً دوباره فرم ثبت‌نام را تکمیل کنید');
    }

    if (pending.verificationExpiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('کد تأیید منقضی شده است. درخواست ارسال مجدد کنید');
    }

    const valid = await bcrypt.compare(data.code, pending.verificationCode);
    if (!valid) {
      throw new BadRequestException('کد تأیید اشتباه است');
    }

    const user = await this.prisma.$transaction(async (tx) => {
      await this.assertRegistrationAvailable(tx, pending.phone, pending.email);

      const created = await tx.user.create({
        data: {
          phone: pending.phone,
          email: pending.email,
          name: pending.name,
          password: pending.password,
          city: pending.city,
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

      await tx.pendingRegistration.delete({ where: { id: pending.id } });
      return created;
    });

    await this.mailService.sendWelcome(user.email!, user.name).catch(() => {
      /* welcome email is optional */
    });

    return this.buildAuthResponse(user);
  }

  async resendVerification(data: ResendVerificationDto) {
    const email = normalizeEmail(data.email);
    const pending = await this.prisma.pendingRegistration.findUnique({ where: { email } });

    if (!pending) {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (user?.emailVerified) {
        return { message: 'این ایمیل قبلاً تأیید شده است' };
      }
      return { message: 'اگر ثبت‌نامی با این ایمیل وجود داشته باشد، کد تأیید ارسال می‌شود' };
    }

    if (pending.lastCodeSentAt.getTime() + RESEND_COOLDOWN_MS > Date.now()) {
      throw new BadRequestException('لطفاً یک دقیقه صبر کنید و دوباره درخواست دهید');
    }

    try {
      await this.sendPendingVerificationCode(pending);
    } catch {
      throw new BadRequestException('ارسال کد تأیید با خطا مواجه شد');
    }

    return {
      message: 'کد تأیید جدید به ایمیل شما ارسال شد',
      maskedEmail: maskEmail(pending.email),
    };
  }

  async login(data: LoginDto) {
    const identifier = data.identifier.trim();
    const password = data.password;

    if (!identifier) {
      throw new BadRequestException('شماره موبایل یا ایمیل را وارد کنید');
    }
    if (!password) {
      throw new BadRequestException('رمز عبور را وارد کنید');
    }
    if (password.length < 6) {
      throw new BadRequestException('رمز عبور باید حداقل ۶ کاراکتر باشد');
    }

    let user = null;
    if (isPhoneIdentifier(identifier)) {
      user = await this.prisma.user.findUnique({ where: { phone: identifier } });
    } else if (isEmailIdentifier(identifier)) {
      user = await this.prisma.user.findUnique({ where: { email: normalizeEmail(identifier) } });
    } else {
      throw new BadRequestException('شماره موبایل یا ایمیل معتبر نیست');
    }

    if (!user) {
      throw new UnauthorizedException('اطلاعات ورود اشتباه است');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('اطلاعات ورود اشتباه است');
    }

    if (!user.emailVerified) {
      throw new ForbiddenException(
        'ایمیل شما هنوز تأیید نشده است. کد ارسال‌شده به ایمیل را وارد کنید',
      );
    }

    return this.buildAuthResponse(user);
  }

  async forgotPassword(data: ForgotPasswordDto) {
    const email = data.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user?.email) {
      const newPassword = generateRandomPassword();

      try {
        await this.mailService.sendNewPassword(user.email, user.name, newPassword);
      } catch {
        return { message: FORGOT_PASSWORD_MESSAGE };
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
    }

    return { message: FORGOT_PASSWORD_MESSAGE };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        role: true,
        city: true,
        emailVerified: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('کاربر یافت نشد');
    return user;
  }
}
