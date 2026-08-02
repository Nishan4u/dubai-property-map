# Dubai Property Map – Master Development Document

This is the single source of truth for the platform's full scope, combining
all decisions made across our sessions. It supersedes any earlier partial
notes.

**Standing rule for all future work against this document:** keep every
existing feature working exactly as it does today. Only ever *add* new
features from this list — never remove, rewrite, or regress something that
already works in order to build something new. When a module below turns
out to already be partially built, extend it in place rather than
replacing it.

## Platform Vision

Dubai Property Map is a Mapbox-powered, AI-driven, map-first PropTech
ecosystem. It combines interactive mapping, project discovery, developer
management, broker and agency collaboration, built-in CRM with
connect-any-CRM capability, live inventory, booking and reservation,
digital contracts, referrals, analytics, and enterprise-grade integrations
into one platform. Rather than being another property listing website, it
is designed to be the central operating platform for Dubai's off-plan real
estate market.

Key business rules:

- Mapbox (not Google Maps) for all mapping.
- Developers see only their own projects.
- Brokers and broker agencies see all projects.
- Salespersons see only their assigned developer's projects.

---

## Module 1 – Authentication & User Management

**Authentication:** Login, Registration, Email Verification (any
browser/device), Forgot Password, Reset Password, Show/Hide Password,
Two-Factor Authentication (2FA), Device Management, Session Management,
Login History, Account Security, Account Lock Protection.

**User Types:** Super Admin, Admin, Developer, Developer Team Member,
Salesperson, Broker Agency, Broker, Buyer, Investor, Guest.

**Registration Controls:** Enable/Disable Registration Types, Manual
Approval, Email Verification, Mobile Verification, License Verification,
KYC Verification, User Suspension, Blacklist Users.

## Module 2 – Role & Permission Management

Unlimited Roles, Custom Permissions, Module Access, Feature Permissions,
Download Permissions, Upload Permissions, Project Permissions, Community
Permissions, Map Permissions, API Permissions, Activity Logs.

## Module 3 – Subscription & Billing

**Packages:** Developer, Broker, Broker Agency, Salesperson, Buyer
Premium, Investor Premium.

**Features:** Online Payment, Bank Transfer, Receipt Upload, Manual
Approval, Payment History, Invoice, Renewal, Auto Renewal (Admin Only),
Expiry Reminder, Coupon Codes, Promo Codes, Gift Subscription, Upgrade
Package, Downgrade Package, Individual Free Access, Global Free Access.

## Module 4 – Admin Panel

**Dashboard:** Revenue, Active Users, Projects, Communities, Developers,
Brokers, Broker Agencies, Salespersons, Buyers, Investors, Subscriptions,
Payments, Property Requests, Analytics.

**Management:** Users, Roles, Permissions, Projects, Developers,
Communities, Areas, Amenities, Categories, Property Types, Documents,
Marketing, AI Settings, Notifications, Subscription Packages, Payment
Settings, System Settings, Audit Logs.

## Module 5 – Interactive Mapbox Platform

**Map Layers:** Communities, Projects, Developers, Metro, Roads, Beaches,
Parks, Schools, Hospitals, Hotels, Shopping Malls, Airports, Attractions,
Future Developments.

**Features:** Custom Project Pins, Cluster Pins, Community Polygons,
Radius Search, Draw Search Area, Nearby Search, Heat Maps, ROI Heat Maps,
Rental Yield Heat Maps, Price Heat Maps, Travel Time Search, 3D Buildings,
Satellite View, Dark Mode, Save Map View, Route Planning, Map Animation.

## Module 6 – Community Explorer

Every community includes: Overview, Gallery, Videos, Developers, Projects,
Schools, Hospitals, Metro, Beaches, Parks, Hotels, Restaurants, Shopping,
Lifestyle, Investment Score, ROI, Rental Yield, Market Trends, Future
Developments, Nearby Communities.

## Module 7 – All Projects

**Views:** Grid, List, Interactive Map.

