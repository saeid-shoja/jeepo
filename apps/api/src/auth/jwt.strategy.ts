import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject('JWT_SECRET') secret: string,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: { sub: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        role: true,
        isSuperAdmin: true,
        adminPermissions: true,
        adminAccessConfigured: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return {
      userId: user.id,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      adminPermissions: user.adminPermissions,
      adminAccessConfigured: user.adminAccessConfigured,
    };
  }
}
