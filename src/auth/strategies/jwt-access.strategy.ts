import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { AuthUser } from 'src/auth/types/auth-user.type';
import { PrismaService } from 'src/prisma/prisma.service';

function cookieExtractorAccess(req: Request): string | null {
  return req?.cookies?.accessToken ?? null;
}

type JwtAccessPayload = {
  sub: string;
  email: string;
  tokenVersion: number;
};

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractorAccess]),
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET')!,
    });
  }

  async validate(payload: JwtAccessPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
      select: {
        role: true,
        email: true,
        username: true,
        name: true,
        tokenVersion: true,
        isBanned: true,
        isDeleted: true,
      },
    });

    if (!user || user.isDeleted) {
      throw new UnauthorizedException();
    }

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Token expired');
    }

    if (user.isBanned) {
      throw new ForbiddenException({
        code: 'USER_BANNED',
      });
    }

    return {
      id: payload.sub,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
    };
  }
}
