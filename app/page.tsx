'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Compass, Lock, ArrowRight, ShieldCheck, Calendar, Mail, Eye, EyeOff,
  MapPin, Radio, AlertTriangle, KeyRound, FileText, CalendarCheck,
} from 'lucide-react';

/* ----------------------------- Types ----------------------------- */

interface Designer {
  name: string;
  role: string;
  email: string;
  initials: string;
}

interface StudioStat {
  id: string;
  value: string;
  label: string;
  note: string;
}

interface StatusIndicator {
  id: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: 'amber' | 'neutral';
}

/* ---------------------------- Constants -------------------------- */

const TEST_PASSWORD = '1234';
const AUTH_KEY = 'aangan-auth';

// Dark-graded in CSS below. Swap this URL for a darker studio photograph at any time.
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2400&q=80';

const DESIGNER: Designer = {
  name: 'Divyatej Singh',
  role: 'Lead Interior Designer (Sole Access)',
  email: 'divyatej_singh@pg27.mesaschool.co',
  initials: 'DS',
};

const STATS: StudioStat[] = [
  { id: 'capture', value: '100%', label: 'Inbound Capture SLA', note: '< 5-min response, day & night' },
  { id: 'value', value: '₹8L – ₹14L+', label: 'Baseline Project Value', note: 'Standard studio engagement' },
  { id: 'touch', value: '< 1 HR', label: 'Lead Touch Window', note: '4x conversion velocity' },
];

const STATUS: StatusIndicator[] = [
  { id: 'engine', label: 'PSTN / VAANI ENGINE', value: 'STANDBY', icon: <Radio className="h-3 w-3" />, tone: 'amber' },
  { id: 'area', label: 'METRO AREA', value: 'PUNE & PCMC', icon: <MapPin className="h-3 w-3" />, tone: 'neutral' },
];

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

/* ------------------------------ Page ----------------------------- */

