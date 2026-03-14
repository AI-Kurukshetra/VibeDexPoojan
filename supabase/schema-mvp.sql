-- ============================================================
-- VibeDex MVP – Full schema (run in Supabase SQL Editor)
-- Run once. Creates tables, RLS, trigger for auth → profiles.
-- ============================================================

-- ---------------------------------------------------------------------------
-- 1. COMPANIES (shipper or carrier company) – created first (profiles references this)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 2. PROFILES (extends auth.users; role = shipper | carrier)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'shipper' CHECK (role IN ('shipper', 'carrier', 'admin')),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. EQUIPMENT TYPES (dry van, reefer, etc.)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 4. LOCATIONS (pickup/delivery addresses)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 5. LOADS (shipper posts; origin, destination, equipment, rate)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_loads_pickup ON public.loads(pickup_after);

-- ---------------------------------------------------------------------------
-- 6. CARRIERS (carrier profile; links profile + company + equipment)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  dot_number TEXT,
  mc_number TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Carrier can have multiple equipment types (junction)
CREATE TABLE IF NOT EXISTS public.carrier_equipment (
  carrier_id UUID NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
  equipment_type_id UUID NOT NULL REFERENCES public.equipment_types(id) ON DELETE CASCADE,
  PRIMARY KEY (carrier_id, equipment_type_id)
);

-- ---------------------------------------------------------------------------
-- 7. BIDS (carrier bids on load)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 8. SHIPMENTS (accepted bid → one shipment per load)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 9. DOCUMENTS (BOL, POD, invoice)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bol', 'pod', 'invoice', 'other')),
  file_url TEXT NOT NULL,
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 10. TRACKING EVENTS (per shipment)
-- ---------------------------------------------------------------------------
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
-- Trigger: create profile when auth user is created
-- Set role via Auth Dashboard → User metadata: { "full_name": "...", "role": "shipper" | "carrier" }
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'shipper')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_equipment ENABLE ROW LEVEL SECURITY;

-- Profiles: own row only
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Companies: read/write own (by profile linkage)
CREATE POLICY "Users can read companies"
  ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert companies"
  ON public.companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update companies they belong to"
  ON public.companies FOR UPDATE TO authenticated
  USING (id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Equipment types: read for all
CREATE POLICY "Anyone can read equipment_types"
  ON public.equipment_types FOR SELECT TO authenticated USING (true);

-- Locations: read all; insert/update for authenticated
CREATE POLICY "Authenticated read locations"
  ON public.locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert locations"
  ON public.locations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update locations"
  ON public.locations FOR UPDATE TO authenticated USING (true);

-- Loads: shipper sees own; carriers see posted
CREATE POLICY "Shipper can manage own loads"
  ON public.loads FOR ALL TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR created_by = auth.uid()
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR created_by = auth.uid()
  );
CREATE POLICY "Carriers can read posted loads"
  ON public.loads FOR SELECT TO authenticated
  USING (status = 'posted');

-- Carriers: own row
CREATE POLICY "Users can read carriers"
  ON public.carriers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Carrier can insert own"
  ON public.carriers FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Carrier can update own"
  ON public.carriers FOR UPDATE TO authenticated USING (profile_id = auth.uid());

-- Carrier equipment
CREATE POLICY "Read carrier_equipment"
  ON public.carrier_equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "Carrier manage own equipment"
  ON public.carrier_equipment FOR ALL TO authenticated
  USING (carrier_id IN (SELECT id FROM public.carriers WHERE profile_id = auth.uid()))
  WITH CHECK (carrier_id IN (SELECT id FROM public.carriers WHERE profile_id = auth.uid()));

-- Bids: carrier sees own; shipper sees bids on their loads
CREATE POLICY "Carrier can manage own bids"
  ON public.bids FOR ALL TO authenticated
  USING (carrier_id IN (SELECT id FROM public.carriers WHERE profile_id = auth.uid()))
  WITH CHECK (carrier_id IN (SELECT id FROM public.carriers WHERE profile_id = auth.uid()));
