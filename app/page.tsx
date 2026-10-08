'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Phone, Search, Moon, Play, Pause, Clock, MapPin, Home, Ruler, IndianRupee,
  CalendarClock, ShieldCheck, Sparkles, LayoutDashboard, Database, Mail,
  CalendarCheck, CheckCircle2, CircleDashed, MinusCircle, UserCheck, Bot, User,
  AlertTriangle, ExternalLink, MessageCircle, MessageSquare, FileText, RotateCcw,
  ArrowUpCircle, Timer, PhoneCall, MapPinned, X,
} from 'lucide-react';

/* ----------------------------- Types ----------------------------- */

type Qualification = 'Qualified' | 'Nurture' | 'Out of Scope';
type FilterTab = 'all' | 'qualified' | 'after-hours';
type OutputStatus = 'delivered' | 'scheduled' | 'skipped';
type OutputKey = 'dashboard' | 'hubspot' | 'email' | 'calendar';
type FollowUpStatus = 'call-due' | 'first-touch' | 'site-visit';
type Channel = 'WhatsApp' | 'SMS';

interface TranscriptItem {
  id: string;
  speaker: 'caller' | 'agent';
  at: number; // seconds from call start
  text: string;
}

interface DossierEntities {
  propertyType: string;
  scope: string;
  carpetArea: string;
  budget: string;
  location: string;
  timeline: string;
}

interface OutputResult {
  status: OutputStatus;
  detail: string;
  syncedAt?: string;
}

interface HubspotPush {
  stage: string;
  pipelineValue: string;
  margin: string;
}

interface LookbookDispatch {
  channel: Channel;
  sentAt: string;
}

/** Snapshot taken before a manual override so the front desk can revert it. */
interface PreOverride {
  qualification: Qualification;
  outputs: Record<OutputKey, OutputResult>;
  hubspot?: HubspotPush;
  calendarSlot?: string;
  assigned: boolean;
  followUp: FollowUpStatus | null;
}

interface CallLead {
  id: string;
  callerName: string;
  phone: string;
  receivedAt: string; // ISO with +05:30 offset, studio local time
  durationSec: number;
  qualification: Qualification;
  entities: DossierEntities;
  summary: string;
  cutApplied: boolean;
  cutNote?: string;
  assigned: boolean; // assigned to the lead designer
  followUp: FollowUpStatus | null;
  calendarSlot?: string;
  lookbook?: LookbookDispatch;
  preOverride?: PreOverride;
  transcript: TranscriptItem[];
  outputs: Record<OutputKey, OutputResult>;
  hubspot?: HubspotPush;
}

/* ---------------------------- Constants -------------------------- */

const LEAD_DESIGNER = {
  name: 'Divyatej Singh',
  email: 'divyatej_singh@pg27.mesaschool.co',
  role: 'Lead Interior Designer',
};

const FOLLOW_UPS: { key: FollowUpStatus; label: string; icon: React.ReactNode; active: string }[] = [
  { key: 'call-due', label: 'Call Due in 30m', icon: <Timer className="h-3.5 w-3.5" />, active: 'bg-amber-600 text-white border-amber-600' },
  { key: 'first-touch', label: 'First Touch Completed', icon: <PhoneCall className="h-3.5 w-3.5" />, active: 'bg-emerald-600 text-white border-emerald-600' },
  { key: 'site-visit', label: 'Site Visit Booked', icon: <MapPinned className="h-3.5 w-3.5" />, active: 'bg-slate-900 text-amber-200 border-slate-900' },
];

/* ---------------------------- Mock data -------------------------- */

