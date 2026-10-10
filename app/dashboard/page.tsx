'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Phone, Search, Moon, Clock, UserCheck, CalendarDays, ChevronDown, LogOut,
  Radio, RefreshCw, Inbox, FileText, Sparkles, PhoneIncoming, CheckCircle2, CircleDashed,
} from 'lucide-react';

/* ----------------------------- Types ----------------------------- */

type FilterTab = 'all' | 'after-hours';

interface VaaniPayload {
  event?: string;
  type?: string;
  timestamp?: string;
  from?: string;
  to?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

interface WebhookEvent {
  id: string;
  event_type: string | null;
  received_at: string;
  payload: VaaniPayload;
}

interface CallRecord {
  id: string; // Vaani room_name
  caller: string;
  to: string;
  agent: string;
  callType: string;
  startedAt: Date;
  events: WebhookEvent[]; // oldest first
  ended: boolean;
  transcript: string | null;
  summary: string | null;
}

/* ---------------------------- Constants -------------------------- */

const LEAD_DESIGNER = {
  name: 'Divyatej Singh',
  email: 'divyatej_singh@pg27.mesaschool.co',
  role: 'Lead Interior Designer',
};

const POLL_MS = 15000;

/* ---------------------------- Helpers ---------------------------- */

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

// Look for a field anywhere in an event payload (Vaani's end-of-call format isn't confirmed yet).
function findField(obj: unknown, names: string[], depth = 0): unknown {
  if (!obj || typeof obj !== 'object' || depth > 4) return undefined;
  const rec = obj as Record<string, unknown>;
  for (const n of names) if (rec[n] !== undefined && rec[n] !== null && rec[n] !== '') return rec[n];
  for (const v of Object.values(rec)) {
    const found = findField(v, names, depth + 1);
    if (found !== undefined) return found;
  }
  return undefined;
}

function asText(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return null;
  }
}

function groupCalls(events: WebhookEvent[]): CallRecord[] {
  const map = new Map<string, WebhookEvent[]>();
  for (const e of events) {
    const id = str(e.payload?.data?.room_name);
    if (!id) continue; // not a call event (e.g. connectivity pings)
    map.set(id, [...(map.get(id) ?? []), e]);
  }

  return [...map.entries()]
    .map(([id, list]) => {
      const evts = [...list].sort((a, b) => a.received_at.localeCompare(b.received_at));
      const first = evts[0];
      const data = first.payload.data ?? {};
      const ts = new Date(str(first.payload.timestamp) || first.received_at);
      const transcript = asText(evts.map((e) => findField(e.payload.data, ['transcript', 'transcription', 'conversation'])).find((v) => v !== undefined));
      const summary = asText(evts.map((e) => findField(e.payload.data, ['summary', 'call_summary'])).find((v) => v !== undefined));
      return {
        id,
        caller: str(data.caller) || str(first.payload.from) || 'Unknown caller',
        to: str(first.payload.to),
        agent: str(data.agent_name),
        callType: str(data.call_type),
        startedAt: isNaN(ts.getTime()) ? new Date(first.received_at) : ts,
        events: evts,
        ended: evts.some((e) => /end|complet|finish|hangup/i.test(e.event_type ?? '')),
        transcript,
        summary,
      };
    })
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
}

const IST = 'Asia/Kolkata';

function istParts(d: Date) {
  const f = new Intl.DateTimeFormat('en-IN', { timeZone: IST, hour: 'numeric', hour12: false });
  return { hour: Number(f.format(d)) % 24 };
}

function isAfterHours(d: Date) {
  const { hour } = istParts(d);
  return hour < 10 || hour >= 19;
}

function fmtDate(d: Date) {
  return d.toLocaleString('en-IN', { timeZone: IST, day: 'numeric', month: 'short' });
}

function fmtTime(d: Date) {
  return d.toLocaleString('en-IN', { timeZone: IST, hour: 'numeric', minute: '2-digit', hour12: true });
}

/* ---------------------------- Components ------------------------- */

function AfterHoursTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-amber-100">
      <Moon className="h-3 w-3" /> Outside 10am–7pm
    </span>
  );
}

