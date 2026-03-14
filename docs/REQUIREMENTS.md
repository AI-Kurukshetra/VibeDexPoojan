# VibeDex – Requirements & Blueprint

**Source:** Transfix-style Digital Freight Marketplace & TMS  
**Domain:** Logistics | Freight Brokerage & Digital Freight  
**Generated from:** transfix_blueprint_20260311_004342.pdf

---

## 1. Executive Summary

Digital freight platforms replace traditional freight brokerage by connecting **shippers** with **carriers** through:

- AI-powered matching
- Real-time tracking
- Automated operations

**Market:** $800B+ freight industry moving from phone-based manual process to digital platforms.

**VibeDex** is positioned as a Digital Freight Marketplace & TMS (Transportation Management System).

---

## 2. Core Features (Must-Have)

| # | Feature | Description | Complexity |
|---|---------|-------------|------------|
| 1 | **User Auth & Roles** | Multi-tenant: shippers, carriers, brokers, admin; granular permissions | Medium |
| 2 | **Load Posting & Management** | Shippers create/edit loads: specs, pickup/delivery, requirements | Medium |
| 3 | **Carrier Network & Profiles** | Carrier DB: equipment, service areas, ratings, compliance, capacity | Medium |
| 4 | **Real-time Load Board** | Carriers browse, filter, bid on loads; instant updates | Medium |
| 5 | **Automated Pricing Engine** | Dynamic pricing: market, distance, equipment, urgency, history | High |
| 6 | **Smart Carrier Matching** | Match loads to carriers by location, capacity, ratings | High |
| 7 | **Digital Documentation** | BOLs, PODs, invoices, e-signature | Medium |
| 8 | **GPS Tracking & Visibility** | Real-time tracking, ETA, geofencing, delivery notifications | Medium |
| 9 | **Payment & Settlement** | Invoicing, payments, settlement, escrow | High |
| 10 | **Mobile Apps** | Native apps for carriers/drivers: loads, status, delivery proof | Medium |
| 11 | **Notifications & Alerts** | Status, delays, exceptions | Low |
| 12 | **Reporting & Analytics** | Shipment performance, costs, carrier KPIs | Medium |
| 13 | **Customer Support Portal** | Ticketing, chat, knowledge base | Low |
| 14 | **Rate Management** | Contracted rates, spot pricing, negotiations | Medium |

---

## 3. Important Features (Post-MVP)

- Capacity planning tools  
- Integration APIs (ERP, WMS, TMS)  
- Audit trail & compliance  
- Multi-stop route optimization  
- Equipment matching  
- Insurance management  
- Load optimization engine  
- Dispute resolution  
- Performance scorecards  

---

## 4. Data Model (Key Entities)

- **Users** (auth + profile with role)
- **Companies** (shipper / carrier)
- **Loads** (freight posts by shipper)
- **Shipments** (accepted load → carrier)
- **Carriers** (carrier profile + company)
- **Drivers** / **Vehicles** / **Trailers**
- **Routes** / **Locations**
- **Rates** / **Invoices** / **Payments**
- **Documents** (BOL, POD, etc.)
- **Tracking_Events**
- **Reviews** / **Insurance_Policies** / **Compliance_Records**
- **Notifications** / **Audit_Logs**
- **Equipment_Types** / **Load_Categories**

---

## 5. API Endpoint Groups (Reference)

`/auth` | `/users` | `/companies` | `/loads` | `/shipments` | `/carriers` | `/drivers` | `/tracking` | `/payments` | `/documents` | `/notifications` | `/reports` | `/rates` | `/marketplace` | `/integrations` | `/admin` | `/webhooks` | `/mobile`

---

## 6. MVP Scope (Focus for VibeDex)

- User registration for **shippers** and **carriers**
- Basic **load posting** and **bidding**
- Simple **matching** (no full AI in MVP)
- **GPS tracking** (basic)
- **Digital documentation** (basic BOL/POD)
- **Basic payment processing**
- One geographic region + **dry van** freight type first

---

## 7. Monetization (Reference)

- Commission 3–8% on freight value  
- SaaS tiers for TMS/analytics  
- Transaction fees, premium placement, API licensing, white-label, data services  

---

## 8. Metrics to Track

GMV | Loads posted/completed | Carrier/shipper acquisition & retention | Transaction size & commission | On-time delivery | NPS | Revenue per user | API adoption | Geographic expansion  

---

## 9. Go-to-Market Notes

Target SMB freight brokers and regional carriers first; specific trade lanes or freight types; partner with logistics providers; emphasize cost savings and technology modernization.

---

*This document is the single source of requirements for VibeDex. DB design and UI are derived from this blueprint.*
