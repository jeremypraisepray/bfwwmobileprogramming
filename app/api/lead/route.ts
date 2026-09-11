import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomUUID } from 'node:crypto';

/* ---------------------------------------------------------------------------
   POST /api/lead
   Server-side lead handler for the AMR Free Roof Inspection funnel.

   - Never exposes GoHighLevel (LeadConnector) credentials to the browser.
   - Forwards a normalized payload to the GHL Inbound Webhook (Option A) at
     process.env.GHL_WEBHOOK_URL.
   - Mirrors the conversion to the Meta Conversions API (server-side), keyed by
     the same fb_event_id the browser pixel used so Meta deduplicates them.
   - Honeypot bot trap, server-side validation, and basic in-memory rate limit.

   Runs on the Node.js runtime (needs env access + outbound fetch).
--------------------------------------------------------------------------- */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---- Meta Conversions API (server-only env; never NEXT_PUBLIC_) -------------
const META_CAPI_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const META_DATASET_ID = process.env.META_DATASET_ID;
const META_TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE;
const GRAPH_VERSION = 'v21.0';

// ---- Basic in-memory rate limiting -----------------------------------------
// Per-instance only (serverless instances aren't shared), so this is a
// best-effort guard against bursts / naive scripts — not a distributed limiter.
const RATE_LIMIT_MAX = 5; // requests
const RATE_LIMIT_WINDOW_MS = 60_000; // per 60s per IP
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const recent = (hits.get(ip) || []).filter((t) => t > windowStart);
  recent.push(now);
  hits.set(ip, recent);

  // Opportunistic cleanup so the Map doesn't grow unbounded.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => t <= windowStart)) hits.delete(k);
    }
  }
  return recent.length > RATE_LIMIT_MAX;
}

function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

// ---- Helpers ----------------------------------------------------------------
const EMAIL_RE = /^\S+@\S+\.\S+$/;

