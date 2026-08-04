// Client-side Meta Lead event: advanced matching + dedup event ID.
// Every call is best-effort — a tracking failure never blocks the funnel.

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const LEAD_FLAG = 'amr-lead-fired';

let leadFiredInMemory = false;

export function newEventId(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* ignore */
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function alreadyFired(): boolean {
  if (leadFiredInMemory) return true;
  try {
    return sessionStorage.getItem(LEAD_FLAG) === '1';
  } catch {
    return false;
  }
}

function markFired() {
  leadFiredInMemory = true;
  try {
    sessionStorage.setItem(LEAD_FLAG, '1');
  } catch {
    /* ignore */
  }
}

function normalizePhone(raw?: string): string {
  const d = (raw || '').replace(/\D/g, '');
  if (d.length === 10) return `1${d}`;
  if (d.length === 11 && d.startsWith('1')) return d;
  return d;
}

export type LeadUser = {
  first?: string;
  last?: string;
  phone?: string;
  email?: string;
  city?: string;
  zip?: string;
};

export function fireLead(eventId: string, user: LeadUser, contentName: string) {
  try {
    if (!PIXEL_ID) return;
    const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
    if (typeof fbq !== 'function') return;
    if (alreadyFired()) return;

    // Advanced matching — only fields the form collects, normalized.
    // The pixel hashes these client-side; we do NOT hash, log, or send elsewhere.
    const am: Record<string, string> = {};
    if (user.email) am.em = user.email.trim().toLowerCase();
    if (user.phone) {
      const ph = normalizePhone(user.phone);
      if (ph) am.ph = ph;
    }
    if (user.first) am.fn = user.first.trim().toLowerCase();
    if (user.last) am.ln = user.last.trim().toLowerCase();
    if (user.city) am.ct = user.city.trim().toLowerCase();
    if (user.zip) am.zp = user.zip.trim();
    am.st = 'tx';
    am.country = 'us';

    // Set advanced matching AFTER load without re-initializing the pixel.
    // Re-initializing here would silently disable the pixel and drop the Lead
    // event; set userData is the supported post-load API. Values are raw
    // (lowercased, unhashed) — the pixel hashes them client-side.
    fbq('set', 'userData', PIXEL_ID, am);
    fbq('track', 'Lead', { content_name: contentName }, { eventID: eventId });
    markFired();
  } catch {
    /* tracking must never block the funnel */
  }
}
