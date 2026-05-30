export type AuthUser = {
  id: string;
  email: string;
};

export type AuthUserWithRefresh = AuthUser & {
  refreshToken: string;
};