/** Normalize a US phone number to E.164 (+1XXXXXXXXXX) when possible. */
function toE164(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  // Fall back to a "+"-prefixed digit string for anything else.
  return digits ? `+${digits}` : '';
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function sha256(v: string): string {
  return createHash('sha256').update(v).digest('hex');
}

// Meta normalization (trim + lowercase) then SHA-256 hex. Empty → undefined.
function hashed(v: string): string | undefined {
  const t = (v || '').trim().toLowerCase();
  return t ? sha256(t) : undefined;
}

type CapiArgs = {
  stage: 'contact' | 'complete';
  eventId: string;
  first: string;
  last: string;
  email: string;
  phoneDigits: string; // E.164 digits, no '+'
  city: string;
  zip: string;
  fbp: string;
  fbc: string;
  concern: string;
  timing: string;
  offers: string[];
  clientIp: string;
  userAgent: string;
  sourceUrl: string;
};

// Server-side Conversions API event. Deduplicates against the browser pixel via
// event_id. Best-effort: never throws, never blocks lead delivery, never logs
// the access token or raw PII.
async function sendCapiEvent(a: CapiArgs): Promise<void> {
  try {
    if (!META_CAPI_ACCESS_TOKEN || !META_DATASET_ID) {
      console.warn(
        `Meta Conversions API not configured (${
          !META_CAPI_ACCESS_TOKEN ? 'META_CAPI_ACCESS_TOKEN' : 'META_DATASET_ID'
        } missing) — skipping server event; GoHighLevel delivery is unaffected.`,
      );
      return;
    }

    const userData: Record<string, unknown> = {};
    const em = hashed(a.email);
    if (em) userData.em = em;
    if (a.phoneDigits) userData.ph = sha256(a.phoneDigits);
    const fn = hashed(a.first);
    if (fn) userData.fn = fn;
    const ln = hashed(a.last);
    if (ln) userData.ln = ln;
    const ct = hashed(a.city);
    if (ct) userData.ct = ct;
    if (a.zip) userData.zp = sha256(a.zip.trim().toLowerCase());
    userData.st = sha256('tx');
    userData.country = sha256('us');
    // Unhashed by design:
    if (a.fbp) userData.fbp = a.fbp;
    if (a.fbc) userData.fbc = a.fbc;
    if (a.clientIp && a.clientIp !== 'unknown') userData.client_ip_address = a.clientIp;
    if (a.userAgent) userData.client_user_agent = a.userAgent;

    const customData: Record<string, unknown> = { content_name: 'Free Roof Inspection Funnel' };
    if (a.concern) customData.concern = a.concern;
    if (a.timing) customData.timing = a.timing;
    if (a.offers.length) customData.offers = a.offers.join(', ');

    const event: Record<string, unknown> = {
      event_name: a.stage === 'complete' ? 'Lead' : 'Contact',
      event_time: Math.floor(Date.now() / 1000),
      event_id: a.eventId,
      action_source: 'website',
      user_data: userData,
      custom_data: customData,
    };
    if (a.sourceUrl) event.event_source_url = a.sourceUrl;

    const requestBody: Record<string, unknown> = {
      data: [event],
      access_token: META_CAPI_ACCESS_TOKEN,
    };
    if (META_TEST_EVENT_CODE) requestBody.test_event_code = META_TEST_EVENT_CODE;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    try {
      const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${META_DATASET_ID}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      if (!res.ok) {
        // Log status only — never the token or PII.
        console.error(`Meta Conversions API returned status ${res.status}.`);
      }
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    console.error('Meta Conversions API request failed:', err instanceof Error ? err.message : 'error');
  }
}

export async function POST(req: NextRequest) {
  // 1) Rate limit
  if (rateLimited(clientIp(req))) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests. Please wait a moment and try again.' },
      { status: 429 },
    );
  }

  // 2) Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  // 3) Honeypot — bots fill the hidden field. Pretend success and drop, but
  // LOG it so drops are visible in Vercel function logs (a silently dropped
  // real lead is otherwise invisible). "company" is the legacy field name from
  // bundles cached before the rename; no PII is logged.
  if (str(body.hp_field) || str(body.company)) {
    console.warn(
      `Honeypot triggered — submission dropped (stage: ${str(body.stage) || 'unknown'}, field: ${
        str(body.hp_field) ? 'hp_field' : 'company'
      }).`,
    );
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // 4) Server-side validation (mirrors the client rules)
  // `stage` is 'contact' for the first-touch capture at Step 2 (contact fields
  // only) or 'complete' for the finished submission (address required too).
  const stage = str(body.stage) === 'contact' ? 'contact' : 'complete';
  const first = str(body.first);
  const last = str(body.last);
  const email = str(body.email);
  const phoneRaw = str(body.phone);
  const address = str(body.address);
  const city = str(body.city);
  const zip = str(body.zip);
  const concern = str(body.concern);
  const timing = str(body.timing);
  const offers = Array.isArray(body.offers) ? body.offers.filter((o) => typeof o === 'string') : [];
  const urgentLeak = body.urgentLeak === true || concern === 'Active leak or water stain';

  // Attribution + Meta dedup id — all optional, forwarded as-is (never validated).
  const utmSource = str(body.utm_source);
  const utmMedium = str(body.utm_medium);
  const utmCampaign = str(body.utm_campaign);
  const utmContent = str(body.utm_content);
  const utmTerm = str(body.utm_term);
  const fbclid = str(body.fbclid);
  const fbp = str(body.fbp);
  const fbc = str(body.fbc);
  const fbEventId = str(body.fb_event_id);
  const gclid = str(body.gclid);
  const gbraid = str(body.gbraid);
  const wbraid = str(body.wbraid);
  const landingPage = str(body.landing_page);
  const referrer = str(body.referrer);
  const capturedAt = str(body.captured_at);

  // TCPA consent record (see lib/claims.ts for the paired text + version).
  const consentGiven = body.consent_given === true;
  const consentTimestamp = str(body.consent_timestamp);
  const consentTextVersion = str(body.consent_text_version);
  const consentPageUrl = str(body.consent_page_url);

  // Contact fields are always required.
  if (!first) return bad('Please enter your first name.');
  if (!last) return bad('Please enter your last name.');
  if (phoneRaw.replace(/\D/g, '').length < 10) return bad('Please enter a valid mobile phone number.');
  if (!EMAIL_RE.test(email)) return bad('Please enter a valid email address.');
  // Address is only required on the completed submission.
  if (stage === 'complete') {
    if (address.length < 5) return bad('Please enter your street address.');
    if (!/^\d{5}$/.test(zip)) return bad('Please enter a valid 5-digit ZIP code.');
  }

  const phone = toE164(phoneRaw);
  const offerInterests = offers.join(', ');

  // 5) Build the GHL payload (matches the handoff's documented shape).
  // Empty optional fields are omitted so an early 'contact' capture never
  // blanks out values a later 'complete' submission has already set.
  const payload: Record<string, unknown> = {
    firstName: first,
    lastName: last,
    phone,
    email,
    state: 'TX',
    urgentLeak,
    stage,
    source: 'Free Inspection Funnel',
  };
  if (address) payload.address1 = address;
  if (city) payload.city = city;
  if (zip) payload.postalCode = zip;
  if (concern) payload.concern = concern;
  if (timing) payload.timing = timing;
  if (offerInterests) payload.offerInterests = offerInterests;
  if (utmSource) payload.utm_source = utmSource;
  if (utmMedium) payload.utm_medium = utmMedium;
  if (utmCampaign) payload.utm_campaign = utmCampaign;
  if (utmContent) payload.utm_content = utmContent;
  if (utmTerm) payload.utm_term = utmTerm;
  if (fbclid) payload.fbclid = fbclid;
  if (fbp) payload.fbp = fbp;
  if (fbc) payload.fbc = fbc;
  if (fbEventId) payload.fb_event_id = fbEventId;
  if (gclid) payload.gclid = gclid;
  if (gbraid) payload.gbraid = gbraid;
  if (wbraid) payload.wbraid = wbraid;
  if (landingPage) payload.landing_page = landingPage;
  if (referrer) payload.referrer = referrer;
  if (capturedAt) payload.captured_at = capturedAt;
  payload.consent_given = consentGiven; // always sent, true/false
  if (consentTimestamp) payload.consent_timestamp = consentTimestamp;
  if (consentTextVersion) payload.consent_text_version = consentTextVersion;
  if (consentPageUrl) payload.consent_page_url = consentPageUrl;

  // 6) Forward to GoHighLevel
  const webhookUrl = process.env.GHL_WEBHOOK_URL;
  if (!webhookUrl) {
    // Misconfiguration: fail loudly in logs, but don't leak details to the client.
    console.error('GHL_WEBHOOK_URL is not set — lead was not forwarded.');
    return NextResponse.json(
      { ok: false, error: 'We can’t submit right now. Please call us and we’ll get you scheduled.' },
      { status: 500 },
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error('GHL webhook returned non-OK status:', res.status);
      return NextResponse.json(
        { ok: false, error: 'Something went wrong sending your request. Please try again.' },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error('Failed to reach GHL webhook:', err);
    return NextResponse.json(
      { ok: false, error: 'Something went wrong sending your request. Please try again.' },
      { status: 502 },
    );
  }

  // 7) Mirror the conversion to the Meta Conversions API (server-side).
  //    'complete' → Lead, reusing the browser's fb_event_id so Meta dedupes the
  //    two. 'contact' → a separate Contact event with its own server event id
  //    (never the complete-stage id). Best-effort: never blocks the response.
  const capiEventId = stage === 'complete' ? fbEventId || randomUUID() : randomUUID();
  await sendCapiEvent({
    stage,
    eventId: capiEventId,
    first,
    last,
    email,
    phoneDigits: phone.replace(/\D/g, ''), // '+1XXXXXXXXXX' → '1XXXXXXXXXX'
    city,
    zip,
    fbp,
    fbc,
    concern,
    timing,
    offers,
    clientIp: clientIp(req),
    userAgent: req.headers.get('user-agent') || '',
    sourceUrl: req.headers.get('referer') || '',
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}

function bad(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}
