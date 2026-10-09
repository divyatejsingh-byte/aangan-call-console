'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Compass, Lock, ArrowRight, Sparkles, ShieldCheck, Calendar, Mail, Eye, EyeOff,
  MapPin, Radio, Clock, IndianRupee, PhoneCall, AlertCircle, KeyRound,
} from 'lucide-react';

/* ----------------------------- Types ----------------------------- */

type LoginTab = 'quick' | 'form';

interface Metric {
  id: string;
  value: string;
  label: string;
  note: string;
  icon: React.ReactNode;
}

interface Designer {
  name: string;
  role: string;
  email: string;
  initials: string;
}

/* ---------------------------- Constants -------------------------- */

const TEST_PASSWORD = '1234';
const AUTH_KEY = 'aangan-auth';

const DESIGNER: Designer = {
  name: 'Divyatej Singh',
  role: 'Sole Lead Designer',
  email: 'divyatej_singh@pg27.mesaschool.co',
  initials: 'DS',
};

const METRICS: Metric[] = [
  { id: 'sla', value: '100%', label: '24/7 Answer SLA', note: '< 5 min response, day or night', icon: <PhoneCall className="h-4 w-4" /> },
  { id: 'value', value: '₹8L – ₹14L+', label: 'Standard Project Value', note: '2BHK, bare shells & villas', icon: <IndianRupee className="h-4 w-4" /> },
  { id: 'response', value: '< 1 Hour', label: 'Response Target', note: '4x conversion velocity', icon: <Clock className="h-4 w-4" /> },
];

const SPACES = ['2BHK+ residences', 'Bare-shell turnkey', 'Villas & bungalows', 'Small offices'];

/* ------------------------------ Page ----------------------------- */