const INITIAL_CALLS: CallLead[] = [
  {
    id: 'c1',
    callerName: 'Rahul Deshmukh',
    phone: '+91 98230 41187',
    receivedAt: '2026-10-06T21:42:00+05:30',
    durationSec: 252,
    qualification: 'Qualified',
    entities: {
      propertyType: '3BHK, bare shell',
      scope: 'Full-home interiors (turnkey)',
      carpetArea: '1,150 sq.ft.',
      budget: '₹12L – ₹14L',
      location: 'Baner, Pune',
      timeline: 'Possession in hand; wants to start in 3–4 weeks',
    },
    summary:
      'Rahul has just taken possession of a 1,150 sq.ft. bare-shell 3BHK in Baner and wants full turnkey interiors within ₹12–14L. He is ready to start within a month and asked for a per-sq-ft rate, which Vaani declined to quote. He prefers a call after 11am on weekdays.',
    cutApplied: true,
    cutNote:
      'Caller asked twice for a fixed ₹/sq.ft. rate. Vaani explained that studio pricing is indicative only and needs a site measurement before any binding quote.',
    assigned: true,
    followUp: 'call-due',
    calendarSlot: 'Wed 7 Oct · 11:30 – 11:45 AM',
    transcript: [
      { id: 't1', speaker: 'agent', at: 2, text: 'Namaste, you have reached Aangan Studio. I am Vaani, the studio assistant. How can I help you today?' },
      { id: 't2', speaker: 'caller', at: 9, text: 'Hi, I just got possession of a flat in Baner. It is a bare shell 3BHK and I want complete interiors done.' },
      { id: 't3', speaker: 'agent', at: 19, text: 'Congratulations on the new home! Could you tell me the carpet area and roughly what budget you have in mind?' },
      { id: 't4', speaker: 'caller', at: 28, text: 'Carpet is about 1,150 square feet. We are thinking twelve to fourteen lakhs all-in.' },
      { id: 't5', speaker: 'agent', at: 40, text: 'Noted. And when would you like work to begin? Is the possession already complete?' },
      { id: 't6', speaker: 'caller', at: 49, text: 'Yes, possession is done. We want to start within three or four weeks. Before that, what is your rate per square foot?' },
      { id: 't7', speaker: 'agent', at: 62, text: 'I cannot quote a binding per-square-foot rate over the phone. Our pricing is indicative and depends on a site measurement and your material choices. Our lead designer will walk the site and give you a proper estimate.' },
      { id: 't8', speaker: 'caller', at: 80, text: 'Okay, fair enough. Just give me a ballpark so I know we are in the right range.' },
      { id: 't9', speaker: 'agent', at: 90, text: 'Projects like a 3BHK bare shell in your range are typically served within ₹12–14L, but I will not commit a number until the site is measured. Shall I book a 15-minute discovery call?' },
      { id: 't10', speaker: 'caller', at: 108, text: 'Yes please. Tomorrow after 11 works.' },
      { id: 't11', speaker: 'agent', at: 116, text: 'Done. I have held tomorrow 11:30am for you. Divyatej Singh will call you, and he will receive your details beforehand.' },
    ],
    outputs: {
      dashboard: { status: 'delivered', detail: 'Live for Front Desk & Divyatej Singh', syncedAt: '9:46 PM' },
      hubspot: { status: 'delivered', detail: 'Deal created in "Qualified – Discovery Pending"', syncedAt: '9:46 PM' },
      email: { status: 'delivered', detail: `Lead briefing dossier sent to ${LEAD_DESIGNER.email}`, syncedAt: '9:47 PM' },
      calendar: { status: 'delivered', detail: '15-min discovery hold booked: Wed 7 Oct, 11:30 AM', syncedAt: '9:47 PM' },
    },
    hubspot: { stage: 'Qualified – Discovery Pending', pipelineValue: '₹13L (midpoint)', margin: '≈ 28% est. gross margin' },
  },
  {
    id: 'c2',
    callerName: 'Sunita Bhosale',
    phone: '+91 99224 70564',
    receivedAt: '2026-10-07T11:15:00+05:30',
    durationSec: 118,
    qualification: 'Out of Scope',
    entities: {
      propertyType: '2BHK, occupied',
      scope: 'Partial kitchen repair (cabinet & countertop)',
      carpetArea: 'Kitchen only (~90 sq.ft.)',
      budget: '₹1.5L',
      location: 'Kothrud, Pune',
      timeline: 'Within 2 weeks',
    },
    summary:
      "Sunita lives in an occupied 2BHK in Kothrud and wants to repair kitchen cabinets and replace the countertop on a ₹1.5L budget. This is below the studio's full-interior minimum and is a repair job, so it was politely declined and she was pointed to a local contractor.",
    cutApplied: false,
    assigned: false,
    followUp: null,
    transcript: [
      { id: 't1', speaker: 'agent', at: 2, text: 'Namaste, this is Vaani from Aangan Studio. How may I help you?' },
      { id: 't2', speaker: 'caller', at: 8, text: 'My kitchen cabinets are damaged by moisture. I want them repaired and the countertop changed.' },
      { id: 't3', speaker: 'agent', at: 20, text: 'I am sorry to hear that. Is this the whole kitchen or a partial repair? And what budget do you have?' },
      { id: 't4', speaker: 'caller', at: 31, text: 'Only repair, nothing else in the house. Around one and a half lakh.' },
      { id: 't5', speaker: 'agent', at: 44, text: 'Thank you for being clear. Aangan Studio focuses on full-home design projects, so a partial repair would not be a good fit for us. A local carpenter or modular kitchen service in Kothrud would serve you better and faster.' },
      { id: 't6', speaker: 'caller', at: 66, text: 'Okay, understood. Thanks for telling me directly.' },
      { id: 't7', speaker: 'agent', at: 74, text: 'Of course. If you plan a larger renovation later, please call us again. Have a good day!' },
    ],
    outputs: {
      dashboard: { status: 'delivered', detail: 'Logged as Out of Scope for Front Desk', syncedAt: '11:17 AM' },
      hubspot: { status: 'skipped', detail: 'Not pushed: below minimum project scope' },
      email: { status: 'skipped', detail: 'No briefing sent: lead not qualified' },
      calendar: { status: 'skipped', detail: 'No discovery call needed' },
    },
  },
  {
    id: 'c3',
    callerName: 'Ananya Kapoor',
    phone: '+91 97657 12903',
    receivedAt: '2026-10-07T07:28:00+05:30',
    durationSec: 207,
    qualification: 'Nurture',
    entities: {
      propertyType: '2BHK, under construction',
      scope: 'Full interiors, modular + custom wardrobes',
      carpetArea: '860 sq.ft.',
      budget: '₹7L – ₹9L',
      location: 'Wakad, Pune',
      timeline: 'Possession in ~6 months (April 2027)',
    },
    summary:
      'Ananya has booked a 860 sq.ft. 2BHK in Wakad with possession about six months away and is comparing studios early. Budget is ₹7–9L for modular interiors. She is not ready for a site visit yet, so the lead is parked for a follow-up in January.',
    cutApplied: true,
    cutNote:
      'Caller asked for an "approximate price per sq.ft." Vaani declined to give a binding figure and offered a designer follow-up once the site is accessible.',
    assigned: true,
    followUp: null,
    transcript: [
      { id: 't1', speaker: 'agent', at: 2, text: 'Good morning, you have reached Aangan Studio. I am Vaani. How can I help?' },
      { id: 't2', speaker: 'caller', at: 8, text: 'Hello, I have booked a 2BHK in Wakad. Possession will be in about six months. I am just exploring interior designers.' },
      { id: 't3', speaker: 'agent', at: 21, text: 'Lovely, it is great to plan early. What is the carpet area and your approximate budget?' },
      { id: 't4', speaker: 'caller', at: 32, text: 'Around 860 square feet. Seven to nine lakhs. What would be your per square foot cost?' },
      { id: 't5', speaker: 'agent', at: 45, text: 'I cannot give a binding per-square-foot price on the phone since it depends on measurements and finishes. Our lead designer can share an indicative range once your site is accessible.' },
      { id: 't6', speaker: 'caller', at: 63, text: 'Alright. We will not be able to visit before possession, so let us talk later.' },
      { id: 't7', speaker: 'agent', at: 74, text: 'Understood. I will share your details with Divyatej Singh, who will reach out closer to possession. Is that alright?' },
      { id: 't8', speaker: 'caller', at: 88, text: 'Yes, that works. Thank you.' },
    ],
    outputs: {
      dashboard: { status: 'delivered', detail: 'Live for Front Desk & Divyatej Singh', syncedAt: '7:31 AM' },
      hubspot: { status: 'delivered', detail: 'Deal created in "Nurture – Follow up Jan 2027"', syncedAt: '7:31 AM' },
      email: { status: 'delivered', detail: `Lead briefing dossier sent to ${LEAD_DESIGNER.email}`, syncedAt: '7:32 AM' },
      calendar: { status: 'scheduled', detail: 'Discovery hold deferred; reminder set for 12 Jan 2027' },
    },
    hubspot: { stage: 'Nurture – Follow up Jan 2027', pipelineValue: '₹8L (midpoint)', margin: '≈ 24% est. gross margin' },
  },
  {
    id: 'c4',
    callerName: 'Mihir & Prachi Gadgil',
    phone: '+91 98900 33621',
    receivedAt: '2026-10-07T15:05:00+05:30',
    durationSec: 301,
    qualification: 'Qualified',
    entities: {
      propertyType: '4BHK duplex, semi-furnished',
      scope: 'Premium interiors + living/dining redesign',
      carpetArea: '2,100 sq.ft.',
      budget: '₹35L – ₹45L',
      location: 'Koregaon Park, Pune',
      timeline: 'Ready to start next month',
    },
    summary:
      'The Gadgils own a 2,100 sq.ft. duplex in Koregaon Park and want a premium redesign of living areas and bedrooms within ₹35–45L, starting next month. They want a site visit this week.',
    cutApplied: false,
    assigned: true,
    followUp: 'first-touch',
    calendarSlot: 'Thu 8 Oct · 4:00 – 4:15 PM',
    transcript: [
      { id: 't1', speaker: 'agent', at: 2, text: 'Namaste, Aangan Studio, Vaani speaking. How may I help you?' },
      { id: 't2', speaker: 'caller', at: 8, text: 'We own a duplex in Koregaon Park and want a premium redesign. About 2,100 square feet.' },
      { id: 't3', speaker: 'agent', at: 20, text: 'Wonderful. What budget range and timeline are you thinking?' },
      { id: 't4', speaker: 'caller', at: 29, text: 'Thirty-five to forty-five lakhs, and we would like to start next month.' },
      { id: 't5', speaker: 'agent', at: 41, text: 'Great. I will book a 15-minute discovery call with Divyatej Singh, our lead designer. Does Thursday at 4pm work?' },
      { id: 't6', speaker: 'caller', at: 55, text: 'Thursday 4pm is perfect.' },
    ],
    outputs: {
      dashboard: { status: 'delivered', detail: 'Live for Front Desk & Divyatej Singh', syncedAt: '3:09 PM' },
      hubspot: { status: 'delivered', detail: 'Deal created in "Qualified – Discovery Booked"', syncedAt: '3:09 PM' },
      email: { status: 'delivered', detail: `Lead briefing dossier sent to ${LEAD_DESIGNER.email}`, syncedAt: '3:10 PM' },
      calendar: { status: 'delivered', detail: '15-min discovery hold booked: Thu 8 Oct, 4:00 PM', syncedAt: '3:10 PM' },
    },
    hubspot: { stage: 'Qualified – Discovery Booked', pipelineValue: '₹40L (midpoint)', margin: '≈ 31% est. gross margin' },
  },
];

