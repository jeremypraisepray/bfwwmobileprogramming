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

## 📨 Wiring the "Request a Walkthrough" form

The lead-capture modal (`components/site/QuoteModal.tsx`) currently validates
input (required name/email/address, email format, honeypot spam trap) and shows a
success state after a simulated submit. **Before launch**, point it at a real
destination — see the `TODO` in `QuoteModal.tsx`'s `submit()`:

1. Add an API route (e.g. `app/api/quote/route.ts`) or use a form service
   (Formspree, Resend, a CRM webhook, etc.).
2. `POST` the form payload and only show the success state on a `2xx` response.
3. Optionally add analytics events on modal open + submit.

---

Built for Yardskapes · Houston, Texas
