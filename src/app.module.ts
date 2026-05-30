import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import Joi from 'joi';
import { JwtAccessGuard } from './auth/guards/jwt-access.guard';
import { UsersModule } from './users/users.module';

import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { VisitsModule } from './visits/visits.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().port().default(3000),
        DATABASE_URL: Joi.string().required(),
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 10,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    VisitsModule,
  ],
  providers: [
    {
      provide: 'APP_GUARD',
      useClass: JwtAccessGuard,
    },
    {
      provide: 'APP_GUARD',
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
