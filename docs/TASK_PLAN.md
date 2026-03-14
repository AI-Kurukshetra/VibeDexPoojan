# VibeDex – Task Plan (Phases)

## Phase 1 – Foundation (Current)
- [x] Requirements doc (REQUIREMENTS.md)
- [x] DB schema design & Supabase script (run in SQL Editor)
- [x] Task plan (this file)
- [x] Login UI for Shipper & Carrier + test credentials

## Phase 2 – Auth & Profiles
- [ ] Sign up flow (Shipper / Carrier choice → create profile with role)
- [ ] Protected routes (middleware redirect by role)
- [ ] Profile + Company linkage (shipper company, carrier company)

## Phase 3 – Shipper: Loads
- [x] Load posting form (origin, destination, equipment, weight, dates, rate)
- [x] My Loads list (draft, posted, in-transit, delivered)
- [x] Load detail + view bids + accept/reject bid

## Phase 4 – Carrier: Load Board & Bidding
- [x] Load board (browse, link to load detail)
- [x] Place bid on load
- [x] My Bids list

## Phase 5 – Matching & Shipments
- [ ] Accept bid → create Shipment
- [ ] Shipment status flow (assigned → picked up → in transit → delivered)
- [ ] Basic tracking events (manual or later GPS)

## Phase 6 – Documents & Payments (Basic)
- [ ] Upload BOL / POD per shipment
- [ ] Basic invoice (per shipment) and payment status

## Phase 7 – Polish & Scale
- [ ] Notifications (in-app + optional email)
- [ ] Basic reporting (loads, shipments, revenue)
- [ ] Rate management (contracted vs spot)
- [ ] Audit log for key actions

---

**Current focus:** Phase 1 – DB script run karo, phir login UI se Shipper/Carrier login test karo.
