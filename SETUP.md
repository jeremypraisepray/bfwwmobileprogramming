# Setup & Deploy — AMR Free Roof Inspection Funnel

A production Next.js (App Router, TypeScript) lead-capture funnel for American
Master Roofing. The multi-step form submits to a serverless route
(`app/api/lead/route.ts`) that forwards leads to GoHighLevel (LeadConnector).
GoHighLevel is **never** called from the browser.

---

## 1. Run locally

```bash
npm install
cp .env.example .env.local     # then fill in GHL_WEBHOOK_URL (step 3)
npm run dev                    # http://localhost:3000
```

Production build check:

```bash
npm run build && npm start
```

---

## 2. Push to GitHub

The project already lives in this repo. To publish it to a fresh GitHub repo
instead, from the project root:

```bash
git init                       # only if not already a git repo
git add -A
git commit -m "AMR free roof inspection funnel"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

`.env*.local` is gitignored — real secrets never get committed.

---

## 3. Create the GoHighLevel Inbound Webhook (Option A — recommended)

1. In GoHighLevel: **Automation → Workflows → Create Workflow**.
2. Add a trigger: **Inbound Webhook**. Copy the generated webhook URL — this is
   your `GHL_WEBHOOK_URL`.
3. Submit one test lead through the funnel (or `npm run dev` locally with the URL
   set), then in the workflow trigger click **"Check for new requests"** to
   capture the sample payload and map the fields below.
4. Add workflow actions:
   - **Create/Update Contact** (map `firstName`, `lastName`, `phone`, `email`,
     `address1`, `city`, `postalCode`, `state`).
   - **Add Tag** `inspection-request`.
   - **If/Else** on `urgentLeak = true` → **Add Tag** `active-leak-priority`.
   - Optional: **Create Opportunity** in your pipeline, plus an internal
     notification / SMS autoresponder.

> **Map fields using a _complete_ test lead.** When you click "Check for new
> requests", walk the whole funnel to the end so the sample payload contains
> every field (see the early-capture note below).

The route POSTs this JSON shape to the webhook:

```json
{
  "firstName": "...", "lastName": "...", "phone": "+1XXXXXXXXXX", "email": "...",
  "address1": "...", "city": "...", "postalCode": "...", "state": "TX",
  "concern": "...", "timing": "...", "offerInterests": "a, b, c",
  "urgentLeak": true, "stage": "complete", "source": "Free Inspection Funnel",
  "lead_source": "meta-landing-page", "utm_source": "meta", "utm_campaign": "...",
  "click_id": "...", "landing_page": "https://.../", "referrer": "...",
  "last_lead_source": "google-landing-page", "last_utm_source": "google",
  "last_utm_campaign": "...", "last_click_id": "...", "gclid": "..."
}
```

> Phone is normalized to E.164 (`+1XXXXXXXXXX`) server-side before it is sent.

### Two-stage lead capture (don't lose drop-offs)

The funnel POSTs to `/api/lead` **twice**:

1. **`stage: "contact"`** — fired the moment someone finishes Step 2 (name,
   phone, email, concern). This is a "first-touch" capture so a lead is saved
   even if the visitor abandons before finishing. Address/timing/offers aren't
   collected yet, so those fields are **omitted** from this payload.
2. **`stage: "complete"`** — fired on the final step with the full record.

Because GoHighLevel's **Create/Update Contact** action upserts by email/phone,
the second call updates the same contact — it doesn't create a duplicate. The
partial call omits the not-yet-collected fields, so it never blanks out data the
complete call fills in.

Optional GHL tagging using `stage`:
- Tag every lead `inspection-request` on both stages.
- Add a `completed-funnel` tag only when `stage = "complete"`. Any contact with
  `inspection-request` but **without** `completed-funnel` is a drop-off you can
  follow up on.

### Attribution fields (first + last touch)

Every lead also carries campaign attribution (`lib/touchAttribution.ts`, kept
in the browser's localStorage for 90 days):

| Fields | Meaning |
| --- | --- |
| `lead_source`, `utm_*`, `click_id`, `landing_page`, `referrer` | **First touch** — the campaign that introduced the visitor. Never overwritten inside the 90 days. |
| `last_lead_source`, `last_utm_*`, `last_click_id` | **Last touch** — the most recent campaign click. Advances whenever a visit arrives with a `utm_*` param or a click id; a direct return doesn't count. |

Example: first lands from Meta, later returns from a Google ad and books →
`utm_source: meta`, `last_utm_source: google`. On a single visit both match.

`lead_source` / `last_lead_source` map `utm_source` to: `meta`/`facebook` →
`meta-landing-page`, `tiktok` → `tiktok-landing-page`, `google` →
`google-landing-page`, anything else or none → `organic-direct`. `click_id`
is the first of `fbclid`, `ttclid`, `gclid`, `msclkid` on the landing URL;
`landing_page` is the full URL without the query string.

`gclid` / `gbraid` / `wbraid` and `fbclid` / `fbp` / `fbc` are unchanged (from
`lib/attribution.ts`): the Google ids follow the latest Google Ads click so
conversions match in Google Ads.

### Google Ads conversion timing

The Google Ads conversion fires when the **contact** capture returns OK, so a
lead counts even if they drop off before the last step. It fires at most once
per browser session; if the contact capture failed, it fires on the successful
final submit instead.

### Confirmation screen: call-or-book offer

After submission the confirmation screen ("Act now. Claim your savings.")
offers two ways to save on a full roof replacement, only if they act now:

- **Option 1 — Call now: $1,000 cash back** for calling before the team
  contacts them. The button and number dial `BUSINESS.phoneHref`.
- **Option 2 — Book now: extra 7% off** for booking a free inspection online
  for today or tomorrow. The button opens the GHL booking page (`BOOKING_URL`
  at the top of `components/Funnel.tsx`), prefilled with the lead's name,
  email and phone.

The offer copy lives in the confirmation block of `components/Funnel.tsx`; the
`.amr-offer*` styles are in `app/globals.css`.

**Option B (API v2 direct upsert)** is documented in the design handoff. If you
prefer it, swap the webhook `fetch` in `app/api/lead/route.ts` for a call to
`POST https://services.leadconnectorhq.com/contacts/upsert` with
`Authorization: Bearer <GHL_TOKEN>` and `Version: 2021-07-28`, and set
`GHL_TOKEN` + `GHL_LOCATION_ID` as env vars instead of `GHL_WEBHOOK_URL`.

