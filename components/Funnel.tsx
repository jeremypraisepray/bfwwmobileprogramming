'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import Image from 'next/image';
import { getAttribution, wasNewPaidClick } from '@/lib/attribution';
import {
  BUSINESS,
  CLAIM_FINANCING,
  CLAIM_SHINGLES,
  CLAIM_WARRANTY,
  CLAIM_WARRANTY_SHORT,
  CONSENT_PRIVACY_URL,
  CONSENT_TERMS_URL,
  CONSENT_TEXT,
  CONSENT_TEXT_VERSION,
  CRED_24H,
  CRED_BBB,
  CRED_BBB_SHORT,
  CRED_FREE,
  CRED_GOOGLE,
  CRED_GOOGLE_SHORT,
  CRED_INSURED,
  CRED_OWENS_CORNING,
  CRED_OWENS_CORNING_SHORT,
  CRED_ROOFS,
  CRED_ROOFS_SHORT,
  CRED_SINCE,
  CRED_YEARS,
  FINANCING_DISCLAIMER,
  FINANCING_EXAMPLE,
  HERO_KICKER,
  LOGO_AMR,
  LOGO_BBB,
  LOGO_GOOGLE,
  LOGO_OWENS_CORNING,
  OFFER_DOWN,
  OFFER_MONTHLY,
  PRICE_FROM,
  PRICE_QUALIFIER,
} from '@/lib/claims';
import { fireGoogleAdsConversion } from '@/lib/googleAds';
import { fireLead, newEventId, trackFunnelStep, trackViewContent } from '@/lib/metaPixel';
import { fireTikTokLead } from '@/lib/tiktokPixel';

/* ---------------------------------------------------------------------------
   AMR Free Roof Inspection Funnel
   One client component holds all funnel state. Desktop keeps the side photo
   panel; on phones each step opens with a full-bleed photo header carrying the
   question, and the step sits on a sheet sized to fit one screen without
   scrolling. Responsive layout and component styling live in globals.css.
--------------------------------------------------------------------------- */

// Fonts (loaded via next/font/google in app/layout.tsx, exposed as CSS vars).
const FONT_BODY = 'var(--font-barlow), sans-serif';
const FONT_COND = 'var(--font-barlow-condensed), sans-serif';
const FONT_MONO = 'var(--font-plex-mono), monospace';

// Business constants — single source of truth lives in lib/claims.ts.
const BIZ_PHONE = BUSINESS.phoneDisplay;
const BIZ_PHONE_HREF = BUSINESS.phoneHref;
const KEN_BURNS = true;

const DRAFT_KEY = 'amr-funnel-draft';

type State = {
  screen: number; // 1..5 = steps (1 Concern, 2 Contact, 3 Timing, 4 Address, 5 Offers)
  submitted: boolean;
  concern: string | null;
  timing: string | null;
  address: string;
  city: string;
  zip: string;
  offers: string[];
  first: string;
  last: string;
  phone: string;
  email: string;
  company: string; // honeypot — never persisted, never shown
  consentAt: string; // ISO timestamp when the TCPA box was checked ('' = unchecked); never persisted
  error: string;
  submitting: boolean;
};

const INITIAL: State = {
  screen: 1,
  submitted: false,
  concern: null,
  timing: null,
  address: '',
  city: '',
  zip: '',
  offers: [],
  first: '',
  last: '',
  phone: '',
  email: '',
  company: '',
  consentAt: '',
  error: '',
  submitting: false,
};

// Subset of state persisted to the localStorage draft.
type Draft = Pick<
  State,
  'screen' | 'concern' | 'timing' | 'address' | 'city' | 'zip' | 'offers' | 'first' | 'last' | 'phone' | 'email'
>;

