import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function tokenMatches(given: string | null) {
  const expected = process.env.VAANI_WEBHOOK_TOKEN;
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Vaani posts here. URL to register: <site>/api/vaani/webhook?token=<VAANI_WEBHOOK_TOKEN>
export async function POST(req: NextRequest) {
  if (!tokenMatches(req.nextUrl.searchParams.get('token'))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const obj = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
  const eventType = typeof obj.event === 'string' ? obj.event : typeof obj.type === 'string' ? obj.type : null;

  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    if (!['authorization', 'cookie'].includes(k)) headers[k] = v;
  });

  const { error } = await supabaseAdmin()
    .from('webhook_events')
    .insert({ event_type: eventType, payload, headers });

  if (error) {
    console.error('webhook insert failed', error.message);
    return NextResponse.json({ error: 'storage failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export function GET() {
  return NextResponse.json({ ok: true, service: 'vaani-webhook' });
}