/* ---------------------------- Helpers ---------------------------- */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Parse straight from the ISO string so studio local time is shown regardless of viewer timezone.
function parseLocal(iso: string) {
  const [d, t] = iso.split('T');
  const [y, m, day] = d.split('-').map(Number);
  const [hh, mm] = t.slice(0, 5).split(':').map(Number);
  return { y, m, day, hh, mm };
}

function formatTime(iso: string) {
  const { hh, mm } = parseLocal(iso);
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${hh >= 12 ? 'PM' : 'AM'}`;
}

function formatDate(iso: string) {
  const { m, day } = parseLocal(iso);
  return `${day} ${MONTHS[m - 1]}`;
}

function isAfterHours(iso: string) {
  const { hh } = parseLocal(iso);
  return hh < 10 || hh >= 19;
}

function formatClock(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function nowLabel() {
  return new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

const QUAL_STYLES: Record<Qualification, string> = {
  Qualified: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Nurture: 'bg-amber-50 text-amber-800 ring-amber-200',
  'Out of Scope': 'bg-slate-100 text-slate-600 ring-slate-300',
};

/* ---------------------------- Components ------------------------- */

function QualBadge({ q }: { q: Qualification }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${QUAL_STYLES[q]}`}>
      {q}
    </span>
  );
}

function AfterHoursTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-amber-100">
      <Moon className="h-3 w-3" /> Outside 10am–7pm
    </span>
  );
}

function EntityCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-stone-500">
        <span className="text-amber-700">{icon}</span>
        {label}
      </div>
      <div className="text-sm font-semibold leading-snug text-slate-900">{value}</div>
    </div>
  );
}

const OUTPUT_META: Record<OutputKey, { title: string; sub: string; icon: React.ReactNode }> = {
  dashboard: { title: 'Operational Dashboard', sub: 'Live synced for Front Desk & Divyatej Singh', icon: <LayoutDashboard className="h-4 w-4" /> },
  hubspot: { title: 'HubSpot CRM', sub: 'Deal stage, pipeline value & unit economics for Nikhil', icon: <Database className="h-4 w-4" /> },
  email: { title: 'Designer Email', sub: `Lead briefing dossier to ${LEAD_DESIGNER.email}`, icon: <Mail className="h-4 w-4" /> },
  calendar: { title: 'Calendar Hold', sub: `15-min discovery hold on ${LEAD_DESIGNER.email}`, icon: <CalendarCheck className="h-4 w-4" /> },
};

function StatusPill({ status }: { status: OutputStatus }) {
  if (status === 'delivered')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-4 w-4" /> Delivered
      </span>
    );
  if (status === 'scheduled')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
        <CircleDashed className="h-4 w-4" /> Scheduled
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
      <MinusCircle className="h-4 w-4" /> Skipped
    </span>
  );
}

