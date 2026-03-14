-- ============================================================
-- VibeDex – Optional demo seed (run AFTER schema-mvp.sql and AFTER creating the 2 users in Auth)
-- Creates 2 companies and links shipper@ / carrier@ profiles to them.
-- ============================================================

INSERT INTO public.companies (name, type) VALUES
  ('Demo Shipper Co', 'shipper'),
  ('Demo Carrier Co', 'carrier')
ON CONFLICT DO NOTHING;

-- Link profiles by email (so we don't need to know user UUIDs)
UPDATE public.profiles p
SET company_id = (SELECT id FROM public.companies WHERE type = 'shipper' LIMIT 1)
WHERE p.email = 'shipper@vibedex.com';

UPDATE public.profiles p
SET company_id = (SELECT id FROM public.companies WHERE type = 'carrier' LIMIT 1)
WHERE p.email = 'carrier@vibedex.com';
