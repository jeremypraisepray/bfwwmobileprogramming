import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/* Lead-capture endpoint for the "Request a Walkthrough" modal.
   Sends every submission to the Yardskapes inbox via Resend.

   Required env var:
     RESEND_API_KEY      — from https://resend.com (free tier is fine)
   Optional env vars:
     QUOTE_TO_EMAIL      — where leads are delivered (default below)
     QUOTE_FROM_EMAIL    — verified sender (must be on a Resend-verified domain;
                           defaults to Resend's shared onboarding sender, which
                           in test mode only delivers to the account owner).
*/

const TO_EMAIL = process.env.QUOTE_TO_EMAIL || 'moy@yardskapes.com';
const FROM_EMAIL = process.env.QUOTE_FROM_EMAIL || 'Yardskapes Website <onboarding@resend.dev>';

type Payload = { name?: string; addr?: string; email?: string; service?: string; company?: string };

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const clean = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, 2000) : '');
const esc = (v: string) => v.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));

export async function POST(req: Request) {
  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // Honeypot: real users never fill this. Pretend success so bots don't retry.
  if (clean(body.company)) return NextResponse.json({ ok: true });

  const name = clean(body.name);
  const addr = clean(body.addr);
  const email = clean(body.email);
  const service = clean(body.service) || 'Not specified';

  if (!name || !addr || !email) {
    return NextResponse.json({ error: 'Name, property address, and email are required.' }, { status: 422 });
  }
  if (!isEmail(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 422 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[quote] RESEND_API_KEY is not set — cannot send lead email.');
    return NextResponse.json({ error: 'The form is not configured yet. Please call us instead.' }, { status: 503 });
  }

  const html = `
    <h2 style="font-family:Arial,sans-serif;color:#204028;">New walkthrough request</h2>
    <table style="font-family:Arial,sans-serif;font-size:15px;color:#11201A;border-collapse:collapse;">
      <tr><td style="padding:4px 16px 4px 0;color:#6B756C;">Name</td><td>${esc(name)}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#6B756C;">Property address</td><td>${esc(addr)}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#6B756C;">Email</td><td>${esc(email)}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#6B756C;">Interested in</td><td>${esc(service)}</td></tr>
    </table>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#97A096;">Sent from the Yardskapes website.</p>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: email,
        subject: `Walkthrough request — ${name}`,
        html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('[quote] Resend error', res.status, detail);
      return NextResponse.json({ error: 'We could not send your request. Please try again or call us.' }, { status: 502 });
    }
  } catch (err) {
    console.error('[quote] send failed', err);
    return NextResponse.json({ error: 'We could not send your request. Please try again or call us.' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
