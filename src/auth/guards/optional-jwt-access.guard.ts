import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthUser } from '../types/auth-user.type';

@Injectable()
export class OptionalJwtAccessGuard extends AuthGuard('jwt-access') {
  handleRequest<TUser = AuthUser | undefined>(
    _err: unknown,
    user: TUser,
    _info: unknown,
    _context: ExecutionContext,
    _status?: unknown,
  ): TUser {
    return user;
  }
}