**Search:** Keyword, Developer, Community, Area.

**Filters:** Developer, Community, Property Type, Bedrooms, Bathrooms,
Size, Price, Payment Plan, Completion, Handover, Furnished, Ready,
Off-plan, ROI, Rental Yield, Amenities, Escrow Account.

**Actions:** Favorite, Compare, Share, QR Code, Download.

**Access Rules:** Guest → Registration Required. Registered User →
Subscription Required. Broker → All Projects. Broker Agency → All
Projects. Developer → Only Own Projects. Salesperson → Assigned Developer
Projects. Admin → All Projects.

## Module 8 – Project Management

Project Overview, Gallery, Videos, 360° Tours, Drone Videos, Floor Plans,
Brochures, Factsheets, Master Plans, Payment Plans, Unit Types, Amenities,
Construction Updates, Completion Status, Nearby Places, QR Sharing,
Compare, Favorites, Property Request.

## Module 9 – Developer Module

Dashboard, Project Management, Media Upload, Construction Updates, Team
Members, Salesperson List, Analytics, Reports, Downloads, Favorites,
Property Requests, Notifications.

## Module 10 – Broker Module

Dashboard, Interactive Map, All Projects, Advanced Search, Favorites,
Compare, Client Collections, CRM, Property Requests, Calendar, Notes,
Follow-ups, Reports, Marketing Tools, Downloads.

## Module 11 – Broker Agency Module

Everything in the Broker Module, plus: Agency Dashboard, Broker
Management, Agency Analytics, Broker Performance, Office Management, Team
Management, Agency Branding, Agency Reports.

## Module 12 – Salesperson Module

Dashboard, Assigned Developer, Projects, Leads, Clients, Calendar,
Marketing, Reports.

## Module 13 – Buyer & Investor Modules

**Buyer:** Saved Projects, Saved Communities, Favorites, Compare, Booking
Requests, Appointments, Mortgage Calculator, AI Recommendations.

**Investor:** Investment Dashboard, Portfolio, Watchlist, ROI Analysis,
Rental Yield, AI Investment Advisor, Market Trends.

## Module 14 – Booking & Reservation

Unit Reservation, Booking Requests, Booking Approval, Booking Expiry,
Booking Status, Reservation History, Payment Tracking.

## Module 15 – CRM & Integrations

**Built-in CRM:** CRM Dashboard, Lead Management, Client Management, Sales
Pipeline, Tasks, Follow-ups, Calendar, Meetings, Notes, Appointments,
Email History, Call Logs, WhatsApp History, Reports.

**Connect Any CRM:** Developers can connect any CRM.

- Connection Methods: REST API, GraphQL API, Webhooks, OAuth 2.0, API
  Keys, CSV Import, XML Feed, JSON Feed.
- Synchronization: One-Way Sync, Two-Way Sync.
- Sync Data: Leads, Clients, Projects, Units, Availability, Prices,
  Payment Plans, Salespersons, Property Requests, Reservations, Tasks,
  Notes, Appointments, Documents.

**Other Integrations:**

- ERP: Inventory, Customers, Financial Data.
- Marketing: Meta Lead Ads, Google Ads, Email Marketing.
- Communication: WhatsApp Business API, SMS Gateway, Email Services, Push
  Notifications.
- Storage: Google Drive, OneDrive, Dropbox, Amazon S3.
- Payments: Stripe, Checkout.com, PayTabs, Network International, Bank
  Transfer.
- API & Webhooks: API Keys, OAuth, API Logs, Webhook Management,
  Connection Status, Sync Logs, Error Logs.

## Module 16 – Live Inventory Management

Available Units, Reserved Units, Sold Units, Unit Availability, Price
Updates, Payment Plan Updates, Automatic Sync.

## Module 17 – AI Platform

AI Chat Assistant, AI Property Search, AI Community Guide, AI Investment
Advisor, AI Buyer Matching, AI Broker Assistant, AI Sales Assistant, AI
Project Comparison, AI Market Insights, AI Recommendation Engine, AI Voice
Assistant.

