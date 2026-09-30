// First- and last-touch campaign attribution, sent to GoHighLevel alongside the
// existing capture in lib/attribution.ts (which keeps owning the Meta fbclid /
// fbp / fbc values and the latest Google click id for Ads matching).
//
// - FIRST touch (utm_*, lead_source, click_id, landing_page, referrer): the
//   campaign that introduced this visitor. Written once, never overwritten
//   for 90 days — someone who first lands from Meta stays Meta even if they
//   return directly or from another campaign later.
// - LAST touch (last_*): the most recent campaign click. Advances whenever a
//   visit arrives with a utm_* param or a click id; a direct return is not a
//   touch and leaves it alone. On a single visit, first and last match.
//
// Stored under its own key so it never collides with lib/attribution.ts.
// Browser-only except mapLeadSource(), which the server route also uses.

export type Touch = {
  lead_source: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  landing_page: string;
  click_id: string;
  referrer: string;
};

/** Flat shape sent to /api/lead: first touch unprefixed, last touch as last_*. */
export type TouchAttribution = Touch & {
  last_lead_source: string;
  last_utm_source: string;
  last_utm_medium: string;
  last_utm_campaign: string;
  last_utm_content: string;
  last_utm_term: string;
  last_click_id: string;
};

const EMPTY_TOUCH: Touch = {
  lead_source: '',
  utm_source: '',
  utm_medium: '',
  utm_campaign: '',
  utm_content: '',
  utm_term: '',
  landing_page: '',
  click_id: '',
  referrer: '',
};

export const EMPTY_TOUCH_ATTRIBUTION: TouchAttribution = {
  ...EMPTY_TOUCH,
  last_lead_source: '',
  last_utm_source: '',
  last_utm_medium: '',
  last_utm_campaign: '',
  last_utm_content: '',
  last_utm_term: '',
  last_click_id: '',
};

const KEY = 'amr-touch-attribution';
const TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days, measured from the FIRST touch
const VERSION = 1;

// Ad-platform click ids, in priority order (first one present wins).
const CLICK_ID_KEYS = ['fbclid', 'ttclid', 'gclid', 'msclkid'] as const;

// utm_source -> the source vocabulary GoHighLevel reports on.
const SOURCE_MAP: Record<string, string> = {
  meta: 'meta-landing-page',
  facebook: 'meta-landing-page',
  tiktok: 'tiktok-landing-page',
  google: 'google-landing-page',
};

/** Map a raw utm_source into the agreed vocabulary. Unknown/absent -> organic-direct. */
export function mapLeadSource(utmSource: string): string {
  return SOURCE_MAP[utmSource.trim().toLowerCase()] || 'organic-direct';
}

type Stored = { v: number; ts: number; first: Touch; last: Touch };

function readStored(): Stored | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const rec = JSON.parse(raw) as Stored;
    if (!rec || rec.v !== VERSION || typeof rec.ts !== 'number') return null;
    if (Date.now() - rec.ts >= TTL_MS) return null; // window lapsed: start fresh
    if (!rec.first || !rec.last) return null;
    return {
      v: VERSION,
      ts: rec.ts,
      first: { ...EMPTY_TOUCH, ...rec.first },
      last: { ...EMPTY_TOUCH, ...rec.last },
    };
  } catch {
    return null; // private mode / corrupt JSON
  }
}

function writeStored(rec: Stored) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rec));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

// This visit's attribution, read off the current URL.
function readVisit(): Touch {
  const params = new URLSearchParams(window.location.search);
  const get = (k: string) => (params.get(k) || '').trim();

  let click_id = '';
  for (const k of CLICK_ID_KEYS) {
    const v = get(k);
    if (v) {
      click_id = v;
      break;
    }
  }

  // Ignore self-referrals — a same-origin referrer isn't a traffic source.
  let referrer = '';
  try {
    const ref = document.referrer || '';
    if (ref && new URL(ref).origin !== window.location.origin) referrer = ref;
  } catch {
    /* malformed referrer */
  }

  const utm_source = get('utm_source');
  return {
    lead_source: mapLeadSource(utm_source),
    utm_source,
    utm_medium: get('utm_medium'),
    utm_campaign: get('utm_campaign'),
    utm_content: get('utm_content'),
    utm_term: get('utm_term'),
    landing_page: `${window.location.origin}${window.location.pathname}`, // query string stripped
    click_id,
    referrer,
  };
}

// A visit counts as a touch only when it carries a utm_* param or a click id.
function isCampaignVisit(t: Touch): boolean {
  return !!(t.utm_source || t.utm_medium || t.utm_campaign || t.utm_content || t.utm_term || t.click_id);
}

function flatten(first: Touch, last: Touch): TouchAttribution {
  return {
    ...first,
    last_lead_source: last.lead_source,
    last_utm_source: last.utm_source,
    last_utm_medium: last.utm_medium,
    last_utm_campaign: last.utm_campaign,
    last_utm_content: last.utm_content,
    last_utm_term: last.utm_term,
    last_click_id: last.click_id,
  };
}

// Idempotent capture-and-persist; returns the current first/last touch.
export function captureTouchAttribution(): TouchAttribution {
  if (typeof window === 'undefined') return { ...EMPTY_TOUCH_ATTRIBUTION };

  const visit = readVisit();
  const stored = readStored();

  // New visitor (or the 90-day window lapsed): this visit is both touches.
  if (!stored) {
    writeStored({ v: VERSION, ts: Date.now(), first: visit, last: visit });
    return flatten(visit, visit);
  }

  // Known visitor: first touch is frozen; a campaign visit becomes the last touch.
  if (isCampaignVisit(visit)) {
    writeStored({ ...stored, last: visit });
    return flatten(stored.first, visit);
  }
  return flatten(stored.first, stored.last);
}
