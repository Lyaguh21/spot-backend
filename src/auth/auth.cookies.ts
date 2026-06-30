import type { Response } from 'express';

export type CookieOptionsShape = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  path?: string;
  maxAge: number;
};

export function setAuthCookies(params: {
  res: Response;
  accessToken: string;
  refreshToken: string;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  accessMaxAgeMs: number;
  refreshMaxAgeMs: number;
}) {
  const {
    res,
    accessToken,
    refreshToken,
    secure,
    sameSite,
    accessMaxAgeMs,
    refreshMaxAgeMs,
  } = params;

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure,
    sameSite,
    path: '/auth',
  });

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: '/', // access нужен на все запросы
    maxAge: accessMaxAgeMs,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: refreshMaxAgeMs,
  });
}

export function clearAuthCookies(
  res: Response,
  params: { secure: boolean; sameSite: 'lax' | 'strict' | 'none' },
) {
  const { secure, sameSite } = params;

  res.clearCookie('accessToken', {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure,
    sameSite,
    path: '/auth',
  });
}
