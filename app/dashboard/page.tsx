'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Phone, Search, Moon, Clock, UserCheck, CalendarDays, ChevronDown, LogOut,
  Radio, RefreshCw, Inbox, FileText, Sparkles, PhoneIncoming, CheckCircle2, CircleDashed,
  Bot, User, Home, MapPin, IndianRupee, CalendarClock, Target, Timer, ExternalLink, CalendarCheck, Database,
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
  summary: string | null;
  transcript: TranscriptLine[];
  durationSec: number | null;
  entities: Record<string, unknown>;
  recordingUrl: string | null;
  quality: Record<string, number> | null;
  appointment: string | null;
  hubspot: { status: string; dealId?: string; note?: string } | null;
}

interface TranscriptLine {
  time: string;
  speaker: 'agent' | 'user';
  text: string;
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

function parseTranscript(raw: string): TranscriptLine[] {
  const lines: TranscriptLine[] = [];
  for (const row of raw.split('\n')) {
    const m = row.match(/^\[(\d{1,2}:\d{2}:\d{2})\]\s*(AGENT|USER):\s*(.*)$/i);
    if (m) lines.push({ time: m[1], speaker: m[2].toUpperCase() === 'AGENT' ? 'agent' : 'user', text: m[3] });
    else if (row.trim() && lines.length) lines[lines.length - 1].text += ' ' + row.trim();
  }
  return lines;
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
      const started = (first.payload.data ?? {}) as Record<string, unknown>;
      const post = (evts.find((e) => e.event_type === 'call_postprocessing')?.payload.data ?? {}) as Record<string, unknown>;
      const end = (evts.find((e) => e.event_type === 'call_ended')?.payload.data ?? {}) as Record<string, unknown>;

      const ts = new Date(str(post.call_started_at) || str(first.payload.timestamp) || first.received_at);
      const rawTranscript = str(post.transcript) || str(end.transcript);
      const entities = (post.entities && typeof post.entities === 'object' ? post.entities : {}) as Record<string, unknown>;
      const duration = Number(post.call_duration ?? end.call_duration);
      const q = post.conversation_quality;

      return {
        id,
        caller: str(started.caller) || str(first.payload.from) || 'Unknown caller',
        to: str(first.payload.to),
        agent: str(started.agent_name),
        callType: str(started.call_type),
        startedAt: isNaN(ts.getTime()) ? new Date(first.received_at) : ts,
        events: evts,
        ended: evts.some((e) => /end|complet|finish|hangup|postprocess/i.test(e.event_type ?? '')),
        summary: str(post.summary) || null,
        transcript: parseTranscript(rawTranscript),
        durationSec: Number.isFinite(duration) && duration > 0 ? duration : null,
        entities,
        recordingUrl: str(post.recording_url) || null,
        quality: q && typeof q === 'object' ? (q as Record<string, number>) : null,
        appointment: str(entities['Appointment Schedule']) || null,
        hubspot:
          (evts.find((e) => e.event_type === 'call_postprocessing')?.payload._hubspot as CallRecord['hubspot']) ?? null,
      };
    })
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
}

