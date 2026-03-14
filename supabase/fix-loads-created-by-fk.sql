-- ============================================================
-- Fix: loads.created_by → app_users (ab profiles nahi)
-- Supabase SQL Editor me pehle step 1, phir step 2 run karo.
-- Agar step 2 pe error aaye to pehle: DELETE FROM public.loads;
-- phir step 2 dobara chalao.
-- ============================================================

-- 1. Drop the old foreign key (pointing to profiles)
ALTER TABLE public.loads
  DROP CONSTRAINT IF EXISTS loads_created_by_fkey;

-- 2. Add new foreign key to app_users
ALTER TABLE public.loads
  ADD CONSTRAINT loads_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.app_users(id) ON DELETE CASCADE;
