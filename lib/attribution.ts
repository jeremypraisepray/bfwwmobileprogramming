// Captures campaign attribution once on landing and keeps it across the
// multi-step flow / remounts. Read from URL + cookies; never written to a URL.

const KEY = 'amr-attribution';

export type Attribution = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  fbclid: string;
  fbp: string;
  fbc: string;
};

const EMPTY: Attribution = {
  utm_source: '',
  utm_medium: '',
  utm_campaign: '',
  utm_content: '',
  utm_term: '',
  fbclid: '',
  fbp: '',
  fbc: '',
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

// Idempotent: capture-and-persist, returns the current attribution.
export function getAttribution(): Attribution {
  if (typeof window === 'undefined') return { ...EMPTY };
  const stored = readStored();
  const params = new URLSearchParams(window.location.search);
  const firstTouch = (k: keyof Attribution) => (stored[k] as string) || params.get(k) || '';

  const fbclid = firstTouch('fbclid');
  const fbp = cookie('_fbp') || stored.fbp || '';
  let fbc = cookie('_fbc') || stored.fbc || '';
  if (!fbc && fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`;

  const result: Attribution = {
    utm_source: firstTouch('utm_source'),
    utm_medium: firstTouch('utm_medium'),
    utm_campaign: firstTouch('utm_campaign'),
    utm_content: firstTouch('utm_content'),
    utm_term: firstTouch('utm_term'),
    fbclid,
    fbp,
    fbc,
  };
  writeStored(result);
  return result;
}
