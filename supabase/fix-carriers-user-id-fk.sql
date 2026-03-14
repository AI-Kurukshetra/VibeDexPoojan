-- ============================================================
-- Fix: carriers → app_users (profile_id hatao, user_id use karo)
-- Supabase SQL Editor me sab steps ek ke baad ek run karo.
-- Agar "violates foreign key" aaye to pehle ye 3 lines chalao:
--   DELETE FROM public.bids;
--   DELETE FROM public.shipments;
--   DELETE FROM public.carriers;
-- phir step 3 dobara chalao.
-- ============================================================

-- 1. Purana FK hatao (profile_id → profiles)
ALTER TABLE public.carriers
  DROP CONSTRAINT IF EXISTS carriers_profile_id_fkey;

-- 2. Column rename: profile_id → user_id (agar column abhi profile_id hai)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'carriers' AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE public.carriers RENAME COLUMN profile_id TO user_id;
  END IF;
END $$;

-- 3. Naya FK: user_id → app_users
ALTER TABLE public.carriers
  DROP CONSTRAINT IF EXISTS carriers_user_id_fkey;

ALTER TABLE public.carriers
  ADD CONSTRAINT carriers_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.app_users(id) ON DELETE CASCADE;
