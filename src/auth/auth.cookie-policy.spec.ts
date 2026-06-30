import {
  isLocalHttpWebOrigin,
  resolveAuthCookiePolicy,
} from './auth.cookie-policy';

describe('auth cookie policy', () => {
  it('uses development cookies for localhost Vite origins', () => {
    expect(
      resolveAuthCookiePolicy({
        secure: true,
        sameSite: 'none',
        origin: 'http://localhost:5173',
      }),
    ).toEqual({ secure: false, sameSite: 'lax' });
  });

  it('uses development cookies for LAN Vite origins', () => {
    expect(
      resolveAuthCookiePolicy({
        secure: true,
        sameSite: 'none',
        origin: 'http://192.168.1.20:5173',
      }),
    ).toEqual({ secure: false, sameSite: 'lax' });
  });

  it('keeps cross-site cookies for Capacitor origins', () => {
    expect(
      resolveAuthCookiePolicy({
        secure: true,
        sameSite: 'lax',
        origin: 'http://localhost',
      }),
    ).toEqual({ secure: true, sameSite: 'none' });

    expect(
      resolveAuthCookiePolicy({
        secure: true,
        sameSite: 'lax',
        origin: 'https://localhost',
      }),
    ).toEqual({ secure: true, sameSite: 'none' });

    expect(
      resolveAuthCookiePolicy({
        secure: true,
        sameSite: 'lax',
        origin: 'capacitor://localhost',
      }),
    ).toEqual({ secure: true, sameSite: 'none' });
  });

  it('keeps configured secure cookies for production web origins', () => {
    expect(
      resolveAuthCookiePolicy({
        secure: true,
        sameSite: 'none',
        origin: 'https://lyaguh.site',
      }),
    ).toEqual({ secure: true, sameSite: 'none' });
  });

  it('does not allow SameSite=None without Secure', () => {
    expect(
      resolveAuthCookiePolicy({
        secure: false,
        sameSite: 'none',
        origin: 'http://localhost',
      }),
    ).toEqual({ secure: false, sameSite: 'lax' });
  });

  it('recognizes only local http web origins as development origins', () => {
    expect(isLocalHttpWebOrigin('http://localhost:5173')).toBe(true);
    expect(isLocalHttpWebOrigin('http://127.0.0.1:5173')).toBe(true);
    expect(isLocalHttpWebOrigin('http://192.168.0.10:5173')).toBe(true);
    expect(isLocalHttpWebOrigin('http://localhost')).toBe(false);
    expect(isLocalHttpWebOrigin('https://localhost')).toBe(false);
    expect(isLocalHttpWebOrigin('http://lyaguh.site')).toBe(false);
  });
});
