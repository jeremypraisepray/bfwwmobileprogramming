# Break Free Worldwide CRM
### Mobile Programming Lead Management System

A clean, fast, and beginner-friendly CRM built specifically for the Break Free Worldwide sales and marketing team.

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+ installed ([download here](https://nodejs.org))
- A terminal (Terminal on Mac, Command Prompt on Windows)

### Steps

1. **Open a terminal and navigate to this folder:**
   ```bash
   cd bfw-crm
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser and visit:**
   ```
   http://localhost:3000
   ```

That's it! The app runs fully in your browser — no database setup needed. All data is saved to your browser's local storage.

---

## ☁️ Deploying to Vercel (Free)

Vercel is the easiest way to put this app online so your whole team can use it.

### Option A: Deploy via GitHub (Recommended)

1. **Create a free account** at [vercel.com](https://vercel.com)
2. **Push this project to GitHub:**
   - Go to [github.com/new](https://github.com/new) and create a new repo
   - Follow GitHub's instructions to push the code
3. **Connect to Vercel:**
   - In Vercel, click "Add New Project"
   - Import your GitHub repo
   - Click **Deploy** — that's it!

### Option B: Deploy via Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts. Your app will be live in ~60 seconds.

### ⚠️ Important Note on Data Storage

This V1 uses **browser local storage**. This means:
- Each team member's browser stores their own data separately
- Data does not sync across devices or team members
- Clearing browser data will erase leads

**For a shared team database**, upgrade to V2 with a backend (Supabase or PlanetScale recommended — both have free tiers).

---

## 📁 File Structure

```
bfw-crm/
├── app/                      # All pages (Next.js App Router)
│   ├── page.tsx              # Dashboard
│   ├── pipeline/page.tsx     # Kanban Pipeline Board
│   ├── leads/page.tsx        # All Leads Table
│   ├── follow-ups/page.tsx   # Follow-Ups Due Today
│   ├── categories/page.tsx   # Leads by Category
│   ├── closed/page.tsx       # Closed Deals
│   ├── layout.tsx            # App shell (sidebar + providers)
│   └── globals.css           # Global styles
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx       # Left nav sidebar
│   │   └── PageHeader.tsx    # Page title + action buttons
│   ├── ui/
│   │   ├── Badge.tsx         # Status badges
│   │   ├── Button.tsx        # Buttons
│   │   └── Modal.tsx         # Modal dialog
│   └── leads/
│       ├── LeadCard.tsx      # Card for pipeline board
│       ├── LeadDetail.tsx    # Full lead view + activity log
│       └── LeadForm.tsx      # Add/edit lead form
│
├── lib/
│   ├── types.ts              # TypeScript types + seed data + constants
│   ├── context.tsx           # Global state management
│   └── utils.ts              # Helper functions
│
├── tailwind.config.js
├── tsconfig.json
├── next.config.js
└── package.json
```

---

## 🎯 How to Use

### Adding a Lead
Click **"Add Lead"** from any page. Fill in the organization name and contact — everything else is optional but helpful.

### Moving a Lead Through the Pipeline
- **Pipeline Board**: Drag the lead card to a new column
- **Lead Detail**: Open a lead and use the "Move to Stage" dropdown

### Logging Activity
1. Click any lead to open its detail panel
2. Click **"Log Activity"**
3. Select the activity type, date, and write your notes
4. Click **Save Activity**

### Tracking Follow-Ups
Set a "Next Follow-Up Date" on any lead. The **Follow-Ups** page will show you everything due today, overdue items, and what's coming in the next 7 days.

---

## 📊 Mobile Programming Categories

| Category | Description |
|----------|-------------|
| School Programs | K-12 schools, districts, after-school |
| Performances | Live shows, showcases, stage events |
| Corporate | Brand activations, partnerships, events |
| Workshops | Classes, workshops, hands-on training |

---

## 🔄 Upgrading to V2 (Shared Team Database)

When you're ready to have all team members share the same data, the recommended upgrade path is:

1. **Supabase** (free tier) — PostgreSQL database with a simple API
2. Replace the `localStorage` calls in `lib/context.tsx` with Supabase fetch calls
3. Estimated effort: 2–4 hours for a developer

---

Built with ❤️ for Break Free Worldwide
