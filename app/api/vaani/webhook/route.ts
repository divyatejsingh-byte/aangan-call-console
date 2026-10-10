import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { pushCallToHubspot } from '@/lib/hubspot';

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
  // Keep only harmless headers; Vercel injects credential-like ones (e.g. x-vercel-oidc-token).
  for (const k of ['content-type', 'user-agent', 'x-forwarded-for']) {
    const v = req.headers.get(k);
    if (v) headers[k] = v;
  }

  const db = supabaseAdmin();
  const { data: row, error } = await db
    .from('webhook_events')
    .insert({ event_type: eventType, payload, headers })
    .select('id')
    .single();

  if (error || !row) {
    console.error('webhook insert failed', error?.message);
    return NextResponse.json({ error: 'storage failed' }, { status: 500 });
  }

  // A finished call: create the HubSpot deal. A HubSpot failure must not make Vaani retry the webhook.
  if (eventType === 'call_postprocessing' && obj.data && typeof obj.data === 'object') {
    const hubspot = await pushCallToHubspot(obj.data as Record<string, unknown>);
    if (hubspot.status === 'error') console.error('hubspot push failed', hubspot.note);
    const { error: updateError } = await db
      .from('webhook_events')
      .update({ payload: { ...obj, _hubspot: hubspot } })
      .eq('id', row.id);
    if (updateError) console.error('could not record hubspot result', updateError.message);
  }
  return NextResponse.json({ ok: true });
}

export function GET() {
  return NextResponse.json({ ok: true, service: 'vaani-webhook' });
}
