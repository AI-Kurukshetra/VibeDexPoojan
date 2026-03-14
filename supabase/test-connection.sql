-- ============================================================
-- VibeDex / Transfix — Connection test
-- Run this in Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Create a simple test table
CREATE TABLE IF NOT EXISTS public.connection_test (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL DEFAULT 'Hello from Supabase',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security (RLS) — good practice from day 1
ALTER TABLE public.connection_test ENABLE ROW LEVEL SECURITY;

-- 3. Allow read for anon (so Next.js with anon key can read)
CREATE POLICY "Allow anon read on connection_test"
  ON public.connection_test
  FOR SELECT
  TO anon
  USING (true);

-- 4. Insert one row so we have something to fetch
INSERT INTO public.connection_test (message)
VALUES ('VibeDex + Supabase connected!')
ON CONFLICT DO NOTHING;

-- 5. Optional: see the row
SELECT * FROM public.connection_test;
