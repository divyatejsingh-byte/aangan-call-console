import { createClient } from '@supabase/supabase-js';

// Server-only client. Never import this from a 'use client' file.
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Supabase env vars are not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}