/* ------------------------------ Page ----------------------------- */

export default function CallConsolePage() {
  const [calls, setCalls] = useState<CallLead[]>(INITIAL_CALLS);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_CALLS[0].id);
  const [tab, setTab] = useState<FilterTab>('all');
  const [query, setQuery] = useState('');
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [calendarPreview, setCalendarPreview] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const selected = calls.find((c) => c.id === selectedId) ?? calls[0];
  const afterHours = isAfterHours(selected.receivedAt);
  const hasCalendarHold = selected.outputs.calendar.status === 'delivered' && !!selected.calendarSlot;
  const canSendLookbook = selected.qualification !== 'Out of Scope';

  const visibleCalls = useMemo(() => {
    const q = query.trim().toLowerCase();
    return calls
      .filter((c) => {
        if (tab === 'qualified' && c.qualification !== 'Qualified') return false;
        if (tab === 'after-hours' && !isAfterHours(c.receivedAt)) return false;
        if (!q) return true;
        return (
          c.callerName.toLowerCase().includes(q) ||
          c.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
          c.entities.location.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  }, [calls, tab, query]);

  function updateSelected(patch: (c: CallLead) => CallLead) {
    setCalls((prev) => prev.map((c) => (c.id === selectedId ? patch(c) : c)));
  }

  function notify(message: string) {
    setToast(message);
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Reset playback and transient UI when switching calls.
  useEffect(() => {
    setPlaying(false);
    setPosition(0);
    setCalendarPreview(false);
  }, [selectedId]);

  // Mock playback clock.
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setPosition((p) => {
        if (p + 1 >= selected.durationSec) {
          setPlaying(false);
          return selected.durationSec;
        }
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [playing, selected.durationSec]);

  // Active transcript line follows the playhead.
  const activeId = useMemo(() => {
    let id: string | null = null;
    for (const item of selected.transcript) if (item.at <= position) id = item.id;
    return id;
  }, [selected, position]);

  useEffect(() => {
    if (!playing || !activeId) return;
    transcriptRef.current
      ?.querySelector<HTMLElement>(`[data-id="${activeId}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeId, playing]);

  function togglePlay() {
    if (position >= selected.durationSec) setPosition(0);
    setPlaying((p) => !p);
  }

  /* ---- Operational actions ---- */

  function sendLookbook(channel: Channel) {
    updateSelected((c) => ({ ...c, lookbook: { channel, sentAt: nowLabel() } }));
    notify(`Lookbook PDF sent to ${selected.callerName} via ${channel}`);
  }

  function setFollowUp(status: FollowUpStatus) {
    updateSelected((c) => ({ ...c, followUp: c.followUp === status ? null : status }));
  }

  function requalify() {
    const at = nowLabel();
    updateSelected((c) => {
      const mid = c.entities.budget;
      return {
        ...c,
        preOverride: {
          qualification: c.qualification,
          outputs: c.outputs,
          hubspot: c.hubspot,
          calendarSlot: c.calendarSlot,
          assigned: c.assigned,
          followUp: c.followUp,
        },
        qualification: 'Qualified',
        assigned: true,
        followUp: 'call-due',
        calendarSlot: 'Next free slot · Tomorrow 11:00 – 11:15 AM',
        hubspot: {
          stage: 'Qualified – Manual Override',
          pipelineValue: c.hubspot?.pipelineValue ?? `${mid} (to be refined)`,
          margin: c.hubspot?.margin ?? 'Unit economics pending site measurement',
        },
        outputs: {
          dashboard: { status: 'delivered', detail: 'Re-qualified by Front Desk; live for Divyatej Singh', syncedAt: at },
          hubspot: { status: 'delivered', detail: 'Deal moved to "Qualified – Manual Override"', syncedAt: at },
          email: { status: 'delivered', detail: `Lead briefing dossier sent to ${LEAD_DESIGNER.email}`, syncedAt: at },
          calendar: { status: 'delivered', detail: '15-min discovery hold booked: tomorrow, 11:00 AM', syncedAt: at },
        },
      };
    });
    notify('Marked Qualified. HubSpot, briefing email and calendar hold dispatched.');
  }

  function revertOverride() {
    updateSelected((c) => {
      const p = c.preOverride;
      if (!p) return c;
      return {
        ...c,
        qualification: p.qualification,
        outputs: p.outputs,
        hubspot: p.hubspot,
        calendarSlot: p.calendarSlot,
        assigned: p.assigned,
        followUp: p.followUp,
        preOverride: undefined,
      };
    });
    setCalendarPreview(false);
    notify('Override reverted to the AI qualification.');
  }

  const pct = selected.durationSec ? (position / selected.durationSec) * 100 : 0;

  return (
    <div className="flex h-screen flex-col bg-stone-50 text-slate-800 md:flex-row">
      {/* ------------------------- Sidebar ------------------------- */}
      <aside className="flex max-h-[45vh] w-full shrink-0 flex-col border-b border-stone-200 bg-white md:max-h-none md:w-[360px] md:border-b-0 md:border-r">
        <div className="border-b border-stone-200 px-4 pb-3 pt-4">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-amber-300">
              <Phone className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-tight text-slate-900">Aangan Studio</h1>
              <p className="text-xs text-stone-500">Vaani · Call Console</p>
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, phone or locality"
              className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-stone-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <div className="mt-3 flex gap-1 rounded-lg bg-stone-100 p-1">
            {([
              ['all', 'All Calls'],
              ['qualified', 'Qualified'],
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

        <ul className="flex-1 divide-y divide-stone-100 overflow-y-auto">
          {visibleCalls.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-stone-500">No calls match this filter.</li>
          )}
          {visibleCalls.map((c) => {
            const active = c.id === selectedId;
            return (
              <li key={c.id}>
                <button
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full border-l-[3px] px-4 py-3 text-left transition ${
                    active ? 'border-amber-600 bg-amber-50/60' : 'border-transparent hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900">{c.callerName}</span>
                    <span className="shrink-0 text-xs text-stone-500">
                      {formatDate(c.receivedAt)}, {formatTime(c.receivedAt)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-stone-500">
                    <span>{c.phone}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatClock(c.durationSec)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <QualBadge q={c.qualification} />
                    {isAfterHours(c.receivedAt) && <AfterHoursTag />}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-stone-200 px-4 py-2.5 text-xs text-stone-500">
          {calls.filter((c) => isAfterHours(c.receivedAt)).length} of {calls.length} calls arrived after hours
        </div>
      </aside>

      {/* --------------------------- Main -------------------------- */}
      <main className="relative flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-4 md:p-6">
          {/* Header */}
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold text-slate-900">{selected.callerName}</h2>
                <QualBadge q={selected.qualification} />
                {selected.preOverride && (
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-amber-200">
                    Manual override
                  </span>
                )}
                {afterHours && <AfterHoursTag />}
              </div>
              <p className="mt-1 text-sm text-stone-500">
                {selected.phone} · {formatDate(selected.receivedAt)}, {formatTime(selected.receivedAt)} · {formatClock(selected.durationSec)} call
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                <UserCheck className="h-4 w-4" />
              </div>
              <div className="text-sm leading-tight">
                <div className="text-[11px] font-medium uppercase tracking-wide text-stone-500">
                  {selected.assigned ? 'Assigned to' : 'Unassigned'}
                </div>
                <div className="font-semibold text-slate-900">
                  {selected.assigned ? LEAD_DESIGNER.name : 'Not routed to a designer'}
                </div>
                {selected.assigned && <div className="text-xs text-stone-500">{LEAD_DESIGNER.role}</div>}
              </div>
            </div>
          </header>

          {/* Audio player */}
          <section className="mt-5 rounded-2xl bg-slate-900 p-4 text-slate-100 shadow-sm">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                aria-label={playing ? 'Pause recording' : 'Play recording'}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-400 text-slate-900 transition hover:bg-amber-300"
              >
                {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-[1px]" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
                  <span>Call recording</span>
                  <span className="tabular-nums">
                    {formatClock(position)} / {formatClock(selected.durationSec)}
                  </span>
                </div>
                <div className="relative h-5">
                  <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-700">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={selected.durationSec}
                    value={position}
                    onChange={(e) => setPosition(Number(e.target.value))}
                    aria-label="Seek recording"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                  <div
                    className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-900 bg-amber-300"
                    style={{ left: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Action bar */}
          <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Follow-up SLA */}
              <div>
                <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-stone-500">Designer follow-up status</h3>
                <div className="flex flex-wrap gap-2">
                  {FOLLOW_UPS.map((f) => {
                    const on = selected.followUp === f.key;
                    return (
                      <button
                        key={f.key}
                        disabled={!selected.assigned}
                        onClick={() => setFollowUp(f.key)}
                        aria-pressed={on}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                          on ? f.active : 'border-stone-300 bg-white text-slate-700 hover:border-amber-400'
                        }`}
                      >
                        {f.icon}
                        {f.label}
                      </button>
                    );
                  })}
                </div>
                {!selected.assigned && (
                  <p className="mt-1.5 text-xs text-stone-500">Available once the lead is qualified and routed to Divyatej.</p>
                )}
              </div>

              {/* Lookbook dispatch */}
              <div>
                <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-stone-500">Send lookbook while discovery call is pending</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    disabled={!canSendLookbook}
                    onClick={() => sendLookbook('WhatsApp')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </button>
                  <button
                    disabled={!canSendLookbook}
                    onClick={() => sendLookbook('SMS')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> SMS
                  </button>
                  <span className="inline-flex items-center gap-1 text-xs text-stone-500">
                    <FileText className="h-3.5 w-3.5" /> Aangan-Lookbook.pdf
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-stone-500">
                  {selected.lookbook
                    ? `Sent via ${selected.lookbook.channel} at ${selected.lookbook.sentAt} to ${selected.phone}`
                    : canSendLookbook
                    ? `Will be sent to ${selected.phone}`
                    : 'Disabled for Out of Scope calls. Re-qualify to enable.'}
                </p>
              </div>
            </div>

            {/* Override + calendar */}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
              {selected.preOverride ? (
                <button
                  onClick={revertOverride}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-amber-400"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Revert to {selected.preOverride.qualification}
                </button>
              ) : selected.qualification !== 'Qualified' ? (
                <button
                  onClick={requalify}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-amber-700"
                >
                  <ArrowUpCircle className="h-3.5 w-3.5" /> Re-qualify as Qualified (caller called back with new scope)
                </button>
              ) : null}

              {hasCalendarHold && (
                <button
                  onClick={() => setCalendarPreview(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-amber-100 transition hover:bg-slate-800"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View in Google Calendar ({LEAD_DESIGNER.email})
                </button>
              )}
            </div>

            {calendarPreview && selected.calendarSlot && (
              <div className="mt-3 flex items-start justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3">
                <div className="flex items-start gap-3">
                  <CalendarCheck className="mt-0.5 h-5 w-5 text-amber-700" />
                  <div className="text-sm">
                    <div className="font-semibold text-amber-900">Discovery call · {selected.callerName}</div>
                    <div className="text-amber-900/80">{selected.calendarSlot}</div>
                    <div className="text-xs text-amber-900/70">
                      Calendar: {LEAD_DESIGNER.email} · {selected.entities.location} · {selected.phone}
                    </div>
                    <div className="mt-1 text-xs text-amber-800/70">Simulated: this would open the event in Google Calendar.</div>
                  </div>
                </div>
                <button onClick={() => setCalendarPreview(false)} aria-label="Close calendar preview" className="text-amber-800 hover:text-amber-950">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </section>

          {/* Two-column layout */}
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {/* Left: Dossier */}
            <div className="space-y-5">
              {selected.cutApplied && (
                <div className="rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-amber-900">The Cut · Guardrail held</h3>
                        <span className="rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          No binding price quoted
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-amber-900/80">{selected.cutNote}</p>
                      <p className="mt-2 text-xs text-amber-800/70">
                        Studio policy: pricing is indicative only and requires site measurement.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <section className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-700" />
                  <h3 className="text-sm font-semibold text-slate-900">AI Context Summary</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-700">{selected.summary}</p>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-stone-500">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Already covered on the call. No need to re-ask these on your first touch.
                </p>
              </section>

              <section>
                <h3 className="mb-2.5 text-sm font-semibold text-slate-900">Lead Dossier</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <EntityCard icon={<Home className="h-3.5 w-3.5" />} label="Property Type & Scope" value={`${selected.entities.propertyType} · ${selected.entities.scope}`} />
                  <EntityCard icon={<Ruler className="h-3.5 w-3.5" />} label="Carpet Area" value={selected.entities.carpetArea} />
                  <EntityCard icon={<IndianRupee className="h-3.5 w-3.5" />} label="Target Budget" value={selected.entities.budget} />
                  <EntityCard icon={<MapPin className="h-3.5 w-3.5" />} label="Site Location" value={selected.entities.location} />
                  <div className="sm:col-span-2">
                    <EntityCard icon={<CalendarClock className="h-3.5 w-3.5" />} label="Possession / Timeline" value={selected.entities.timeline} />
                  </div>
                </div>
              </section>
            </div>

            {/* Right: Transcript + Outputs */}
            <div className="space-y-5">
              <section className="rounded-2xl border border-stone-200 bg-white">
                <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
                  <h3 className="text-sm font-semibold text-slate-900">Call Transcript</h3>
                  <span className="text-xs text-stone-500">Click a message to jump to it</span>
                </div>
                <div ref={transcriptRef} className="max-h-[420px] space-y-3 overflow-y-auto p-4">
                  {selected.transcript.map((t) => {
                    const agent = t.speaker === 'agent';
                    const active = t.id === activeId;
                    return (
                      <div key={t.id} data-id={t.id} className={`flex gap-2.5 ${agent ? '' : 'flex-row-reverse'}`}>
                        <div
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                            agent ? 'bg-slate-900 text-amber-300' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {agent ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        </div>
                        <button
                          onClick={() => setPosition(t.at)}
                          className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-left text-sm leading-relaxed transition ${
                            agent ? 'rounded-tl-sm bg-stone-100 text-slate-800' : 'rounded-tr-sm bg-amber-50 text-slate-800'
                          } ${active ? 'ring-2 ring-amber-500' : 'ring-1 ring-transparent hover:ring-stone-300'}`}
                        >
                          <div className="mb-0.5 flex items-center gap-2 text-[11px] font-medium text-stone-500">
                            <span>{agent ? 'Agent (Vaani)' : 'Caller'}</span>
                            <span className="tabular-nums">{formatClock(t.at)}</span>
                          </div>
                          {t.text}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-stone-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Automation Outputs</h3>
                <ul className="space-y-2.5">
                  {(Object.keys(OUTPUT_META) as OutputKey[]).map((key, i) => {
                    const meta = OUTPUT_META[key];
                    const out = selected.outputs[key];
                    return (
                      <li key={key} className="flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50/60 p-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            out.status === 'skipped' ? 'bg-stone-200 text-stone-500' : 'bg-slate-900 text-amber-300'
                          }`}
                        >
                          {meta.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-x-3">
                            <span className="text-sm font-semibold text-slate-900">
                              {i + 1}. {meta.title}
                            </span>
                            <StatusPill status={out.status} />
                          </div>
                          <p className="break-words text-xs text-stone-500">{meta.sub}</p>
                          <p className="mt-1 break-words text-xs text-slate-700">
                            {out.detail}
                            {out.syncedAt && <span className="text-stone-400"> · {out.syncedAt}</span>}
                          </p>
                          {key === 'hubspot' && selected.hubspot && out.status === 'delivered' && (
                            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                              <span className="rounded-md bg-white px-2 py-0.5 ring-1 ring-stone-200">Stage: {selected.hubspot.stage}</span>
                              <span className="rounded-md bg-white px-2 py-0.5 ring-1 ring-stone-200">Pipeline: {selected.hubspot.pipelineValue}</span>
                              <span className="rounded-md bg-white px-2 py-0.5 ring-1 ring-stone-200">{selected.hubspot.margin}</span>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>
          </div>
        </div>

        {toast && (
          <div
            role="status"
            className="fixed bottom-5 left-1/2 z-50 flex max-w-[90vw] -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm text-amber-50 shadow-lg"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            {toast}
          </div>
        )}
      </main>
    </div>
  );
}
