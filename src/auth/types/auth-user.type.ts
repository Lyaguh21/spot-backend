import { UserRole } from '@prisma/client';

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  name: string;
  role: UserRole;
};

export type AuthUserWithRefresh = AuthUser & {
  refreshToken: string;
};