export default function DesignerGateway() {
  const router = useRouter();
  const [email, setEmail] = useState(DESIGNER.email);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageReady, setImageReady] = useState(false);

  // Fade the photograph in once loaded; the gradient layers carry the page until then.
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setImageReady(true);
    img.src = HERO_IMAGE;
  }, []);

  function enter() {
    try {
      sessionStorage.setItem(AUTH_KEY, '1');
    } catch {
      // Private mode: the dashboard will send the user back here.
    }
    setSubmitting(true);
    router.push('/dashboard');
  }

  function directAccess() {
    setEmail(DESIGNER.email);
    setPassword(TEST_PASSWORD);
    setError(null);
    enter();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== TEST_PASSWORD) {
      setError(`Unauthorized key. Use test password ${TEST_PASSWORD}`);
      return;
    }
    setError(null);
    enter();
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#08090b] text-stone-200">
      {/* ------------------ Cinematic background ------------------ */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${imageReady ? 'opacity-100' : 'opacity-0'}`}
          style={{
            backgroundImage: `url(${HERO_IMAGE})`,
            filter: 'brightness(0.5) contrast(1.25) saturate(0.55) sepia(0.35)',
          }}
        />
        {/* bronze cove light */}
        <div className="absolute -top-32 left-[20%] h-80 w-[70%] rounded-[50%] bg-amber-600/25 blur-[110px]" />
        <div className="absolute bottom-[-10%] right-[5%] h-72 w-72 rounded-full bg-amber-700/15 blur-[120px]" />
        {/* legibility + vignette */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.75) 100%)' }} />
        {/* film grain */}
        <div className="absolute inset-0 opacity-[0.07] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
      </div>

      {/* ------------------------ Masthead ------------------------ */}
      <header className="relative z-10 mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-4 px-5 py-6 md:px-10">
        <div className="flex items-center gap-4">
          <Compass className="h-7 w-7 text-amber-300" strokeWidth={1.25} />
          <div className="leading-none">
            <div className="text-xl font-extrabold uppercase tracking-[0.22em] text-white">Aangan Studio</div>
            <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.3em] text-amber-200/70">
              Internal Design Terminal • Pune
            </div>
          </div>
        </div>

        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.2em]">
          {STATUS.map((s) => (
            <li key={s.id} className="flex items-center gap-2 text-stone-400">
              <span className={s.tone === 'amber' ? 'text-amber-300' : 'text-stone-500'}>{s.icon}</span>
              {s.label}:
              <span className={s.tone === 'amber' ? 'text-amber-300' : 'text-stone-200'}>{s.value}</span>
              {s.tone === 'amber' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />}
            </li>
          ))}
        </ul>
      </header>

      {/* ----------------------- Hero workspace ----------------------- */}
      <main className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-8 md:px-10 lg:min-h-[calc(100vh-190px)] lg:grid-cols-[1.25fr_0.75fr] lg:pt-4">
        <section>
          <p className="mb-5 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.35em] text-amber-200/80">
            <span className="h-px w-10 bg-amber-300/60" />
            Private access · Design team only
          </p>
          <h1 className="font-serif text-5xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-6xl xl:text-7xl">
            The designer&apos;s
            <br />
            terminal.
          </h1>
          <p className="mt-7 max-w-xl text-base leading-relaxed text-stone-300/90">
            Incoming caller briefs, spatial specs, and pre-booked client discovery holds, synthesized in real-time.
          </p>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
            <span className="inline-flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-amber-300" /> AI dossiers</span>
            <span className="inline-flex items-center gap-2"><CalendarCheck className="h-3.5 w-3.5 text-amber-300" /> Calendar holds</span>
            <span className="inline-flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-amber-300" /> Live call briefs</span>
          </div>

          <dl className="mt-12 grid max-w-2xl gap-px overflow-hidden rounded-sm border border-white/10 bg-white/10 sm:grid-cols-3">
            {STATS.map((s) => (
              <div key={s.id} className="bg-black/55 p-5 backdrop-blur-md">
                <dd className="font-serif text-3xl font-bold tracking-tight text-white">{s.value}</dd>
                <dt className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-amber-200/80">{s.label}</dt>
                <p className="mt-1 text-xs text-stone-500">{s.note}</p>
              </div>
            ))}
          </dl>
        </section>

        {/* ---------------- Authentication panel ---------------- */}
        <section aria-label="Designer authentication">
          <div className="rounded-2xl border border-white/10 bg-black/60 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
            <div className="mb-6 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500">
              <span className="inline-flex items-center gap-2 text-amber-200/80"><Lock className="h-3.5 w-3.5" /> Secure entry</span>
              <span>Terminal 01</span>
            </div>

            {/* Identity card */}
            <div className="flex items-center gap-4 rounded-xl border border-amber-300/20 bg-gradient-to-br from-amber-300/[0.08] to-transparent p-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-amber-300/40 bg-black/50 font-serif text-lg font-bold text-amber-200">
                {DESIGNER.initials}
              </div>
              <div className="min-w-0">
                <div className="font-serif text-xl font-bold text-white">{DESIGNER.name}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber-200/80">{DESIGNER.role}</div>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-stone-400">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{DESIGNER.email}</span>
                </div>
              </div>
            </div>

            <button
              onClick={directAccess}
              disabled={submitting}
              className="group mt-4 flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-amber-200 to-amber-500 px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-black transition hover:from-amber-100 hover:to-amber-400 disabled:opacity-70"
            >
              {submitting ? 'Opening terminal…' : '1-Click Direct Access'}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </button>

            <div className="my-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-stone-600">
              <span className="h-px flex-1 bg-white/10" />
              Manual override
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <label htmlFor="email" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
                Designer email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 py-3 pl-10 pr-3 text-sm text-stone-100 outline-none focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/20"
                />
              </div>

              <div className="mb-1.5 mt-4 flex items-center justify-between">
                <label htmlFor="password" className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
                  Access key
                </label>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-200">
                  <KeyRound className="h-3 w-3" /> Test Password: {TEST_PASSWORD}
                </span>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  aria-invalid={!!error}
                  className="w-full rounded-lg border border-white/10 bg-black/40 py-3 pl-10 pr-11 text-sm text-stone-100 outline-none focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {error && (
                <div role="alert" className="mt-3 flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:border-amber-300/60 hover:bg-white/5 disabled:opacity-70"
              >
                Authenticate <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>

            <p className="mt-6 flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600">
              <ShieldCheck className="h-3 w-3" /> Authorized studio personnel only
            </p>
          </div>
        </section>
      </main>

      <footer className="relative z-10 pb-6 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-stone-600">
        Aangan Studio · Internal · Pune, Maharashtra
      </footer>
    </div>
  );
}
