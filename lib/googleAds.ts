// Client-side Google Ads conversion event. Independent of Meta (fbq) and
// TikTok (ttq). Best-effort — a tracking failure never blocks the funnel.

const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const CONVERSION_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL;
const CONV_FLAG = 'amr-gads-conv-fired';

let convFiredInMemory = false;

function getGtag(): ((...a: unknown[]) => void) | null {
  const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  return typeof gtag === 'function' ? gtag : null;
}

function alreadyFired(): boolean {
  if (convFiredInMemory) return true;
  try {
    return sessionStorage.getItem(CONV_FLAG) === '1';
  } catch {
    return false;
  }
}

function markFired() {
  convFiredInMemory = true;
  try {
    sessionStorage.setItem(CONV_FLAG, '1');
  } catch {
    /* ignore */
  }
}

// Fires the Google Ads conversion exactly once per session, keyed to a
// transaction id (which also lets Google dedupe on their side). Called ONLY
// after /api/lead confirms the lead was saved — on the contact-step capture,
// with the final submit as a fallback — never on load or failures.
export function fireGoogleAdsConversion(transactionId: string) {
  try {
    if (!ADS_ID || !CONVERSION_LABEL) return;
    const gtag = getGtag();
    if (!gtag) return;
    if (alreadyFired()) return;

    gtag('event', 'conversion', {
      send_to: `${ADS_ID}/${CONVERSION_LABEL}`,
      transaction_id: transactionId,
    });
    markFired();
  } catch {
    /* tracking must never block the funnel */
  }
}
