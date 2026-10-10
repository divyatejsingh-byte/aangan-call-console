import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest } from 'next/server';

export const SESSION_COOKIE = 'aangan_session';
const MAX_AGE_SEC = 60 * 60 * 24 * 7;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET is not configured');
  return s;
}

function sign(value: string) {
  return createHmac('sha256', secret()).update(value).digest('hex');
}

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function createSessionToken() {
  const expires = String(Date.now() + MAX_AGE_SEC * 1000);
  return `${expires}.${sign(expires)}`;
}

export function isAuthenticated(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const [expires, sig] = token.split('.');
  if (!expires || !sig || !safeEqual(sig, sign(expires))) return false;
  return Number(expires) > Date.now();
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: MAX_AGE_SEC,
};
