'use client';

/* Yardskapes website — Quote request modal (lead capture) */

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { User, MapPin, Mail, X, Check, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Btn } from './primitives';

function Field({
  label,
  icon: Icon,
  placeholder,
  value,
  onChange,
  type = 'text',
  error,
}: {
  label: string;
  icon: LucideIcon;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <label style={{ display: 'block' }}>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 10.5,
          letterSpacing: '.12em',
          textTransform: 'uppercase',
          color: 'var(--fg-2)',
          display: 'block',
          marginBottom: 8,
        }}
      >
        {label}
      </span>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#fff',
          border: '1.5px solid',
          borderColor: error ? 'var(--clay)' : focus ? 'var(--heritage-green)' : 'var(--line-strong)',
          borderRadius: 'var(--r-sm)',
          padding: '0 14px',
          height: 48,
          boxShadow: focus ? '0 0 0 3px var(--focus-ring)' : 'none',
          transition: 'all var(--dur) var(--ease-out)',
        }}
      >
        <Icon size={17} style={{ color: 'var(--fg-3)', flex: 'none' }} aria-hidden />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{ border: 0, outline: 0, background: 'transparent', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--fg-1)', width: '100%' }}
        />
      </span>
      {error && (
        <span style={{ display: 'block', marginTop: 6, fontSize: 12, color: 'var(--clay)' }}>{error}</span>
      )}
    </label>
  );
}

const SERVICES = ['Landscape Design', 'Hardscapes', 'Native Planting', 'Irrigation', 'Lighting', 'Full Maintenance'];

type FormState = { name: string; addr: string; email: string; service: string };
type Errors = Partial<Record<'name' | 'addr' | 'email', string>>;

export function QuoteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [f, setF] = useState<FormState>({ name: '', addr: '', email: '', service: 'Landscape Design' });
  const [hp, setHp] = useState(''); // honeypot — must stay empty

  // reset transient state whenever the modal is reopened
  useEffect(() => {
    if (open) {
      setSent(false);
      setSubmitting(false);
      setErrors({});
    }
  }, [open]);

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const validate = (): boolean => {
    const next: Errors = {};
    if (!f.name.trim()) next.name = 'Please enter your name.';
    if (!f.addr.trim()) next.addr = 'Please enter your property address.';
    if (!f.email.trim()) next.email = 'Please enter your email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) next.email = 'Please enter a valid email address.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (hp) return; // bot caught by honeypot
    if (!validate()) return;
    setSubmitting(true);
    try {
      // TODO (production): POST `f` to a real endpoint (CRM / lead inbox / email
      // service) and only show success on a 2xx response; handle/show errors.
      // Example:
      //   const res = await fetch('/api/quote', { method: 'POST',
      //     headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      //   if (!res.ok) throw new Error('Request failed');
      await new Promise((r) => setTimeout(r, 600)); // simulated network latency
      setSent(true);
    } catch {
      setErrors({ email: 'Something went wrong. Please try again or call us.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Request a Walkthrough"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(17,32,26,0.55)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        animation: 'fadeUp .2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="framed"
        style={{ width: 'min(560px, 100%)', maxHeight: '92vh', overflowY: 'auto', background: 'var(--limestone)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-dark)' }}
      >
        <div style={{ background: 'var(--heritage-green)', padding: '26px 32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'var(--leaf-texture)', opacity: 0.12 }} />
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="eyebrow" style={{ color: 'var(--gold-soft)' }}>
                Request a Walkthrough
              </div>
              <h3 style={{ color: 'var(--limestone)', margin: '12px 0 0', fontSize: 26 }}>Let&rsquo;s see what&rsquo;s possible.</h3>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'rgba(244,240,232,.12)',
                border: 0,
                color: 'var(--limestone)',
                width: 36,
                height: 36,
                borderRadius: 'var(--r-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} aria-hidden />
            </button>
          </div>
        </div>

        {sent ? (
          <div style={{ padding: '48px 32px', textAlign: 'center' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--sage-wash)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: 'var(--heritage-green)',
              }}
            >
              <Check size={26} aria-hidden />
            </div>
            <h4 style={{ margin: '0 0 8px' }}>Request received.</h4>
            <p style={{ margin: '0 auto', maxWidth: 360 }}>
              A Yardskapes designer will reach out within one business day to schedule your on-site walkthrough.
            </p>
            <div style={{ marginTop: 26 }}>
              <Btn variant="primary" onClick={onClose}>
                Done
              </Btn>
            </div>
          </div>
        ) : (
          <div style={{ padding: '28px 32px 32px', display: 'grid', gap: 18 }}>
            <Field label="Your Name" icon={User} placeholder="Jane Whitmore" value={f.name} onChange={(v) => setF({ ...f, name: v })} error={errors.name} />
            <Field label="Property Address" icon={MapPin} placeholder="Independence Heights, Houston" value={f.addr} onChange={(v) => setF({ ...f, addr: v })} error={errors.addr} />
            <Field label="Email" icon={Mail} type="email" placeholder="jane@email.com" value={f.email} onChange={(v) => setF({ ...f, email: v })} error={errors.email} />

            {/* honeypot — hidden from users, catches bots */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              aria-hidden
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 } as CSSProperties}
            />

            <div>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 10.5,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: 'var(--fg-2)',
                  display: 'block',
                  marginBottom: 10,
                }}
              >
                Interested In
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SERVICES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setF({ ...f, service: s })}
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                      fontSize: 12,
                      letterSpacing: '.04em',
                      whiteSpace: 'nowrap',
                      padding: '9px 14px',
                      borderRadius: 'var(--r-pill)',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: f.service === s ? 'var(--heritage-green)' : 'var(--line-strong)',
                      background: f.service === s ? 'var(--heritage-green)' : 'transparent',
                      color: f.service === s ? 'var(--limestone)' : 'var(--fg-2)',
                      transition: 'all var(--dur) var(--ease-out)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn btn-primary"
              type="button"
              disabled={submitting}
              style={{ justifyContent: 'center', marginTop: 6, opacity: submitting ? 0.7 : 1, cursor: submitting ? 'wait' : 'pointer' }}
              onClick={submit}
            >
              {submitting ? 'Sending…' : 'Request My Walkthrough'}
              {!submitting && <ArrowRight size={16} aria-hidden />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
