// Client-side TikTok conversion event. Independent of Meta (uses `ttq`, not
// `fbq`). Best-effort — a tracking failure never blocks the funnel.

const PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
const TT_LEAD_FLAG = 'amr-tt-lead-fired';

let ttLeadFiredInMemory = false;

type Ttq = {
  track: (...a: unknown[]) => void;
  identify: (...a: unknown[]) => void;
};

function getTtq(): Ttq | null {
  const ttq = (window as unknown as { ttq?: Ttq }).ttq;
  return ttq && typeof ttq.track === 'function' ? ttq : null;
}

function alreadyFired(): boolean {
  if (ttLeadFiredInMemory) return true;
  try {
    return sessionStorage.getItem(TT_LEAD_FLAG) === '1';
  } catch {
    return false;
  }
}

function markFired() {
  ttLeadFiredInMemory = true;
  try {
    sessionStorage.setItem(TT_LEAD_FLAG, '1');
  } catch {
    /* ignore */
  }
}

// TikTok wants phone in E.164 (with +). The pixel hashes it client-side.
function toE164(raw?: string): string {
  const d = (raw || '').replace(/\D/g, '');
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith('1')) return `+${d}`;
  return d ? `+${d}` : '';
}

export type TikTokUser = { phone?: string; email?: string };

export function fireTikTokLead(eventId: string, user: TikTokUser, contentName: string) {
  try {
    if (!PIXEL_ID) return;
    const ttq = getTtq();
    if (!ttq) return;
    if (alreadyFired()) return;

    // Advanced matching — only the identifiers TikTok supports, raw (the pixel
    // hashes them client-side). We do NOT hash, log, or send them elsewhere.
    const id: Record<string, string> = {};
    if (user.email) id.email = user.email.trim().toLowerCase();
    if (user.phone) {
      const ph = toE164(user.phone);
      if (ph) id.phone_number = ph;
    }
    if (Object.keys(id).length) ttq.identify(id);

    // event_id shared with the Meta event id so a future TikTok Events API call
    // can deduplicate against this browser event.
    ttq.track(
      'SubmitForm',
      {
        contents: [{ content_id: 'roof-inspection', content_name: contentName }],
        value: 0,
        currency: 'USD',
      },
      { event_id: eventId },
    );
    markFired();
  } catch {
    /* tracking must never block the funnel */
  }
}
