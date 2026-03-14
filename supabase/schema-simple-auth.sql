-- ============================================================
-- VibeDex – Simple auth (NO Supabase Auth)
-- Run this in Supabase SQL Editor. One table: app_users (email + password).
-- Agar pehle schema-mvp.sql (profiles + Auth) chala tha, to naya project use karo
-- ya pehle profiles/loads/carriers wagaira drop karke phir ye script chalao.
-- ============================================================

-- 0. Connection test (for home page status)
CREATE TABLE IF NOT EXISTS public.connection_test (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL DEFAULT 'Hello from Supabase',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.connection_test ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read connection_test" ON public.connection_test FOR SELECT TO anon USING (true);
INSERT INTO public.connection_test (message)
SELECT 'VibeDex + Supabase connected!' WHERE NOT EXISTS (SELECT 1 FROM public.connection_test LIMIT 1);

-- 1. COMPANIES
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('shipper', 'carrier')),
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'US',
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. APP_USERS (simple login – email + password, role)
CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'shipper' CHECK (role IN ('shipper', 'carrier', 'admin')),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. EQUIPMENT TYPES
CREATE TABLE IF NOT EXISTS public.equipment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.equipment_types (code, name) VALUES
  ('dry_van', 'Dry Van'),
  ('reefer', 'Reefer'),
  ('flatbed', 'Flatbed'),
  ('step_deck', 'Step Deck'),
  ('hotshot', 'Hotshot')
ON CONFLICT (code) DO NOTHING;

-- 4. LOCATIONS
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  country TEXT DEFAULT 'US',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. LOADS (created_by → app_users)
CREATE TABLE IF NOT EXISTS public.loads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  origin_location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
  dest_location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
  equipment_type_id UUID NOT NULL REFERENCES public.equipment_types(id) ON DELETE RESTRICT,
  weight_lbs NUMERIC(12,2),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'assigned', 'in_transit', 'delivered', 'cancelled')),
  offered_rate NUMERIC(12,2),
  currency TEXT DEFAULT 'USD',
  pickup_after TIMESTAMPTZ,
  deliver_by TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_loads_company ON public.loads(company_id);
CREATE INDEX IF NOT EXISTS idx_loads_status ON public.loads(status);

-- 6. CARRIERS (user_id → app_users)
CREATE TABLE IF NOT EXISTS public.carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.app_users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  dot_number TEXT,
  mc_number TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.carrier_equipment (
  carrier_id UUID NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
  equipment_type_id UUID NOT NULL REFERENCES public.equipment_types(id) ON DELETE CASCADE,
  PRIMARY KEY (carrier_id, equipment_type_id)
);

-- 7. BIDS
CREATE TABLE IF NOT EXISTS public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
  carrier_id UUID NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(load_id, carrier_id)
);
CREATE INDEX IF NOT EXISTS idx_bids_load ON public.bids(load_id);
CREATE INDEX IF NOT EXISTS idx_bids_carrier ON public.bids(carrier_id);

-- 8. SHIPMENTS
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID NOT NULL UNIQUE REFERENCES public.loads(id) ON DELETE CASCADE,
  carrier_id UUID NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
  bid_id UUID NOT NULL REFERENCES public.bids(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'picked_up', 'in_transit', 'delivered')),
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shipments_carrier ON public.shipments(carrier_id);

-- 9. DOCUMENTS
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bol', 'pod', 'invoice', 'other')),
  file_url TEXT NOT NULL,
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. TRACKING EVENTS
CREATE TABLE IF NOT EXISTS public.tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  location_description TEXT,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tracking_shipment ON public.tracking_events(shipment_id);

-- ---------------------------------------------------------------------------
-- RLS: allow anon to read/write (app filters by user from cookie). Simple.
-- app_users: no anon access (login only via server with service_role).
-- ---------------------------------------------------------------------------
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_equipment ENABLE ROW LEVEL SECURITY;

-- app_users: only service_role can read (used in login API)
CREATE POLICY "app_users no anon" ON public.app_users FOR ALL TO anon USING (false);

-- Rest: allow all for anon (app will filter by session user id in code)
CREATE POLICY "companies all" ON public.companies FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "equipment_types all" ON public.equipment_types FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "locations all" ON public.locations FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "loads all" ON public.loads FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "carriers all" ON public.carriers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "carrier_equipment all" ON public.carrier_equipment FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "bids all" ON public.bids FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "shipments all" ON public.shipments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "documents all" ON public.documents FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "tracking_events all" ON public.tracking_events FOR ALL TO anon USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- SEED: 2 companies + 2 users (plain password – dev only)
-- Shipper: shipper@vibedex.com / VibeDexShipper1!
-- Carrier: carrier@vibedex.com / VibeDexCarrier1!
-- ---------------------------------------------------------------------------
INSERT INTO public.companies (id, name, type) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Demo Shipper Co', 'shipper'),
  ('a0000000-0000-0000-0000-000000000002', 'Demo Carrier Co', 'carrier')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.app_users (id, email, password, full_name, role, company_id) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'shipper@vibedex.com', 'VibeDexShipper1!', 'Demo Shipper', 'shipper', 'a0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000002', 'carrier@vibedex.com', 'VibeDexCarrier1!', 'Demo Carrier', 'carrier', 'a0000000-0000-0000-0000-000000000002')
ON CONFLICT (email) DO NOTHING;

-- If companies table has no unique on (id), ON CONFLICT DO NOTHING might need (id). Adjust if you get errors.
-- ============================================================
-- DONE. Login: email + password from app_users. No Supabase Auth.
-- Add to .env.local: SUPABASE_SERVICE_ROLE_KEY (for login check), SESSION_SECRET (any random string)
-- ============================================================