function StatusTag({ ended }: { ended: boolean }) {
  return ended ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
      <CheckCircle2 className="h-3 w-3" /> Call ended
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
      <CircleDashed className="h-3 w-3" /> Started · awaiting end-of-call data
    </span>
  );
}

function Pending({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <section className="rounded-2xl border border-dashed border-stone-300 bg-white p-4">
      <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span className="text-amber-700">{icon}</span>
        {title}
      </div>
      <p className="text-sm text-stone-500">{text}</p>
    </section>
  );
}

/* ------------------------------ Page ----------------------------- */

export default function CallConsolePage() {
  const router = useRouter();
  const [events, setEvents] = useState<WebhookEvent[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<FilterTab>('all');
  const [query, setQuery] = useState('');
  const [showCalendar, setShowCalendar] = useState(true);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/calls', { cache: 'no-store' });
      if (res.status === 401) {
        router.replace('/');
        return;
      }
      if (!res.ok) throw new Error('bad status');
      const json = (await res.json()) as { events: WebhookEvent[] };
      setEvents(json.events);
      setLoadError(null);
      setLastSync(new Date());
    } catch {
      setLoadError('Could not load calls. Retrying…');
    } finally {
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  async function signOut() {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } finally {
      router.push('/');
    }
  }

  const calls = useMemo(() => groupCalls(events ?? []), [events]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/\s/g, '');
    return calls.filter((c) => {
      if (tab === 'after-hours' && !isAfterHours(c.startedAt)) return false;
      return !q || c.caller.toLowerCase().replace(/\s/g, '').includes(q);
    });
  }, [calls, tab, query]);

  const selected = calls.find((c) => c.id === selectedId) ?? visible[0] ?? null;

  return (
    <div className="flex h-screen flex-col bg-stone-50 text-slate-800 md:flex-row">
      {/* ------------------------- Sidebar ------------------------- */}
      <aside className="flex max-h-[45vh] w-full shrink-0 flex-col overflow-y-auto border-b border-stone-200 bg-white md:max-h-none md:w-[360px] md:border-b-0 md:border-r">
        <div className="border-b border-stone-200 px-4 pb-3 pt-4">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-amber-300">
              <Phone className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-tight text-slate-900">Aangan Studio</h1>
              <p className="text-xs text-stone-500">Vaani · Call Console</p>
            </div>
            <button
              onClick={signOut}
              className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-stone-500 hover:bg-stone-100 hover:text-slate-800"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search phone number"
              className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-stone-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <div className="mt-3 flex gap-1 rounded-lg bg-stone-100 p-1">
            {([
              ['all', 'All Calls'],
              ['after-hours', 'After-Hours'],
            ] as [FilterTab, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
                  tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-stone-500 hover:text-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <ul className="min-h-[240px] flex-1 divide-y divide-stone-100 overflow-y-auto">
          {events === null && <li className="px-4 py-10 text-center text-sm text-stone-500">Loading calls…</li>}
          {events !== null && visible.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-stone-500">
              <Inbox className="mx-auto mb-2 h-6 w-6 text-stone-300" />
              {calls.length === 0 ? 'No calls yet. Calls from Vaani appear here as they arrive.' : 'No calls match this filter.'}
            </li>
          )}
          {visible.map((c) => {
            const active = c.id === selected?.id;
            return (
              <li key={c.id}>
                <button
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full border-l-[3px] px-4 py-3 text-left transition ${
                    active ? 'border-amber-600 bg-amber-50/60' : 'border-transparent hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900">{c.caller}</span>
                    <span className="shrink-0 text-xs text-stone-500">
                      {fmtDate(c.startedAt)}, {fmtTime(c.startedAt)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <StatusTag ended={c.ended} />
                    {isAfterHours(c.startedAt) && <AfterHoursTag />}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between border-t border-stone-200 px-4 py-2.5 text-xs text-stone-500">
          <span>
            {calls.length} call{calls.length === 1 ? '' : 's'} · {calls.filter((c) => isAfterHours(c.startedAt)).length} after hours
          </span>
          <button onClick={() => void load()} className="inline-flex items-center gap-1 hover:text-slate-800" aria-label="Refresh calls">
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            {lastSync ? fmtTime(lastSync) : 'Sync'}
          </button>
        </div>

        <div className="hidden shrink-0 border-t border-stone-200 md:block">
          <button
            onClick={() => setShowCalendar((v) => !v)}
            aria-expanded={showCalendar}
            className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-semibold text-slate-900 hover:bg-stone-50"
          >
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-amber-700" />
              {LEAD_DESIGNER.name}&apos;s calendar
            </span>
            <ChevronDown className={`h-4 w-4 text-stone-400 transition ${showCalendar ? '' : '-rotate-90'}`} />
          </button>
          {showCalendar && (
            <div className="px-2 pb-2">
              <iframe
                title="Google Calendar"
                src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(LEAD_DESIGNER.email)}&mode=MONTH&ctz=Asia%2FKolkata&showTitle=0&showPrint=0&showTz=0&showCalendars=0&showNav=1&showTabs=0`}
                className="h-[280px] w-full rounded-lg border border-stone-200"
              />
              <p className="px-2 pt-1.5 text-[11px] leading-snug text-stone-500">
                Blank? Sign in to Google as {LEAD_DESIGNER.email} in this browser, or{' '}
                <a
                  href={`https://calendar.google.com/calendar/u/0/r/month?authuser=${encodeURIComponent(LEAD_DESIGNER.email)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-amber-700 underline"
                >
                  open it in Google Calendar
                </a>
                .
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* --------------------------- Main -------------------------- */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-4 md:p-6">
          {loadError && (
            <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">{loadError}</div>
          )}

          {!selected ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-amber-300">
                <Radio className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Listening for Vaani calls</h2>
              <p className="mt-1 max-w-sm text-sm text-stone-500">
                Nothing has arrived yet. Call the Aangan inbound number and the call will appear here within seconds.
              </p>
            </div>
          ) : (
            <>
              <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-slate-900">{selected.caller}</h2>
                    <StatusTag ended={selected.ended} />
                    {isAfterHours(selected.startedAt) && <AfterHoursTag />}
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-stone-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {fmtDate(selected.startedAt)}, {fmtTime(selected.startedAt)} IST
                    </span>
                    {selected.agent && (
                      <span className="inline-flex items-center gap-1">
                        <PhoneIncoming className="h-3.5 w-3.5" />
                        {selected.agent}
                        {selected.callType ? ` · ${selected.callType}` : ''}
                      </span>
                    )}
                    {selected.to && <span>to {selected.to}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div className="text-sm leading-tight">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-stone-500">Lead designer</div>
                    <div className="font-semibold text-slate-900">{LEAD_DESIGNER.name}</div>
                  </div>
                </div>
              </header>

              <div className="mt-5 space-y-4">
                {selected.summary ? (
                  <section className="rounded-2xl border border-stone-200 bg-white p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Sparkles className="h-4 w-4 text-amber-700" /> Call Summary
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{selected.summary}</p>
                  </section>
                ) : (
                  <Pending
                    icon={<Sparkles className="h-4 w-4" />}
                    title="Call Summary & Lead Dossier"
                    text="Not received from Vaani yet. Property type, area, budget and location will appear once an end-of-call event arrives."
                  />
                )}

                {selected.transcript ? (
                  <section className="rounded-2xl border border-stone-200 bg-white p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <FileText className="h-4 w-4 text-amber-700" /> Transcript
                    </div>
                    <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{selected.transcript}</pre>
                  </section>
                ) : (
                  <Pending
                    icon={<FileText className="h-4 w-4" />}
                    title="Transcript"
                    text="Not received from Vaani yet."
                  />
                )}

                <section className="rounded-2xl border border-stone-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Events received from Vaani</h3>
                    <span className="text-xs text-stone-500">{selected.events.length} event{selected.events.length === 1 ? '' : 's'}</span>
                  </div>
                  <ul className="space-y-2">
                    {selected.events.map((e) => (
                      <li key={e.id} className="rounded-xl border border-stone-200 bg-stone-50/60">
                        <details>
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm">
                            <span className="font-mono text-xs font-semibold text-slate-900">{e.event_type ?? 'unknown'}</span>
                            <span className="text-xs text-stone-500">{fmtTime(new Date(e.received_at))}</span>
                          </summary>
                          <pre className="overflow-auto border-t border-stone-200 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
                            {JSON.stringify(e.payload, null, 2)}
                          </pre>
                        </details>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