## Module 18 – Referral & Commission System

Referral Codes, Staff Referral Codes, Commission Rules, Commission
Tracking, Monthly Targets, Commission Payouts, Performance Dashboard,
Referral Analytics.

## Module 19 – Reports & Business Intelligence

Revenue Reports, Subscription Reports, Lead Reports, Sales Reports,
Community Analytics, Project Analytics, Developer Analytics, Broker
Analytics, Agency Analytics, User Activity, Search Analytics, Download
Reports, AI Usage Reports.

## Module 20 – Marketing Platform

Homepage Banners, Featured Projects, Featured Developers, Sponsored
Communities, Push Campaigns, Email Campaigns, SMS Campaigns, Referral
Campaigns, Landing Pages.

## Module 21 – Media & Document Center

Images, Videos, Brochures, Factsheets, Floor Plans, Master Plans, Payment
Plans, Contracts, Construction Photos, 360° Tours.

## Module 22 – Notifications & Communication

Email Notifications, Browser Notifications, Push Notifications (PWA), SMS,
WhatsApp Notifications, In-App Notifications, Announcement Center.

## Module 23 – Meeting & Collaboration

Calendar, Appointment Booking, Video Meetings, Client Presentation Mode,
Shared Collections, Team Collaboration, Internal Notes.

## Module 24 – Calculators

Mortgage Calculator, ROI Calculator, Rental Yield Calculator, DLD Fee
Calculator, Currency Converter, Area Converter, Payment Plan Calculator,
Affordability Calculator.

## Module 25 – Digital Contracts & Documents

E-Signatures, Booking Contracts, Reservation Agreements, Developer
Agreements, Document Verification.

## Module 26 – Analytics & Tracking

Google Analytics, Search Analytics, Map Analytics, Heatmaps, Click
Tracking, Campaign Tracking, Conversion Tracking.

## Module 27 – Security

Two-Factor Authentication, Device Tracking, Login History, Activity Logs,
Audit Logs, API Security, Role Security, IP Restrictions, Data Encryption,
Backup & Recovery.

## Module 28 – Performance & Infrastructure

Progressive Web App (PWA), Offline Support, CDN, Image Optimization, Lazy
Loading, Queue System, Background Jobs, Server Caching, Load Balancing,
Auto Scaling.

## Module 29 – Multi-language & Localization

English, Arabic, RTL Support, Currency Support, Time Zone Support,
Localized Content.

## Module 30 – Public Website

Home, Interactive Map, Communities, Projects, Developers, About, Contact,
Blog, News, Market Insights, FAQ, Careers, Privacy Policy, Terms &
Conditions.

## Module 31 – Mobile Experience

Responsive Design, Progressive Web App, Install Prompt, Offline Access,
Push Notifications, Mobile Navigation, Touch-Optimized Map.

---

## Build Status Snapshot (as of 2026-08-02)

A quick, codebase-verified read of what's already in place vs. what's net
new from this document — not exhaustive, but grounded in what actually
exists in `src/` and `supabase/` today rather than assumption. Update this
section as modules get built out.

**Substantially built:**
- Public site: home, interactive Mapbox map, communities, projects,
  developers, blog, about/contact/FAQ/careers/privacy/terms (Module 30).
- Auth: login, registration, custom email verification flow, forgot/reset
  password, device-conflict handling (Module 1, partial — no 2FA yet).
- Admin panel: users, developers, brokers, broker agencies, salespersons,
  communities, catalog, projects, subscriptions, packages, payments, bank
  transfers, bookings, leads, property requests, reports, audit log, SEO,
  content, menus, notifications, staff, ads (Modules 4, most of 9-14).
- Developer / Broker / Broker Agency / Salesperson portals with their own
  dashboards, profiles, security, subscriptions, team/salesperson
  management (Modules 9-12).