function fmtDuration(sec: number) {
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function fmtValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if ('min' in o || 'max' in o) return [o.min, o.max].filter((x) => x !== null && x !== undefined).join(' – ');
    return Object.values(o).filter(Boolean).join(', ');
  }
  return '';
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
      <CircleDashed className="h-3 w-3" /> In progress or no end event
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
                    <span className="truncate text-sm font-semibold text-slate-900">{c.caller === 'web-user' ? 'Web test call' : c.caller}</span>
                    <span className="shrink-0 text-xs text-stone-500">
                      {fmtDate(c.startedAt)}, {fmtTime(c.startedAt)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <StatusTag ended={c.ended} />
                    {c.appointment && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                        <CalendarCheck className="h-3 w-3" /> Discovery call
                      </span>
                    )}
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
        <div className="mx-auto max-w-6xl p-4 md:p-6">
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
                    <h2 className="text-xl font-semibold text-slate-900">{selected.caller === 'web-user' ? 'Web test call' : selected.caller}</h2>
                    <StatusTag ended={selected.ended} />
                    {isAfterHours(selected.startedAt) && <AfterHoursTag />}
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-stone-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {fmtDate(selected.startedAt)}, {fmtTime(selected.startedAt)} IST
                    </span>
                    {selected.durationSec && (
                      <span className="inline-flex items-center gap-1">
                        <Timer className="h-3.5 w-3.5" />
                        {fmtDuration(selected.durationSec)}
                      </span>
                    )}
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

              {selected.recordingUrl && (
                <section className="mt-5 rounded-2xl bg-slate-900 p-4 text-slate-100">
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                    <span>Call recording</span>
                    <a href={selected.recordingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200">
                      Open <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <audio controls preload="none" src={selected.recordingUrl} className="h-10 w-full" />
                </section>
              )}

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  {selected.appointment && (
                    <section className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <CalendarCheck className="mt-0.5 h-5 w-5 text-emerald-700" />
                      <div>
                        <div className="text-sm font-semibold text-emerald-900">Discovery call requested</div>
                        <div className="text-sm text-emerald-900/80">{selected.appointment}</div>
                        <div className="mt-1 text-xs text-emerald-900/60">Agreed on the call. Not yet added to a calendar.</div>
                      </div>
                    </section>
                  )}

                  {selected.hubspot && (
                    <section className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4">
                      <Database className="mt-0.5 h-5 w-5 text-amber-700" />
                      <div className="min-w-0 text-sm">
                        <div className="font-semibold text-slate-900">HubSpot CRM</div>
                        {(selected.hubspot.status === 'created' || selected.hubspot.status === 'exists') && selected.hubspot.dealId ? (
                          <a
                            href={`https://app-na2.hubspot.com/contacts/247652924/record/0-3/${selected.hubspot.dealId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-700 underline"
                          >
                            Deal in Initial Inquiry <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : selected.hubspot.status === 'skipped' ? (
                          <div className="text-stone-500">Not pushed: {selected.hubspot.note}</div>
                        ) : (
                          <div className="text-rose-700">Push failed: {selected.hubspot.note}</div>
                        )}
                      </div>
                    </section>
                  )}

                  {selected.summary ? (
                    <section className="rounded-2xl border border-stone-200 bg-white p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Sparkles className="h-4 w-4 text-amber-700" /> AI Context Summary
                      </div>
                      <p className="text-sm leading-relaxed text-slate-700">{selected.summary}</p>
                    </section>
                  ) : (
                    <Pending icon={<Sparkles className="h-4 w-4" />} title="AI Context Summary" text="Not received from Vaani yet. It arrives a minute or two after the call ends." />
                  )}

                  <section>
                    <h3 className="mb-2.5 text-sm font-semibold text-slate-900">Lead Dossier</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        { key: 'Property Type & Configuration', label: 'Property Type', icon: <Home className="h-3.5 w-3.5" /> },
                        { key: 'Budget Range', label: 'Target Budget', icon: <IndianRupee className="h-3.5 w-3.5" /> },
                        { key: 'Location Preference', label: 'Site Location', icon: <MapPin className="h-3.5 w-3.5" /> },
                        { key: 'Timeline', label: 'Timeline', icon: <CalendarClock className="h-3.5 w-3.5" /> },
                        { key: 'Market Status', label: 'Buyer Status', icon: <Target className="h-3.5 w-3.5" /> },
                        { key: 'End-Use Purpose', label: 'Use', icon: <Home className="h-3.5 w-3.5" /> },
                      ].map((f) => {
                        const v = fmtValue(selected.entities[f.key]);
                        return (
                          <div key={f.key} className="rounded-xl border border-stone-200 bg-white p-3.5">
                            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-stone-500">
                              <span className="text-amber-700">{f.icon}</span>
                              {f.label}
                            </div>
                            <div className={`text-sm leading-snug ${v ? 'font-semibold text-slate-900' : 'text-stone-400'}`}>
                              {v || 'Not captured'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {selected.quality && (
                    <section className="rounded-2xl border border-stone-200 bg-white p-4">
                      <h3 className="mb-2.5 text-sm font-semibold text-slate-900">Conversation quality</h3>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                        {Object.entries(selected.quality).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between">
                            <dt className="capitalize text-stone-500">{k.replace(/_/g, ' ')}</dt>
                            <dd className="font-semibold text-slate-900">{v}/10</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  )}
                </div>

                <div className="space-y-4">
                  <section className="rounded-2xl border border-stone-200 bg-white">
                    <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <FileText className="h-4 w-4 text-amber-700" /> Call Transcript
                      </h3>
                    </div>
                    {selected.transcript.length === 0 ? (
                      <p className="p-4 text-sm text-stone-500">Not received from Vaani yet.</p>
                    ) : (
                      <div className="max-h-[480px] space-y-3 overflow-y-auto p-4">
                        {selected.transcript.map((t, i) => {
                          const agent = t.speaker === 'agent';
                          return (
                            <div key={i} className={`flex gap-2.5 ${agent ? '' : 'flex-row-reverse'}`}>
                              <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${agent ? 'bg-slate-900 text-amber-300' : 'bg-amber-100 text-amber-800'}`}>
                                {agent ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                              </div>
                              <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${agent ? 'rounded-tl-sm bg-stone-100' : 'rounded-tr-sm bg-amber-50'}`}>
                                <div className="mb-0.5 flex items-center gap-2 text-[11px] font-medium text-stone-500">
                                  <span>{agent ? 'Agent (Vaani)' : 'Caller'}</span>
                                  <span className="tabular-nums">{t.time}</span>
                                </div>
                                {t.text}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>

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
                            <pre className="max-h-64 overflow-auto border-t border-stone-200 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
                              {JSON.stringify(e.payload, null, 2)}
                            </pre>
                          </details>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
