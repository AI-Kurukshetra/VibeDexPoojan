# VibeDex

Digital Freight Marketplace & TMS — shippers and carriers, one platform.

**Stack:** Next.js (App Router) · Supabase · Vercel (deploy)

---

## Setup

### 1. Install & run (no Supabase yet)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You’ll see “Supabase: add .env.local” until Step 2.

### 2. Connect Supabase

1. In [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Settings** → **API**
2. Copy **Project URL** and **anon public** key
3. In project root, create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Restart dev server (`Ctrl+C` then `npm run dev`). Home page will show “Supabase configured”.

---

## Project layout

- `src/app/` — App Router pages and layout
- `src/lib/supabase/` — Supabase client (browser), server client, and middleware (session refresh)
- `src/middleware.ts` — Session refresh for auth (next step)

---

## Next steps (your plan)

1. **Auth** — Login for Shipper and Carrier (Supabase Auth)
2. **Core features** — Load board, profiles, matching, etc.
3. **Deploy** — Vercel

Auth and features will come in the next prompts.
