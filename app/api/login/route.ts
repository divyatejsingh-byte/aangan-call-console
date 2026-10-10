import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, createSessionToken, safeEqual, sessionCookieOptions } from '@/lib/session';

export const runtime = 'nodejs';

const DESIGNER_EMAIL = 'divyatej_singh@pg27.mesaschool.co';

export async function POST(req: NextRequest) {
  let body: { email?: unknown; password?: unknown } = {};
  try {
    body = await req.json();
  } catch {}
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const expected = process.env.DASHBOARD_PASSWORD ?? '1234';

  if (email !== DESIGNER_EMAIL || !safeEqual(password, expected)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions);
  return res;
}
