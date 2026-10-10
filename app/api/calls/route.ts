import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Raw Vaani webhook events, newest first. The dashboard groups them into calls.
export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin()
    .from('webhook_events')
    .select('id, event_type, received_at, payload')
    .order('received_at', { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: 'query failed' }, { status: 500 });
  return NextResponse.json({ events: data });
}
