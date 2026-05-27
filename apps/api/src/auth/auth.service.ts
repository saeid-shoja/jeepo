import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    @Inject('JWT_SECRET') private jwtSecret: string,
  ) {}

  async register(data: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { phone: data.phone } });
    if (existing) {
      throw new ConflictException('این شماره موبایل قبلاً ثبت نام کرده است');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await this.prisma.user.create({
      data: {
        phone: data.phone,
        name: data.name,
        password: hashedPassword,
        city: data.city,
      },
    });

    const token = this.jwtService.sign({ sub: user.id, role: user.role });

    return {
      token,
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role, city: user.city },
    };
  }

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: data.phone } });
    if (!user) {
      throw new UnauthorizedException('شماره موبایل یا رمز عبور اشتباه است');
    }

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('شماره موبایل یا رمز عبور اشتباه است');
    }

    const token = this.jwtService.sign({ sub: user.id, role: user.role });

    return {
      token,
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role, city: user.city },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, name: true, role: true, city: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('کاربر یافت نشد');
    return user;
  }
}
