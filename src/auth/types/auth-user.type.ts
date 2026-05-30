export type AuthUser = {
  id: string;
  email: string;
  username: string;
  name: string;
};

export type AuthUserWithRefresh = AuthUser & {
  refreshToken: string;
};