CREATE POLICY "Shipper can read bids on own loads"
  ON public.bids FOR SELECT TO authenticated
  USING (
    load_id IN (
      SELECT id FROM public.loads
      WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
         OR created_by = auth.uid()
    )
  );
CREATE POLICY "Shipper can update bid status (accept/reject)"
  ON public.bids FOR UPDATE TO authenticated
  USING (
    load_id IN (
      SELECT id FROM public.loads
      WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
         OR created_by = auth.uid()
    )
  );

-- Shipments: shipper and carrier involved can read/update
CREATE POLICY "Shipper and carrier can read shipments"
  ON public.shipments FOR SELECT TO authenticated
  USING (
    load_id IN (SELECT id FROM public.loads WHERE created_by = auth.uid() OR company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
    OR carrier_id IN (SELECT id FROM public.carriers WHERE profile_id = auth.uid())
  );
CREATE POLICY "Carrier can update own shipment status"
  ON public.shipments FOR UPDATE TO authenticated
  USING (carrier_id IN (SELECT id FROM public.carriers WHERE profile_id = auth.uid()));

-- Documents: same as shipments
CREATE POLICY "Read documents for own shipments"
  ON public.documents FOR SELECT TO authenticated
  USING (
    shipment_id IN (
      SELECT s.id FROM public.shipments s
      JOIN public.loads l ON l.id = s.load_id
      LEFT JOIN public.profiles p ON p.id = auth.uid()
      WHERE l.created_by = auth.uid() OR l.company_id = p.company_id
         OR s.carrier_id IN (SELECT id FROM public.carriers WHERE profile_id = auth.uid())
    )
  );
CREATE POLICY "Carrier can insert documents for own shipment"
  ON public.documents FOR INSERT TO authenticated
  WITH CHECK (
    shipment_id IN (SELECT id FROM public.shipments WHERE carrier_id IN (SELECT id FROM public.carriers WHERE profile_id = auth.uid()))
  );

-- Tracking events: read for involved parties
CREATE POLICY "Read tracking for own shipments"
  ON public.tracking_events FOR SELECT TO authenticated
  USING (
    shipment_id IN (
      SELECT s.id FROM public.shipments s
      JOIN public.loads l ON l.id = s.load_id
      WHERE l.created_by = auth.uid() OR l.company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
         OR s.carrier_id IN (SELECT id FROM public.carriers WHERE profile_id = auth.uid())
    )
  );
CREATE POLICY "Carrier can insert tracking"
  ON public.tracking_events FOR INSERT TO authenticated
  WITH CHECK (
    shipment_id IN (SELECT id FROM public.shipments WHERE carrier_id IN (SELECT id FROM public.carriers WHERE profile_id = auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- Optional: demo companies (no auth users created here – do in Dashboard)
-- After creating 2 users in Auth, run a second script or link companies manually.
-- ---------------------------------------------------------------------------
-- INSERT INTO public.companies (id, name, type) VALUES
--   ('00000000-0000-0000-0000-000000000001', 'Demo Shipper Co', 'shipper'),
--   ('00000000-0000-0000-0000-000000000002', 'Demo Carrier Co', 'carrier');
-- Then in Dashboard set profiles.company_id after users exist.

-- ============================================================
-- DONE. Next steps:
-- 1. In Supabase Dashboard → Authentication → Users → Add user (x2):
--    User 1: shipper@vibedex.com  | Password: VibeDexShipper1!  | Metadata: {"full_name":"Demo Shipper","role":"shipper"}
--    User 2: carrier@vibedex.com | Password: VibeDexCarrier1!   | Metadata: {"full_name":"Demo Carrier","role":"carrier"}
-- 2. Trigger will create profiles. Optionally link company_id later.
-- ============================================================
