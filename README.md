# Yardskapes — Marketing Website

**“Inspired by Nature, Perfected by Us.”**

A single-page marketing website for Yardskapes, a premium Houston estate-landscaping
company. Built with **Next.js 14 (App Router)**, TypeScript, Tailwind, and `lucide-react`,
recreated from the design handoff in a production-ready stack.

---

## 🧱 What's inside

```
app/
├── layout.tsx       # <html> shell, fonts, SEO metadata
├── page.tsx         # Page composition (Nav → Hero → … → Footer + QuoteModal)
└── globals.css      # Design tokens + UI-kit styles (lifted from the handoff)

components/site/
├── primitives.tsx   # Eyebrow, Btn, Mark, Photo, IconTick
├── Nav.tsx          # Sticky nav (frosts on scroll, mobile hamburger sheet)
├── Hero.tsx         # Photo hero + green overlay + stat strip
├── Services.tsx     # 6-up service card grid
├── SplitFeature.tsx # "Blueprint meets nature" split block
├── Process.tsx      # Dark 4-step process band
├── Gallery.tsx      # Drag-to-compare before/after + portfolio grid
├── Testimonial.tsx  # Serif pull quote
├── CTAFooter.tsx    # Final CTA band + footer
└── QuoteModal.tsx   # "Request a Walkthrough" lead-capture modal (with validation)

public/
├── assets/          # Brand logos & marks (PNG, transparent)
└── images/          # Photography (hero, before/after, split, gallery)
```

---

## 🚀 Run locally

**Prerequisites:** Node.js 18+ ([download](https://nodejs.org)).

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

Other scripts: `npm run build` (production build), `npm start` (serve the build),
`npm run lint`.

---

## ☁️ Deploy to Vercel (recommended)

This repo includes `vercel.json` and is configured for Next.js, so deployment is
essentially one click.

### Option A — Connect the GitHub repo (best for ongoing updates)

1. Create a free account at <https://vercel.com> (sign in with GitHub).
2. **Add New → Project**, then import this repository.
3. Vercel auto-detects Next.js — leave the defaults:
   - Build command: `npm run build`
   - Output: `.next`
   - Install: `npm install`
4. Click **Deploy**. You'll get a live `*.vercel.app` URL in ~60 seconds.
5. Every push to the default branch redeploys automatically; pull requests get
   preview URLs.

### Option B — Vercel CLI

```bash
npm install -g vercel
vercel          # preview deploy
vercel --prod   # production deploy
```

### Custom domain

In the Vercel project: **Settings → Domains → Add** (e.g. `yardskapes.com`) and
follow the DNS instructions. Once a domain is attached, set the env var below so
social-share/OG image URLs resolve correctly:

```
NEXT_PUBLIC_SITE_URL=https://yardskapes.com
```

(On Vercel, `VERCEL_URL` is used automatically if this isn't set.)

---

## 🖼️ Replacing photography

All photos live in `public/images/`. To swap one, replace the file (keep the same
name) or update the `src` in the relevant component:

| File | Used in |
|---|---|
| `hero.png` | Hero background (`components/site/Hero.tsx`) |
| `split-detail.png` | Split feature (`SplitFeature.tsx`) |
| `before.png` / `after.png` | Before/after slider (`Gallery.tsx`) |
| `gallery-*.png` | Portfolio cards (`Gallery.tsx`) |

Brand logos/marks live in `public/assets/`.

---

## 📨 The "Request a Walkthrough" form

The lead-capture modal (`components/site/QuoteModal.tsx`) validates input
(required name/email/address, email format, honeypot spam trap) and POSTs to the
API route at **`app/api/quote/route.ts`**, which emails every submission to
**moy@yardskapes.com** via [Resend](https://resend.com).

### Make it send (one-time setup)

1. Create a free account at <https://resend.com> and generate an **API key**.
2. In Vercel: **Settings → Environment Variables**, add:

   ```
   RESEND_API_KEY=<your key>
   ```

3. **Verify the `yardskapes.com` domain in Resend** (Resend → Domains → add DNS
   records — do this alongside the domain setup), then add:

   ```
   QUOTE_FROM_EMAIL=Yardskapes Website <noreply@yardskapes.com>
   ```

   Until the domain is verified, the form falls back to Resend's shared
   `onboarding@resend.dev` sender, which in test mode only delivers to the email
   that owns the Resend account.

4. Redeploy. Leads now arrive at `moy@yardskapes.com` (the customer's email is set
   as the reply-to, so you can reply directly).

Override the destination anytime with `QUOTE_TO_EMAIL`.

---

Built for Yardskapes · Houston, Texas
