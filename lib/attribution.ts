// Captures campaign attribution once on landing and keeps it across the
// multi-step flow / remounts. Read from URL + cookies; never written to a URL.
//
// Rules:
// - First-touch wins: a stored value is never overwritten by a later blank.
// - EXCEPT when a NEW Google click id (gclid/gbraid/wbraid) arrives in the URL —
//   that is a genuinely new paid session, so the whole object is rebuilt fresh.
// - Persisted to BOTH sessionStorage and localStorage (all access try/catch'd).

const KEY = 'amr-attribution';

export type Attribution = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  utm_matchtype: string;
  fbclid: string;
  fbp: string;
  fbc: string;
  gclid: string;
  gbraid: string;
  wbraid: string;
  landing_page: string;
  referrer: string;
  captured_at: string;
};

const EMPTY: Attribution = {
  utm_source: '',
  utm_medium: '',
  utm_campaign: '',
  utm_content: '',
  utm_term: '',
  utm_matchtype: '',
  fbclid: '',
  fbp: '',
  fbc: '',
  gclid: '',
  gbraid: '',
  wbraid: '',
  landing_page: '',
  referrer: '',
  captured_at: '',
};

function readStored(): Partial<Attribution> {
  try {
    const s = sessionStorage.getItem(KEY);
    if (s) return JSON.parse(s);
  } catch {
    /* ignore */
  }
  try {
    const l = localStorage.getItem(KEY);
    if (l) return JSON.parse(l);
  } catch {
    /* ignore */
  }
  return {};
}

function writeStored(v: Attribution) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

function cookie(name: string): string {
  try {
    const esc = name.replace(/([.*+?^${}()|[\]\\])/g, '\\$1');
    const m = document.cookie.match(new RegExp('(?:^|; )' + esc + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  } catch {
    return '';
  }
}

// True when THIS page load arrived with a Google click id that differs from the
// stored one — i.e. a fresh paid session. Memoized per page load, decided by
// the first getAttribution() call (before capture overwrites the stored value).
let newPaidClickThisLoad: boolean | null = null;

// Idempotent: capture-and-persist, returns the current attribution.
export function getAttribution(): Attribution {
  if (typeof window === 'undefined') return { ...EMPTY };
  const stored = readStored();
  const params = new URLSearchParams(window.location.search);

  const urlGclid = params.get('gclid') || '';
  const urlGbraid = params.get('gbraid') || '';
  const urlWbraid = params.get('wbraid') || '';
  const isNewClick =
    (!!urlGclid && urlGclid !== (stored.gclid || '')) ||
    (!!urlGbraid && urlGbraid !== (stored.gbraid || '')) ||
    (!!urlWbraid && urlWbraid !== (stored.wbraid || ''));
  if (newPaidClickThisLoad === null) newPaidClickThisLoad = isNewClick;

  // A new paid click rebuilds the whole object from the current visit.
  const base: Partial<Attribution> = isNewClick ? {} : stored;
  const initialized = !!base.captured_at;
  const firstTouch = (k: keyof Attribution) => (base[k] as string) || params.get(k) || '';

  const fbclid = firstTouch('fbclid');
  const fbp = cookie('_fbp') || base.fbp || '';
  let fbc = cookie('_fbc') || base.fbc || '';
  if (!fbc && fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`;

  const result: Attribution = {
    utm_source: firstTouch('utm_source'),
    utm_medium: firstTouch('utm_medium'),
    utm_campaign: firstTouch('utm_campaign'),
    utm_content: firstTouch('utm_content'),
    utm_term: firstTouch('utm_term'),
    utm_matchtype: firstTouch('utm_matchtype'),
    fbclid,
    fbp,
    fbc,
    gclid: (base.gclid as string) || urlGclid,
    gbraid: (base.gbraid as string) || urlGbraid,
    wbraid: (base.wbraid as string) || urlWbraid,
    landing_page: (base.landing_page as string) || window.location.pathname,
    // Entry-time values: locked at first capture even when blank (direct visits).
    referrer: initialized ? base.referrer || '' : document.referrer || '',
    captured_at: initialized ? (base.captured_at as string) : new Date().toISOString(),
  };
  writeStored(result);
  return result;
}

// Whether this page load began a new paid (Google click) session. Safe to call
// any time; triggers capture if it hasn't happened yet.
export function wasNewPaidClick(): boolean {
  if (newPaidClickThisLoad === null) getAttribution();
  return !!newPaidClickThisLoad;
}