- Subscription & billing: packages, Stripe, bank transfer + receipt
  upload, coupons, free access toggles (Module 3).
- Booking & reservation system (Module 14).
- Mapbox platform: project/community pins, clustering, metro lines,
  major highways, amenity layers, dark theme (Module 5, partial — no heat
  maps, 3D buildings, draw-search, or travel-time search yet).
- Notifications: email, in-app, push via service worker (Module 22,
  partial).
- PWA basics: service worker registered (Module 28/31, partial — no full
  offline support yet).
- AI Platform: public-site "MapAI" chat widget (Claude Haiku 4.5,
  tool-calling loop against real listed projects — covers AI Property
  Search — plus a Community Guide tool), AI Project Comparison, AI
  Recommendation Engine, AI Broker Assistant, and AI Sales Assistant
  are all built on a shared tool-loop core (`src/lib/ai/core.ts`),
  each with its own streaming chat route and floating widget mounted
  in the relevant portal. Stays usable (portals itself in) during
  native or simulated map fullscreen instead of disappearing (Module
  17, partial — AI Investment Advisor, AI Buyer Matching, AI Market
  Insights, and AI Voice Assistant are still net-new).
- Referral & Commission System (Module 18) — now substantially
  complete: the pre-existing staff referral-code/commission-tracking/
  monthly-target/performance-dashboard system is joined by a new
  configurable Broker/Salesperson Referral Program — automatic unique
  codes (BRK1001/SP2001-style), referral link + QR, optional capture
  at registration with live validation, admin-configurable discount
  applied via a fresh Stripe coupon at checkout, admin-configurable
  cashback credited to a Referral Wallet only after registration +
  email-verified + paid + activated, wallet spendable on renewals
  (and new purchases if admin allows), self-referral guard, automatic
  clawback on cancellation/refund, admin Settings + Analytics
  dashboard (incl. eligible-plans/eligible-account-types restriction
  and a Total Referral Revenue stat), and a VAT-aware cross-account
  payments CSV export for filing.
- Admin panel search & bulk actions: live search added to Developers,
  Brokers, Brokerages, Salespersons, Users, Payments, and all four
  Subscriptions account tables; select-all + bulk delete on Developers,
  Brokers, Brokerages, Salespersons; native filter/status dropdowns
  restyled to match the public site's searchable dropdown component
  (Module 4 enhancement).
- Developer directory: 211 developers bulk-imported from an external
  CSV source (Module 9-adjacent — directory growth, not a new module).
- Scraped project import: 484 projects imported as `draft` status
  across the newly-imported developers, pending per-project admin
  review; the Projects admin table now shows a Status column and
  approving a draft project correctly publishes it (previously
  approval only updated the approval flag, leaving the project
  invisible on the public site despite the "now live" message).

**Not yet built (net-new from this document):**
- Two-factor authentication, device/session management, login history
  (rest of Module 1), IP restrictions (Module 27).
- Unlimited custom roles/permissions beyond the fixed user types (Module
  2).
- Community Explorer's investment score / ROI / rental yield / market
  trends panels (Module 6).
- Built-in CRM pipeline (leads exist; no pipeline stages, call logs,
  WhatsApp history yet), Connect-Any-CRM integrations, ERP/marketing/
  storage/payment integrations beyond Stripe (Module 15).
- Live inventory sync automation (Module 16).
- AI Investment Advisor, AI Buyer Matching, AI Market Insights, AI Voice
  Assistant (rest of Module 17 — see "Substantially built" above for
  what's already done).
- Business-intelligence-grade reports beyond what's in admin/reports
  today (Module 19).
- Marketing campaign tooling (push/email/SMS campaigns, landing pages)
  (Module 20).
- Digital contracts / e-signatures (Module 25).
- Formal analytics/tracking integrations, heatmaps, conversion tracking
  (Module 26).
- Multi-language / Arabic / RTL support (Module 29).

This snapshot is a starting point for scoping "what's next," not a
commitment — confirm with the user before treating any line as decided
priority.