---

## 4. Import into Vercel

1. Go to **vercel.com → Add New → Project** and import the GitHub repo.
2. Framework preset auto-detects **Next.js**. Leave build/output defaults
   (already pinned in `vercel.json`).
3. Under **Environment Variables**, add:

   | Name              | Value                                   | Environments               |
   | ----------------- | --------------------------------------- | -------------------------- |
   | `GHL_WEBHOOK_URL` | *(your GHL Inbound Webhook URL)*        | Production, Preview, Dev   |

4. Click **Deploy**.

To change env vars later: **Project → Settings → Environment Variables**, then
**redeploy** (env changes require a new deployment to take effect).

---

## 5. Point your domain at Vercel

1. In Vercel: **Project → Settings → Domains → Add**, e.g.
   `inspect.americanmasterroofing.com`.
2. Vercel shows the DNS record to create. For a subdomain, add a **CNAME**:

   | Type  | Name      | Value                  |
   | ----- | --------- | ---------------------- |
   | CNAME | `inspect` | `cname.vercel-dns.com` |

   (For a root/apex domain, use the **A record** Vercel provides instead.)
3. Add the record at your DNS provider. Vercel verifies and issues HTTPS
   automatically — usually within minutes.
4. Optional: set `NEXT_PUBLIC_SITE_URL` to the final URL (e.g.
   `https://inspect.americanmasterroofing.com`) so page metadata uses it, then
   redeploy.

---

## Notes

- **Images:** large source PNGs were converted to WebP under `public/assets/`
  (`mobile1` 6.7 MB → ~0.36 MB, etc.). `next/image` further serves AVIF/WebP at
  responsive sizes per request. On Vercel the `sharp` optimizer is provided
  automatically — no action needed.
- **Anti-spam:** the API route includes a hidden honeypot field, full
  server-side validation, and a basic per-IP in-memory rate limit (5 requests /
  60s). The rate limit is per serverless instance (best-effort); for stronger
  protection put the route behind Vercel's rate limiting / a KV-backed limiter.
- **Draft persistence:** in-progress answers auto-save to `localStorage`
  (`amr-funnel-draft`) and clear on successful submit.
