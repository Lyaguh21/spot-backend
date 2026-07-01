import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import type { StringValue } from 'ms';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { EmailService } from 'src/email/email.service';
import { ResendEmailCodeDto } from './dto/resend-verification-code.dto';

type AuthStatusUser = {
  id: string;
  email: string;
  username: string;
  name: string;
  role: string;
  isEmailVerified: boolean;
  coupleId: string | null;
  partner: {
    id: string;
    username: string;
    name: string;
    avatarUrl: string | null;
    role: string;
  } | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  private getAccessSecret() {
    return this.config.get<string>('JWT_ACCESS_SECRET', { infer: true })!;
  }

  private getRefreshSecret() {
    return this.config.get<string>('JWT_REFRESH_SECRET', { infer: true })!;
  }

  private getAccessExpires() {
    return (this.config.get('JWT_ACCESS_EXPIRES') ?? '15m') as StringValue;
  }

  private getRefreshExpires() {
    return (this.config.get('JWT_REFRESH_EXPIRES') ?? '7d') as StringValue;
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const username = dto.username.trim();
    const name = dto.name.trim();

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        name,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        isEmailVerified: true,
        tokenVersion: true,
      },
    });

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await this.prisma.emailVerificationCode.create({
      data: {
          userId: user.id,
          code,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await this.email.sendVerificationCode(user.email, code);

    const tokens = await this.issueTokens(
      user.id,
      user.email,
      user.tokenVersion,
    );

    await this.setRefreshTokenHash(
      user.id,
      tokens.refreshToken,
    );

    const safeUser = { 
      id: user.id, 
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      isEmailVerified: user.isEmailVerified
    };

    return {
      user: safeUser,
      ...tokens,
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        tokenVersion: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const verificationCode = await this.prisma.emailVerificationCode.findFirst({
      where: {
        userId: user.id,
        code: dto.code,
        expiresAt: { gt: new Date() },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verificationCode) {
      throw new BadRequestException('Invalid code');
    }

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        isEmailVerified: true,
      },
    });

    await this.prisma.emailVerificationCode.deleteMany({
      where: {
        userId: user.id,
      },
    });

    return {
      message: 'Email verified successfully',
    };
  }

  async resendVerificationCode(dto: ResendEmailCodeDto) {
    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const lastCode = await this.prisma.emailVerificationCode.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (lastCode) {
      const now = Date.now();
      const diff = now - new Date(lastCode.createdAt).getTime();

      if (diff < 60 * 1000) {
        throw new BadRequestException(
          'Wait 60 seconds before requesting a new code',
        );
      }
    }

    await this.prisma.emailVerificationCode.deleteMany({
      where: { userId: user.id }
    })

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await this.prisma.emailVerificationCode.create({
      data: {
        userId: user.id,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    })

    await this.email.sendVerificationCode(user.email, code);

    return {message: 'Code resend'};
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        isEmailVerified: true,
        isDeleted: true,
        passwordHash: true,
        tokenVersion: true,
      },
    });

    if (!user) throw new BadRequestException('Пользователь не найден');

    if (user.isDeleted) {
      throw new ForbiddenException('Пользователь удалён');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new BadRequestException('Неверный пароль');

    const safeUser = { 
      id: user.id, 
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      isEmailVerified: user.isEmailVerified
    };

    const tokens = await this.issueTokens(user.id, user.email, user.tokenVersion);
    await this.setRefreshTokenHash(user.id, tokens.refreshToken);

    return { user: safeUser, ...tokens };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: null, tokenVersion: { increment: 1 } },
    });

    return { ok: true };
  }

  async getStatus(userId: string): Promise<AuthStatusUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        isEmailVerified: true,
        coupleMembers: {
          select: {
            coupleId: true,
            couple: {
              select: {
                members: {
                  select: {
                    user: {
                      select: {
                        id: true,
                        username: true,
                        name: true,
                        avatarUrl: true,
                        role: true,
                        isEmailVerified: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const couple = user.coupleMembers[0]?.couple;

    const partner = couple?.members
      .map(member => member.user)
      .find(partner => partner.id !== user.id) ?? null;

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      coupleId: user.coupleMembers[0]?.coupleId ?? null,
      partner
    };
  }

  async refreshTokens(userId: string, refreshTokenFromCookie: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        hashedRefreshToken: true,
        tokenVersion: true,
      },
    });

    if (!user || !user.hashedRefreshToken)
      throw new ForbiddenException('Access Denied');

    const matches = await bcrypt.compare(
      refreshTokenFromCookie,
      user.hashedRefreshToken,
    );
    if (!matches) throw new ForbiddenException('Access Denied');

    const tokens = await this.issueTokens(user.id, user.email, user.tokenVersion);

    await this.setRefreshTokenHash(user.id, tokens.refreshToken);

    return {
      user: { id: user.id, email: user.email },
      ...tokens,
    };
  }

  private async setRefreshTokenHash(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: hash },
    });
  }

  private async issueTokens(
    userId: string,
    email: string,
    tokenVersion: number,
  ) {
    const payload = { sub: userId, email, tokenVersion };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.getAccessSecret(),
        expiresIn: this.getAccessExpires(),
      }),
      this.jwt.signAsync(
        { sub: userId, email },
        {
          secret: this.getRefreshSecret(),
          expiresIn: this.getRefreshExpires(),
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }
}