export default function LandingPage() {
  const router = useRouter();
  const [tab, setTab] = useState<LoginTab>('quick');
  const [email, setEmail] = useState(DESIGNER.email);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function enter() {
    try {
      sessionStorage.setItem(AUTH_KEY, '1');
    } catch {
      // Private mode: the dashboard will send the user back here.
    }
    setSubmitting(true);
    router.push('/dashboard');
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) {
      setError('Enter your designer email.');
      return;
    }
    if (password !== TEST_PASSWORD) {
      setError('That password is incorrect. Please try again.');
      return;
    }
    setError(null);
    enter();
  }

  function openPortal() {
    document.getElementById('designer-portal')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0d0f12] text-stone-200">
      {/* ---------------- Atmospheric background ---------------- */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* fluted wood panelling */}
        <div
          className="absolute inset-y-0 right-0 w-full opacity-[0.55] md:w-[62%]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(120,84,46,0.38) 0px, rgba(120,84,46,0.38) 2px, rgba(24,18,13,0.9) 2px, rgba(24,18,13,0.9) 26px, rgba(70,48,28,0.55) 26px, rgba(70,48,28,0.55) 28px)',
            maskImage: 'linear-gradient(to left, black 25%, transparent 95%)',
            WebkitMaskImage: 'linear-gradient(to left, black 25%, transparent 95%)',
          }}
        />
        {/* dark marble veining */}
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 60% 30% at 20% 85%, rgba(255,255,255,0.35), transparent 70%), radial-gradient(ellipse 40% 18% at 35% 92%, rgba(255,255,255,0.22), transparent 70%)',
          }}
        />
        {/* cove lighting */}
        <div className="absolute -top-24 left-1/2 h-72 w-[120%] -translate-x-1/2 rounded-[50%] bg-amber-500/20 blur-[90px]" />
        <div className="absolute right-[-10%] top-[30%] h-80 w-80 rounded-full bg-amber-600/10 blur-[110px]" />
        {/* legibility overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d0f12]/70 via-[#0d0f12]/55 to-[#0d0f12]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0f12] via-[#0d0f12]/80 to-transparent" />
      </div>

      {/* ------------------------- Header ------------------------- */}
      <header className="relative z-10 mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-500/40 bg-[#14171d]/80 text-amber-300">
            <Compass className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-serif text-lg tracking-wide text-stone-100">Aangan Studio</div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-amber-200/60">Interior Architecture</div>
          </div>
        </div>

        <div className="order-3 flex w-full flex-wrap items-center gap-2 md:order-none md:w-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-stone-300">
            <MapPin className="h-3 w-3 text-amber-300" /> Pune &amp; PCMC Service Area
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-1 text-[11px] text-emerald-200">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Autonomous Voice AI Intake Active
          </span>
        </div>

        <button
          onClick={openPortal}
          className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-400/20"
        >
          <Lock className="h-3.5 w-3.5" /> Designer Portal
        </button>
      </header>

      {/* -------------------------- Hero -------------------------- */}
      <main className="relative z-10 mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-10 md:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:pt-16">
        <section>
          <div className="mb-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-amber-200/70">
            <Sparkles className="h-3.5 w-3.5" /> Founded by Nikhil Deshpande
          </div>
          <h1 className="font-serif text-4xl leading-[1.08] text-stone-50 sm:text-5xl lg:text-6xl">
            Spaces crafted with
            <span className="block bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
              quiet luxury &amp; precision.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-stone-400">
            A Pune design studio shaping bespoke residences and small commercial spaces, from first call to final handover.
            Every enquiry is answered the moment it arrives, so no brief is ever left waiting.
          </p>

          <ul className="mt-6 flex flex-wrap gap-2">
            {SPACES.map((s) => (
              <li key={s} className="rounded-full border border-white/10 px-3 py-1 text-xs text-stone-300">
                {s}
              </li>
            ))}
          </ul>

          {/* Metrics */}
          <dl className="mt-10 grid gap-3 sm:grid-cols-3">
            {METRICS.map((m) => (
              <div key={m.id} className="rounded-2xl border border-white/10 bg-[#14171d]/70 p-4 backdrop-blur">
                <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-amber-200/70">
                  {m.icon}
                  {m.label}
                </dt>
                <dd className="mt-2 font-serif text-2xl text-stone-50">{m.value}</dd>
                <p className="mt-1 text-xs text-stone-500">{m.note}</p>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-wrap items-center gap-5 text-xs text-stone-500">
            <span className="inline-flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-amber-400" /> Vaani answers 24/7
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-amber-400" /> 15-min discovery calls booked automatically
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" /> No binding quotes without a site visit
            </span>
          </div>
        </section>

        {/* ------------------- Designer login panel ------------------- */}
        <section id="designer-portal" className="self-start lg:sticky lg:top-8">
          <div className="rounded-3xl border border-white/10 bg-[#14171d]/70 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-serif text-xl text-stone-50">Designer Portal</h2>
                <p className="text-xs text-stone-500">Sign in to the Vaani call console</p>
              </div>
            </div>

            <div role="tablist" className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-black/30 p-1">
              {([
                ['quick', 'Quick Login'],
                ['form', 'Email & Password'],
              ] as [LoginTab, string][]).map(([key, label]) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => {
                    setTab(key);
                    setError(null);
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    tab === key ? 'bg-amber-400/15 text-amber-100' : 'text-stone-500 hover:text-stone-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'quick' ? (
              <div>
                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-600 font-semibold text-[#14171d]">
                    {DESIGNER.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-stone-50">{DESIGNER.name}</div>
                    <div className="text-xs text-amber-200/70">{DESIGNER.role}</div>
                    <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-stone-400">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{DESIGNER.email}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3.5 py-2.5 text-sm text-amber-100">
                  <KeyRound className="h-4 w-4 text-amber-300" />
                  Test Password: <span className="font-mono font-semibold tracking-wider">{TEST_PASSWORD}</span>
                </div>

                <button
                  onClick={enter}
                  disabled={submitting}
                  className="group mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-4 py-3 text-sm font-semibold text-[#14171d] transition hover:from-amber-200 hover:to-amber-400 disabled:opacity-70"
                >
                  {submitting ? 'Opening console…' : '1-Click Sign In'}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone-400">
                  Designer Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-10 pr-3 text-sm text-stone-100 outline-none placeholder:text-stone-600 focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20"
                  />
                </div>

                <label htmlFor="password" className="mb-1.5 mt-4 flex items-baseline justify-between text-xs font-medium uppercase tracking-wider text-stone-400">
                  <span>Password</span>
                  <span className="font-normal normal-case tracking-normal text-amber-200/70">(Test password: {TEST_PASSWORD})</span>
                </label>
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
                    className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-10 pr-11 text-sm text-stone-100 outline-none placeholder:text-stone-600 focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20"
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
                  <div role="alert" className="mt-3 flex items-center gap-2 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="group mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-4 py-3 text-sm font-semibold text-[#14171d] transition hover:from-amber-200 hover:to-amber-400 disabled:opacity-70"
                >
                  {submitting ? 'Opening console…' : 'Sign In'}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </button>
              </form>
            )}

            <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-stone-600">
              <ShieldCheck className="h-3 w-3" /> Internal studio tool · for designers and front desk
            </p>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-6 text-center text-xs text-stone-600">
        © {new Date().getFullYear()} Aangan Studio · Pune, Maharashtra
      </footer>
    </div>
  );
}
