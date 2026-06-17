import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { AuthUser, AuthUserWithRefresh } from 'src/auth/types/auth-user.type';

export const CurrentUser = createParamDecorator(
  (
    data: keyof AuthUser | keyof AuthUserWithRefresh | 'sub' | undefined,
    ctx: ExecutionContext,
  ): AuthUser | AuthUserWithRefresh | string | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const user = req.user as unknown as
      | AuthUser
      | AuthUserWithRefresh
      | undefined;

    if (!data) {
      return user;
    }

    if (data === 'sub') {
      return user?.id;
    }

    return user?.[data];
  },
);
