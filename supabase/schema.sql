-- Raw inbound events from Vaani. Kept verbatim so we can see the real payload
-- format before modelling calls/transcripts.
create table if not exists public.webhook_events (
  id          uuid primary key default gen_random_uuid(),
  received_at timestamptz not null default now(),
  event_type  text,
  payload     jsonb not null,
  headers     jsonb
);

create index if not exists webhook_events_received_at_idx
  on public.webhook_events (received_at desc);

-- RLS on with no policies: the public/publishable key cannot read or write.
-- Only the server-side secret key (which bypasses RLS) can.
alter table public.webhook_events enable row level security;
