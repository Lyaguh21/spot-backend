export type AuthCookieSameSite = 'lax' | 'strict' | 'none';

export type AuthCookiePolicy = {
  secure: boolean;
  sameSite: AuthCookieSameSite;
};

const CAPACITOR_ORIGINS = new Set([
  'capacitor://localhost',
  'https://localhost',
  'http://localhost',
]);

const isPrivateIpv4 = (hostname: string) => {
  const parts = hostname.split('.').map((part) => Number(part));

  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return false;
  }

  const [first, second] = parts;
  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
};

export const isCapacitorOrigin = (origin?: string) =>
  Boolean(origin && CAPACITOR_ORIGINS.has(origin.toLowerCase()));

export const isLocalHttpWebOrigin = (origin?: string) => {
  if (!origin) {
    return false;
  }

  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();

    return (
      url.protocol === 'http:' &&
      Boolean(url.port) &&
      (hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '[::1]' ||
        isPrivateIpv4(hostname))
    );
  } catch {
    return false;
  }
};

const normalizeSameSite = (
  value: string | undefined,
  fallback: AuthCookieSameSite,
): AuthCookieSameSite => {
  const normalized = value?.toLowerCase();

  if (
    normalized === 'none' ||
    normalized === 'strict' ||
    normalized === 'lax'
  ) {
    return normalized;
  }

  return fallback;
};

export function resolveAuthCookiePolicy(params: {
  secure: boolean;
  sameSite?: string;
  origin?: string;
}): AuthCookiePolicy {
  if (params.secure && isCapacitorOrigin(params.origin)) {
    return { secure: true, sameSite: 'none' };
  }

  if (isLocalHttpWebOrigin(params.origin)) {
    return { secure: false, sameSite: 'lax' };
  }

  const fallbackSameSite = params.secure ? 'none' : 'lax';
  const configuredSameSite = normalizeSameSite(
    params.sameSite,
    fallbackSameSite,
  );
  const sameSite =
    !params.secure && configuredSameSite === 'none' ? 'lax' : configuredSameSite;

  return { secure: params.secure, sameSite };
}