function persist(s: State) {
  try {
    const draft: Draft = {
      screen: s.screen,
      concern: s.concern,
      timing: s.timing,
      address: s.address,
      city: s.city,
      zip: s.zip,
      offers: s.offers,
      first: s.first,
      last: s.last,
      phone: s.phone,
      email: s.email,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

const CONCERNS = [
  'Active leak or water stain',
  'Missing or damaged shingles',
  'Roof is getting older',
  'Buying or selling a home',
  'General inspection',
  "I'm not sure",
];

const TIMINGS = [
  'As soon as possible',
  'Within the next few days',
  'Within 1–2 weeks',
  "I'm gathering information",
];

const OFFERS = [
  '$0-down financing',
  'No-interest payment options',
  '50-year warranty protection',
  'Veteran or military discount',
  'First responder discount',
  'Teacher discount',
  'Homeowner age 55+ discount',
  "I'm not sure yet",
];


// Per-slot photo caption metadata for the desktop panel (index = screen; 6 = confirmation).
type Meta = { label: string; tag: string };
const DESKTOP_META: Meta[] = [
  { label: 'VERIFIED GOOGLE REVIEW · 5 STARS', tag: 'HOUSTON, TX' },
  { label: 'INSPECTION PHOTO · RIDGE VENT', tag: 'DOCUMENTED' },
  { label: 'FIELD DETAIL · FLASHING & RIDGE', tag: 'CRAFTSMANSHIP' },
  { label: 'COMPLETED SYSTEM · AERIAL', tag: 'DOCUMENTED' },
  { label: 'JOB SITE · $0 DOWN FINANCING', tag: 'HOUSTON, TX' },
  { label: 'COMPLETED SYSTEM · DETAIL', tag: 'HOUSTON, TX' },
  { label: 'BEFORE / AFTER · FULL REPLACEMENT', tag: 'THANK YOU' },
];

// Desktop photo panel layers (hidden on phones, where the step header takes over).
type Layer = { slot: number; src: string; alt: string; fit: 'cover' | 'contain'; pos?: string };
const LAYERS: Layer[] = [
  { slot: 1, src: '/assets/roof-ridge.webp', alt: 'Ridge vent and shingles photographed during a roof inspection', fit: 'cover' },
  { slot: 2, src: '/assets/flashing.webp', alt: 'Roofer securing new flashing along a shingle ridge', fit: 'cover' },
  { slot: 3, src: '/assets/aerial.webp', alt: 'Aerial view of a completed American Master Roofing shingle roof', fit: 'contain' },
  { slot: 4, src: '/assets/yard-sign.webp', alt: 'Job site with $0-down financing yard sign in front of a re-roof in progress', fit: 'cover' },
  { slot: 5, src: '/assets/finished-roof.webp', alt: 'Completed premium roof, dormer and copper detail', fit: 'cover', pos: '82% center' },
  { slot: 6, src: '/assets/before-after.webp', alt: 'Before and after of a completed full roof replacement', fit: 'contain' },
];

const PHOTO_SIZES = '45vw';

// Phone step headers — graded crops, one per step (6 = confirmation). All are
// stacked in the header and cross-fade, so the next step's photo is already
// loaded by the time it's needed.
const MOBILE_HEROES: { slot: number; src: string; alt: string; pos: string }[] = [
  { slot: 1, src: '/assets/hdr-concern.webp', alt: 'American Master Roofing crew re-roofing a Houston home', pos: '62% 30%' },
  { slot: 2, src: '/assets/hdr-contact.webp', alt: 'The American Master Roofing team on a Houston job site', pos: '50% 35%' },
  { slot: 3, src: '/assets/hdr-timing.webp', alt: 'An American Master Roofing inspector walking a property with the homeowner', pos: '42% 40%' },
  { slot: 4, src: '/assets/hdr-address.webp', alt: 'Aerial view of a completed shingle roof', pos: '50% 50%' },
  { slot: 5, src: '/assets/hdr-offers.webp', alt: 'Roofer securing new flashing on a shingle roof', pos: '50% 45%' },
  { slot: 6, src: '/assets/hdr-done.webp', alt: 'Homeowners in front of their new roof', pos: '50% 30%' },
];

const HERO_KICKERS: Record<number, string> = {
  2: 'Step 2 of 5 · Meet your Houston team',
  3: 'Step 3 of 5 · We walk it with you',
  4: 'Step 4 of 5 · We study your roofline first',
  5: `Step 5 of 5 · Backed by a ${CLAIM_WARRANTY_SHORT}`,
  6: 'Another happy homeowner · Houston',
};

const STEP_Q: Record<number, string> = {
  1: 'What’s going on with your roof?',
  2: 'Who’s the inspection for?',
  3: 'When should we come out?',
  4: 'Where’s the property?',
  5: 'Anything we should cover?',
};

// Line icons for the concern tiles (keyed by the exact answer label).
const svgProps = {
  viewBox: '0 0 24 24',
  width: 20,
  height: 20,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};
const CONCERN_ICONS: Record<string, JSX.Element> = {
  'Active leak or water stain': (
    <svg {...svgProps}>
      <path d="M12 3.2c3 4.1 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 3-6.9 6-11z" />
      <path d="M9.4 15.3a2.8 2.8 0 0 0 2.4 2.3" />
    </svg>
  ),
  'Missing or damaged shingles': (
    <svg {...svgProps}>
      <rect x="3" y="4.5" width="8" height="5.5" rx="1" />
      <rect x="13" y="4.5" width="8" height="5.5" rx="1" />
      <rect x="3" y="12.5" width="8" height="5.5" rx="1" />
      <rect x="13.5" y="13.8" width="8" height="5.5" rx="1" transform="rotate(14 17.5 16.5)" />
    </svg>
  ),
  'Roof is getting older': (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3.2 2" />
    </svg>
  ),
  'Buying or selling a home': (
    <svg {...svgProps}>
      <path d="M3.5 11 12 4.5l8.5 6.5V20h-17z" />
      <path d="M9.8 20v-5.2h4.4V20" />
    </svg>
  ),
  'General inspection': (
    <svg {...svgProps}>
      <rect x="5.5" y="4.5" width="13" height="16" rx="2" />
      <path d="M9 4.5h6v3H9z" />
      <path d="m9 13.5 2.2 2.2 4-4.2" />
    </svg>
  ),
  "I'm not sure": (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.6" />
      <circle cx="12" cy="16.6" r="0.6" fill="currentColor" />
    </svg>
  ),
};

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinejoin="round" aria-hidden>
    <path d="M6.6 3.5h3l1.5 4-2 1.3a11 11 0 0 0 5.2 5.2l1.3-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.6 5.5a2 2 0 0 1 2-2z" />
  </svg>
);
const CheckIcon = ({ size = 11 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
const PinIcon = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
    <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.3" fill="currentColor" stroke="none" />
  </svg>
);

// Credential logos: a file that fails to load hides itself rather than
// rendering broken; the claim wording is always DOM text.
const hideOnError = (e: { currentTarget: HTMLImageElement }) => {
  e.currentTarget.style.display = 'none';
};

export default function Funnel() {
  const [s, setS] = useState<State>(INITIAL);

  // Brief "picking up where you left off" indicator for organic resumes.
  const [resumeNotice, setResumeNotice] = useState(false);

  // Guards the one-time "first-touch" lead capture at Step 2 so we don't
  // re-fire it if the user steps back and forward again.
  const capturedRef = useRef(false);

  // save = setState + persist the draft (mirrors the prototype's save()).
  const save = useCallback((patch: Partial<State>) => {
    setS((prev) => {
      const next = { ...prev, ...patch };
      persist(next);
      return next;
    });
  }, []);

  // Restore draft on mount (client-only; avoids hydration mismatch).
  // A fresh Google click id (new paid session) resets the funnel to Step 1
  // instead of resuming mid-form; typed answers are kept so a returning
  // visitor's fields are still prefilled. Organic returners resume where they
  // left off with a brief notice.
  useEffect(() => {
    try {
      const freshPaidClick = wasNewPaidClick();
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && typeof d === 'object') {
          if (freshPaidClick) {
            setS((prev) => {
              const next = { ...prev, ...d, screen: 1, submitted: false, error: '', submitting: false };
              persist(next); // stick to Step 1 on any refresh of this session
              return next;
            });
          } else {
            // Clamp screen into the valid step range (old drafts may hold 0).
            const screen = Math.min(5, Math.max(1, Number(d.screen) || 1));
            setS((prev) => ({ ...prev, ...d, screen, submitted: false, error: '', submitting: false }));
            if (screen > 1) {
              setResumeNotice(true);
              setTimeout(() => setResumeNotice(false), 4500);
            }
          }
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Capture campaign attribution on first load (persists across the flow),
  // and fire ViewContent for the landing view (step 1).
  useEffect(() => {
    getAttribution();
    trackViewContent('Free Roof Inspection Funnel');
  }, []);

  // Credential logos that 404'd before hydration never fire onError — sweep
  // and hide any already-failed image so a missing file can't render broken.
  useEffect(() => {
    document.querySelectorAll<HTMLImageElement>('img[data-cred-logo]').forEach((img) => {
      if (img.complete && img.naturalWidth === 0) img.style.display = 'none';
    });
  }, [s.screen, s.submitted]);

  const activeIdx = s.submitted ? 6 : s.screen;
  const urgent = s.concern === 'Active leak or water stain';

  // ---- Field setters ----
  const set = (field: keyof State) => (e: { target: { value: string } }) =>
    save({ [field]: e.target.value, error: '' } as Partial<State>);

  // ---- Navigation ----
  // Flow: 1 Concern → 2 Contact → 3 Timing → 4 Address → 5 Offers → submit.
  const back = () => save({ screen: Math.max(1, s.screen - 1), error: '' });

  const selectSingle = (field: 'concern' | 'timing', label: string, next: number) => {
    save({ [field]: label, error: '' } as Partial<State>);
    trackFunnelStep(next);
    setTimeout(() => save({ screen: next }), 240);
  };

  const toggleOffer = (label: string) => {
    const sel = s.offers.includes(label);
    save({ offers: sel ? s.offers.filter((o) => o !== label) : s.offers.concat(label), error: '' });
  };

  const contactValid = () =>
    !!s.first.trim() &&
    !!s.last.trim() &&
    s.phone.replace(/\D/g, '').length >= 10 &&
    /^\S+@\S+\.\S+$/.test(s.email.trim());

  // Build the lead payload sent to /api/lead. `stage` distinguishes the early
  // first-touch capture ('contact') from the completed submission ('complete').
  const buildPayload = (stage: 'contact' | 'complete', eventId?: string) => ({
    first: s.first,
    last: s.last,
    phone: s.phone,
    email: s.email,
    address: s.address,
    city: s.city,
    zip: s.zip,
    concern: s.concern,
    timing: s.timing,
    offers: s.offers,
    urgentLeak: urgent,
    stage,
    hp_field: s.company, // honeypot (field renamed so autofill can't match it)
    // TCPA consent record — version string pairs with CONSENT_TEXT in lib/claims.ts.
    consent_given: !!s.consentAt,
    consent_timestamp: s.consentAt,
    consent_text_version: CONSENT_TEXT_VERSION,
    consent_page_url: typeof window !== 'undefined' ? window.location.href : '',
    ...getAttribution(), // utm_*, fbclid, fbp, fbc
    ...(eventId ? { fb_event_id: eventId } : {}),
  });

  const postLead = (stage: 'contact' | 'complete', eventId?: string) =>
    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(stage, eventId)),
    });

  // Step 2 — validate contact fields, fire the first-touch capture, advance.
  const nextContact = () => {
    if (!s.first.trim()) return save({ error: 'Please enter your first name.' });
    if (!s.last.trim()) return save({ error: 'Please enter your last name.' });
    if (s.phone.replace(/\D/g, '').length < 10) return save({ error: 'Please enter a valid mobile phone number.' });
    if (!/^\S+@\S+\.\S+$/.test(s.email.trim())) return save({ error: 'Please enter a valid email address.' });
    // TCPA: the button is disabled until checked; this guards Enter-key submits too.
    if (!s.consentAt) return save({ error: 'Please check the consent box above the button so we can contact you.' });

    // Fire-and-forget: capture the lead now so it isn't lost if they drop off.
    // Sent once per session; the final submit updates the same contact in GHL.
    if (!capturedRef.current) {
      capturedRef.current = true;
      postLead('contact').catch(() => {
        /* best-effort; the final submit will still create the lead */
      });
    }
    trackFunnelStep(3);
    save({ screen: 3, error: '' });
  };

  // Step 4 — validate address before advancing.
  const nextAddress = () => {
    if (s.address.trim().length < 5) return save({ error: 'Please enter your street address.' });
    if (!/^\d{5}$/.test(s.zip.trim())) return save({ error: 'Please enter a valid 5-digit ZIP code.' });
    trackFunnelStep(5);
    save({ screen: 5, error: '' });
  };

  // Final step — send the complete lead and show confirmation on success.
  const submit = async () => {
    if (!contactValid()) return save({ error: 'Please go back and complete your contact details.' });

    const eventId = newEventId(); // generated at submission time; sent to GHL + used for Lead dedup

    // Fire the browser Lead immediately, independent of the network result — a
    // webhook/CAPI failure must never cost the conversion. The same eventId is
    // sent to the server so the CAPI Lead deduplicates against this one.
    // Self-guarded (in-memory + sessionStorage) so it can't double-fire.
    fireLead(
      eventId,
      { first: s.first, last: s.last, phone: s.phone, email: s.email, city: s.city, zip: s.zip },
      'Free Roof Inspection Funnel',
    );
    // TikTok conversion — independent of Meta (uses ttq); shares the event id.
    fireTikTokLead(eventId, { phone: s.phone, email: s.email }, 'Free Roof Inspection Funnel');

    setS((prev) => ({ ...prev, submitting: true, error: '' }));
    try {
      const res = await postLead('complete', eventId);
      if (res.ok) {
        setS((prev) => ({ ...prev, submitted: true, submitting: false, error: '' }));
        // Google Ads conversion — ONLY on a confirmed successful submission
        // (per campaign requirements), never on load/steps/failures. Keyed to
        // the submission id and self-guarded against double-firing.
        fireGoogleAdsConversion(eventId);
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          /* ignore */
        }
      } else {
        setS((prev) => ({
          ...prev,
          submitting: false,
          error: `Something went wrong sending your request. Please try again, or call us at ${BIZ_PHONE}.`,
        }));
      }
    } catch {
      setS((prev) => ({
        ...prev,
        submitting: false,
        error: 'We couldn’t send your request. Please check your connection and try again.',
      }));
    }
  };

  const showProgress = !s.submitted && s.screen > 0;
  const stepPct = Math.round((s.screen / 5) * 100) + '%';
  const doneTitle = `Request received${s.first.trim() ? `, ${s.first.trim()}` : ''}`;

  // Segmented progress (phones — desktop keeps its progress bar above).
  const seg = (
    <div className="m-only">
      <div className="amr-seg" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <i key={n} className={n <= s.screen ? 'on' : undefined} />
        ))}
      </div>
    </div>
  );

  // Question heading in the column on desktop (phones carry it on the photo).
  const deskHeading = (text: string) => (
    <h2 className="only-desktop" style={stepHeading}>
      {text}
    </h2>
  );

  const deskBack = (
    <button type="button" onClick={back} className="amr-backlink only-desktop">
      &larr; Back
    </button>
  );

  // Payment example + financing disclaimer, both verbatim from lib/claims.ts.
  const financingFine = (extra?: string) => (
    <p className="amr-fine">
      {FINANCING_EXAMPLE} {FINANCING_DISCLAIMER}
      {extra ? ` ${extra}` : ''}
    </p>
  );

  const errorBox = !!s.error && (
    <div role="alert" aria-live="polite" style={errorStyle}>
      {s.error}
    </div>
  );

  const captionBar = (meta: Meta) => (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        padding: '16px 20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '12px',
          alignItems: 'baseline',
        }}
      >
        <div
          key={meta.label}
          style={{
            fontFamily: FONT_MONO,
            fontSize: '13px',
            letterSpacing: '0.12em',
            color: '#ffffff',
            display: 'flex',
            gap: '9px',
            alignItems: 'center',
            animation: 'capIn .6s ease both',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              background: '#d7222b',
              display: 'inline-block',
              animation: 'blink 2.4s ease infinite',
            }}
          />
          {meta.label}
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: '13px', letterSpacing: '0.12em', color: '#ffb3b7' }}>
          {meta.tag}
        </div>
      </div>
    </div>
  );

  return (
    <div className="amr-root">
      {/* ---------------- Desktop photo panel ---------------- */}
      <div className="amr-photo-panel">
        {LAYERS.map((l) => {
          const active = l.slot === activeIdx;
          const style: CSSProperties = {
            objectFit: l.fit,
            objectPosition: l.pos || 'center',
            padding: l.fit === 'contain' ? '46px 18px' : 0,
            boxSizing: 'border-box',
            opacity: active ? 1 : 0,
            transform: active && KEN_BURNS && l.fit !== 'contain' ? 'scale(1.09)' : 'scale(1.0)',
            transition: 'opacity .9s ease, transform 7s ease-out',
            willChange: 'opacity, transform',
          };
          return <Image key={l.slot} className="kb-img" src={l.src} alt={l.alt} fill sizes={PHOTO_SIZES} style={style} />;
        })}

        {/* Dark gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg,rgba(12,20,46,0.35) 0%,rgba(12,20,46,0) 35%,rgba(12,20,46,0.72) 100%)',
          }}
        />

        {captionBar(DESKTOP_META[activeIdx])}

        {/* Top strip */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 20,
            right: 20,
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: FONT_MONO,
            fontSize: '11.5px',
            letterSpacing: '0.14em',
            color: 'rgba(255,255,255,0.65)',
          }}
        >
          <span>AMERICAN MASTER ROOFING</span>
          <span>29.76&deg;N 95.36&deg;W</span>
        </div>
      </div>

      {/* ---------------- Phone photo header ---------------- */}
      <header className={`m-hero is-${activeIdx}`}>
        {MOBILE_HEROES.map((h) => {
          const on = h.slot === activeIdx;
          return (
            <Image
              key={h.slot}
              src={h.src}
              alt={on ? h.alt : ''}
              aria-hidden={!on}
              fill
              sizes="100vw"
              priority={h.slot === 1}
              className={on ? 'm-layer on' : 'm-layer'}
              style={{ objectPosition: h.pos }}
            />
          );
        })}

        <div className="m-top">
          <div className="m-top-l">
            {!s.submitted && s.screen > 1 && (
              <button type="button" className="m-back" onClick={back} aria-label="Back to the previous step">
                <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M14.5 5.5 8 12l6.5 6.5" />
                </svg>
              </button>
            )}
            <span className="m-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_AMR} alt="American Master Roofing" width={268} height={120} />
            </span>
          </div>
          <a className="m-call" href={BIZ_PHONE_HREF}>
            <PhoneIcon />
            {activeIdx === 1 ? BIZ_PHONE : 'Call'}
          </a>
        </div>

        <div className="m-copy">
          {activeIdx === 1 ? (
            <>
              <div className="m-kick">
                <i />
                {HERO_KICKER}
              </div>
              <h1 className="m-h1">
                Free roof
                <br />
                inspection
              </h1>
              <div className="m-offer">
                <b>{OFFER_DOWN}</b>
                <span>{OFFER_MONTHLY}</span>
              </div>
              <ul className="m-glass" aria-label="Credentials">
                <li>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={LOGO_OWENS_CORNING} alt="" width={15} height={15} data-cred-logo onError={hideOnError} />
                  {CRED_OWENS_CORNING_SHORT}
                </li>
                <li>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={LOGO_BBB} alt="" width={15} height={15} data-cred-logo onError={hideOnError} />
                  {CRED_BBB_SHORT}
                </li>
                <li>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={LOGO_GOOGLE} alt="" width={15} height={15} data-cred-logo onError={hideOnError} />
                  {CRED_GOOGLE_SHORT}
                </li>
                <li>
                  <span className="m-sq" />
                  {CRED_ROOFS_SHORT}
                </li>
              </ul>
            </>
          ) : activeIdx === 6 ? (
            <>
              <div className="m-kick">
                <i />
                {HERO_KICKERS[6]}
              </div>
              <div className="m-done">
                <span className="m-tick">
                  <CheckIcon size={20} />
                </span>
                <h2 className="m-q">{doneTitle}</h2>
              </div>
            </>
          ) : (
            <>
              {activeIdx === 3 && urgent && <div className="m-urgent">Active leak · Priority scheduling</div>}
              <div className="m-kick">
                <i />
                {HERO_KICKERS[activeIdx]}
              </div>
              <h2 className="m-q">{STEP_Q[activeIdx]}</h2>
            </>
          )}
        </div>
      </header>

      {/* ---------------- Content column ---------------- */}
      <div className="amr-content">
        {/* Desktop header + progress (phones carry both in the photo header) */}
        <div className="only-desktop" style={{ flex: 'none' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              padding: '14px 24px',
              borderBottom: '1px solid #eceae3',
              background: '#ffffff',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_AMR} alt="American Master Roofing" style={{ height: 40, width: 'auto' }} />
            <a
              href={BIZ_PHONE_HREF}
              style={{
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '17px',
                color: '#1b2a5b',
                whiteSpace: 'nowrap',
                minHeight: 44,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Call {BIZ_PHONE}
            </a>
          </div>

          {showProgress && (
            <div style={{ padding: '14px 24px 0' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  fontFamily: FONT_MONO,
                  fontSize: '13px',
                  letterSpacing: '0.12em',
                  color: '#6a7186',
                  marginBottom: '8px',
                }}
              >
                <span>STEP {s.screen} OF 5</span>
                <span style={{ color: '#d7222b' }}>{stepPct}</span>
              </div>
              <div style={{ height: 5, background: '#eceae3', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    height: 5,
                    background: '#d7222b',
                    borderRadius: 3,
                    width: `${(s.screen / 5) * 100}%`,
                    transition: 'width .5s cubic-bezier(.22,1,.36,1)',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Step area — scrolls inside the column on desktop; on phones it is the
            sheet under the photo header and the page itself scrolls. */}
        <div className="amr-steparea">
          <div className="amr-stepinner">
            {/* Brief indicator when an organic returning visitor resumes mid-flow */}
            {resumeNotice && !s.submitted && (
              <div
                role="status"
                style={{
                  display: 'inline-block',
                  background: '#ffffff',
                  border: '1px solid #e3e0d8',
                  color: '#6a7186',
                  fontFamily: FONT_MONO,
                  fontSize: '11.5px',
                  letterSpacing: '0.12em',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  marginBottom: '10px',
                  animation: 'capIn .4s ease both',
                }}
              >
                PICKING UP WHERE YOU LEFT OFF
              </div>
            )}

            {/* ---- Step 1: Concern ---- */}
            {!s.submitted && s.screen === 1 && (
              <div className="amr-step">
                <div className="m-only">
                  <div className="amr-mrow">
                    <span>STEP 1 OF 5</span>
                    <span>UNDER 60 SECONDS</span>
                  </div>
                </div>
                {seg}
                <h2 className="amr-q1">{STEP_Q[1]}</h2>
                <p className="amr-sub">Pick the closest match. The inspection finds the rest.</p>
                <div className="amr-tiles">
                  {CONCERNS.map((label) => (
                    <button
                      key={label}
                      type="button"
                      className={s.concern === label ? 'amr-tile is-sel' : 'amr-tile'}
                      onClick={() => selectSingle('concern', label, 2)}
                    >
                      <span className="amr-tile-ic">{CONCERN_ICONS[label]}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
                {financingFine()}

                {/* Credentials & pricing — the full claim wording (from
                    lib/claims.ts). On phones this sits just below the fold;
                    the short-form credentials are on the photo above. */}
                <div style={{ borderTop: '1px solid #eceae3', marginTop: 22, paddingTop: 18 }}>
                  <div style={monoKicker}>
                    <span style={{ width: 8, height: 8, background: '#d7222b', display: 'inline-block', flex: 'none' }} />
                    AMERICAN MASTER ROOFING · CREDENTIALS
                  </div>
                  {[
                    { src: LOGO_OWENS_CORNING, alt: 'Owens Corning', text: CRED_OWENS_CORNING },
                    { src: LOGO_BBB, alt: 'Better Business Bureau', text: CRED_BBB },
                    { src: LOGO_GOOGLE, alt: 'Google', text: CRED_GOOGLE },
                  ].map((row) => (
                    <div key={row.text} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 9px' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={row.src}
                        alt={row.alt}
                        width={20}
                        height={20}
                        data-cred-logo
                        style={{ objectFit: 'contain', flex: 'none' }}
                        onError={hideOnError}
                      />
                      <span style={{ fontSize: '15.5px', fontWeight: 600, color: '#1b2a5b' }}>{row.text}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', marginTop: 10 }}>
                    {[CRED_ROOFS, CRED_YEARS, CRED_SINCE, CRED_INSURED, CRED_24H, CRED_FREE].map((t) => (
                      <div key={t} style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: '15px', color: '#4a5165' }}>
                        <span style={{ width: 6, height: 6, background: '#d7222b', flex: 'none' }} />
                        {t}
                      </div>
                    ))}
                  </div>

                  <div style={{ ...monoKicker, margin: '18px 0 8px' }}>
                    <span style={{ width: 8, height: 8, background: '#d7222b', display: 'inline-block', flex: 'none' }} />
                    PRICING & FINANCING
                  </div>
                  <p style={{ fontSize: '15px', color: '#4a5165', lineHeight: 1.55, margin: '0 0 6px' }}>
                    <strong style={{ color: '#1b2a5b', fontWeight: 600 }}>{PRICE_FROM}.</strong> {PRICE_QUALIFIER}{' '}
                    {CLAIM_FINANCING}
                  </p>
                  <p style={{ fontSize: '15px', color: '#4a5165', lineHeight: 1.55, margin: 0 }}>
                    {CLAIM_SHINGLES}. {CLAIM_WARRANTY}.
                  </p>
                </div>
              </div>
            )}

            {/* ---- Step 2: Contact ---- */}
            {!s.submitted && s.screen === 2 && (
              <div className="amr-step">
                {seg}
                {deskHeading(STEP_Q[2])}
                <p className="amr-sub only-desktop">
                  We&rsquo;ll call or text to confirm a time that works for you. That&rsquo;s the only reason we ask.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    nextContact();
                  }}
                >
                  {/* Honeypot — hidden from users, catches bots. Deliberately
                      named so browser autofill heuristics (which match on
                      name/id/label keywords like "company"/"organization")
                      never fill it and silently kill a real lead. */}
                  <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
                    <label htmlFor="f-hp-field">Leave this field empty</label>
                    <input
                      id="f-hp-field"
                      name="hp_field"
                      tabIndex={-1}
                      autoComplete="off"
                      value={s.company}
                      onChange={(e) => setS((prev) => ({ ...prev, company: e.target.value }))}
                    />
                  </div>

                  <div className="amr-row2">
                    <div>
                      <label htmlFor="f-first" className="sr-only">
                        First name
                      </label>
                      <input
                        id="f-first"
                        className="amr-in"
                        value={s.first}
                        onChange={set('first')}
                        placeholder="First name"
                        autoComplete="given-name"
                      />
                    </div>
                    <div>
                      <label htmlFor="f-last" className="sr-only">
                        Last name
                      </label>
                      <input
                        id="f-last"
                        className="amr-in"
                        value={s.last}
                        onChange={set('last')}
                        placeholder="Last name"
                        autoComplete="family-name"
                      />
                    </div>
                  </div>
                  <label htmlFor="f-phone" className="sr-only">
                    Mobile phone number
                  </label>
                  <input
                    id="f-phone"
                    className="amr-in"
                    value={s.phone}
                    onChange={set('phone')}
                    placeholder="Mobile phone number"
                    inputMode="tel"
                    type="tel"
                    autoComplete="tel"
                  />
                  <label htmlFor="f-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="f-email"
                    className="amr-in"
                    value={s.email}
                    onChange={set('email')}
                    placeholder="Email address"
                    inputMode="email"
                    type="email"
                    autoComplete="email"
                  />
                  {errorBox}

                  {/* TCPA consent — verbatim copy from lib/claims.ts, unchecked by
                      default, never persisted; the button stays disabled until checked. */}
                  <label htmlFor="f-consent" className="amr-consent">
                    <input
                      id="f-consent"
                      type="checkbox"
                      checked={!!s.consentAt}
                      onChange={(e) =>
                        setS((prev) => ({
                          ...prev,
                          consentAt: e.target.checked ? new Date().toISOString() : '',
                          error: '',
                        }))
                      }
                    />
                    <span>
                      <ConsentCopy />
                    </span>
                  </label>

                  <button type="submit" className="amr-cta" disabled={!s.consentAt}>
                    Continue &rarr;
                  </button>
                  {deskBack}
                </form>
              </div>
            )}

            {/* ---- Step 3: Timing ---- */}
            {!s.submitted && s.screen === 3 && (
              <div className="amr-step">
                {seg}
                {urgent && (
                  <div className="only-desktop">
                    <div style={urgentBadge}>ACTIVE LEAK — WE&rsquo;LL PRIORITIZE YOUR REQUEST</div>
                  </div>
                )}
                {deskHeading(STEP_Q[3])}
                <div className="amr-opts">
                  {TIMINGS.map((label, i) => (
                    <button
                      key={label}
                      type="button"
                      className={s.timing === label ? 'amr-opt is-sel' : 'amr-opt'}
                      onClick={() => selectSingle('timing', label, 4)}
                    >
                      <span>{label}</span>
                      {i === 0 && (
                        <em>
                          WITHIN
                          <br />
                          24 HOURS
                        </em>
                      )}
                    </button>
                  ))}
                </div>
                <p className="amr-note">Nothing is locked in until you confirm by phone.</p>
                {deskBack}
              </div>
            )}

            {/* ---- Step 4: Address ---- */}
            {!s.submitted && s.screen === 4 && (
              <div className="amr-step">
                {seg}
                {deskHeading(STEP_Q[4])}
                <p className="amr-sub only-desktop">
                  Your address lets us confirm coverage and study your roofline before we ever arrive.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    nextAddress();
                  }}
                >
                  <label htmlFor="f-address" className="sr-only">
                    Street address
                  </label>
                  <input
                    id="f-address"
                    className="amr-in"
                    value={s.address}
                    onChange={set('address')}
                    placeholder="Street address"
                    autoComplete="street-address"
                  />
                  <div className="amr-row2 amr-row2--zip">
                    <div>
                      <label htmlFor="f-city" className="sr-only">
                        City
                      </label>
                      <input
                        id="f-city"
                        className="amr-in"
                        value={s.city}
                        onChange={set('city')}
                        placeholder="City"
                        autoComplete="address-level2"
                      />
                    </div>
                    <div>
                      <label htmlFor="f-zip" className="sr-only">
                        ZIP code
                      </label>
                      <input
                        id="f-zip"
                        className="amr-in"
                        value={s.zip}
                        onChange={set('zip')}
                        placeholder="ZIP"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        maxLength={5}
                      />
                    </div>
                  </div>
                  <p className="amr-area">
                    <PinIcon />
                    <span>Serving {BUSINESS.serviceAreas}</span>
                  </p>
                  {errorBox}
                  <button type="submit" className="amr-cta">
                    Continue &rarr;
                  </button>
                  {deskBack}
                </form>
              </div>
            )}

            {/* ---- Step 5: Offers (final step — submits the lead) ---- */}
            {!s.submitted && s.screen === 5 && (
              <div className="amr-step">
                {seg}
                {deskHeading(STEP_Q[5])}
                <p className="amr-sub">Optional. Tap any and we&rsquo;ll walk you through them at your inspection.</p>
                <div className="amr-chips">
                  {OFFERS.map((label) => {
                    const sel = s.offers.includes(label);
                    return (
                      <button
                        key={label}
                        type="button"
                        className={sel ? 'amr-chip is-sel' : 'amr-chip'}
                        aria-pressed={sel}
                        onClick={() => toggleOffer(label)}
                      >
                        <span className="amr-ck">{sel && <CheckIcon />}</span>
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
                {errorBox}
                <button type="button" onClick={submit} className="amr-cta" disabled={s.submitting}>
                  {s.submitting ? 'Sending…' : 'Book My Free Inspection'}
                </button>
                {financingFine('Discount eligibility verification may be required.')}
                {deskBack}
                <p style={{ ...finePrint, marginTop: '10px' }}>
                  Submitting this request does not obligate you to purchase roofing services or apply for financing. By
                  submitting, you agree that American Master Roofing may contact you by call or text regarding your
                  inspection request. Consent is not a condition of purchase. Message and data rates may apply.
                </p>
                <details style={{ marginTop: '8px' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '13px', color: '#6a7186', fontWeight: 600 }}>
                    Privacy Policy &amp; Terms
                  </summary>
                  <p style={{ fontSize: '13px', color: '#6a7186', lineHeight: 1.5, margin: '6px 0 0' }}>
                    Information submitted through this page is used only to coordinate your inspection request and
                    related follow-up by American Master Roofing; it is not sold to third parties. Free inspection
                    carries no obligation to purchase. Warranty coverage depends on the selected roofing system and
                    manufacturer terms. Discount availability and combinability may vary.
                  </p>
                </details>
              </div>
            )}

            {/* ---- Confirmation ---- */}
            {s.submitted && (
              <div className="amr-step">
                <div className="only-desktop">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        flex: 'none',
                        borderRadius: '50%',
                        background: '#1b2a5b',
                        color: '#fff',
                        fontSize: '22px',
                        lineHeight: '44px',
                        textAlign: 'center',
                        animation: 'tickIn .5s .1s ease both',
                      }}
                    >
                      &#10003;
                    </div>
                    <h2
                      style={{
                        fontFamily: FONT_COND,
                        fontSize: 'clamp(34px,3.6vw,48px)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        lineHeight: 1,
                        margin: 0,
                      }}
                    >
                      {doneTitle}
                    </h2>
                  </div>
                </div>
                {urgent && <div style={{ ...urgentBadge, marginBottom: '10px' }}>ACTIVE LEAK — PRIORITY SCHEDULING</div>}
                <p className="amr-done-lede">
                  Our Houston team will call or text shortly to confirm a time. Here&rsquo;s what happens next.
                </p>
                <ol className="amr-next">
                  <li>
                    <b>01</b>
                    <div>
                      We confirm a time
                      <small>By call or text from {BIZ_PHONE}.</small>
                    </div>
                  </li>
                  <li>
                    <b>02</b>
                    <div>
                      We inspect and photograph
                      <small>Every finding is documented.</small>
                    </div>
                  </li>
                  <li>
                    <b>03</b>
                    <div>
                      You decide
                      <small>A straight answer, with no obligation.</small>
                    </div>
                  </li>
                </ol>
                <a href={BIZ_PHONE_HREF} className="amr-callout">
                  <PhoneIcon />
                  Need it sooner? Call {BIZ_PHONE}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Footer strip — carries the physical business address (required when
            financing is advertised) and service area, in the same quiet voice. */}
        <div
          style={{
            flex: 'none',
            padding: '12px 24px',
            borderTop: '1px solid #eceae3',
            fontSize: '13px',
            color: '#6a7186',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', justifyContent: 'space-between' }}>
            <span>
              &copy; 2026 {BUSINESS.name} &middot; {BUSINESS.addressLine} &middot;{' '}
              <a href={BUSINESS.phoneHref} style={{ color: '#1b2a5b', textDecoration: 'none', fontWeight: 600 }}>
                {BUSINESS.phoneDisplay}
              </a>
            </span>
            <span>Free inspection &middot; No obligation to purchase</span>
          </div>
          <div style={{ marginTop: 4 }}>
            Serving Greater Houston &amp; surrounding areas: {BUSINESS.serviceAreas}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Static style objects reused across steps ----
const stepHeading: CSSProperties = {
  fontFamily: FONT_COND,
  fontSize: 'clamp(32px,3.4vw,44px)',
  fontWeight: 700,
  textTransform: 'uppercase',
  lineHeight: 1.02,
  margin: '0 0 6px',
};
const errorStyle: CSSProperties = {
  color: '#b81b23',
  fontSize: '15px',
  fontWeight: 600,
  marginTop: '10px',
  animation: 'riseIn .3s ease both',
};
const finePrint: CSSProperties = {
  fontSize: '13px',
  color: '#6a7186',
  lineHeight: 1.5,
  margin: '14px 0 0',
};
const monoKicker: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontFamily: FONT_MONO,
  fontSize: '11.5px',
  letterSpacing: '0.14em',
  color: '#6a7186',
  marginBottom: 12,
};

// Renders CONSENT_TEXT verbatim, resolving only the [Privacy Policy]/[Terms]
// placeholders into links — the rendered copy is derived from the constant, so
// it cannot drift from the logged consent_text_version.
function ConsentCopy() {
  return (
    <>
      {CONSENT_TEXT.split(/(\[Privacy Policy\]|\[Terms\])/).map((part, i) =>
        part === '[Privacy Policy]' ? (
          <a key={i} href={CONSENT_PRIVACY_URL} target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
        ) : part === '[Terms]' ? (
          <a key={i} href={CONSENT_TERMS_URL} target="_blank" rel="noopener noreferrer">
            Terms
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

const urgentBadge: CSSProperties = {
  display: 'inline-block',
  background: '#fdeceb',
  color: '#b81b23',
  fontFamily: FONT_MONO,
  fontSize: '12.5px',
  letterSpacing: '0.12em',
  padding: '6px 12px',
  borderRadius: '6px',
  marginBottom: '12px',
  animation: 'tickIn .4s ease both',
};
