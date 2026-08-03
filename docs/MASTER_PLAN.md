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

## Build Status Snapshot (as of 2026-08-03)

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
  native or simulated map fullscreen instead of disappearing. MapAI
  now also covers AI Market Insights (real aggregate stats — price
  range/average, off-plan vs. ready split, bedroom mix, top
  developers/tags — Dubai-wide or scoped to one community), AI
  Investment Advisor (built for the existing Buyer role rather than a
  separate Investor account, which doesn't exist in this system —
  reasons about one project's price vs. its own community's live
  market, handover timeline, and escrow status; never states an ROI
  or rental-yield figure since no such data exists anywhere in this
  schema, and "high-roi"-style tags are surfaced explicitly as the
  listing's own marketing claim, not a computed return), and AI Buyer
  Matching (personalized recommendations from a signed-in buyer's own
  favorited projects, with a graceful "sign in / favorite something
  first" fallback) (Module 17, partial — only AI Voice Assistant is
  still net-new).
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
- Built-in CRM (Module 15, partial): a Client Management layer (`crm_clients`
  — real name/email/phone/WhatsApp, owned by a broker or salesperson) sits
  alongside the existing `property_requests` pipeline via an optional
  `client_id` link, deliberately not inline on `property_requests` itself
  (that table still carries no PII columns directly, preserving its
  original design intent). Brokers now have a "My Requests" pipeline view
  they didn't have before (status shown read-only, matching the existing
  RLS — brokers have never been able to change request status); both
  portals get a Clients list + detail page with an editable contact,
  linked-requests list, a Notes thread, and Tasks/follow-ups with due
  dates and done/pending toggling. The AI Broker/Sales Assistants surface
  a linked client's name when one exists, never inventing one. Calendar/
  Meetings, Email History, Call Logs, and WhatsApp History are still
  net-new — the notes/tasks schema is shaped so those can attach later
  without a rework.
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
- Developer listing model refined: the admin/developer project form's
  Listing Type field is now a two-step choice (Sell/Rent, then, only when
  Sell is picked, Off Plan/Ready) that still resolves to the same
  `listing_type` enum. Developers pay no subscription for listing at
  all — project creation is free/unlimited via the pre-existing Global
  Free Access "Developer" toggle (`free_access_settings`, patch_88) — and
  the only paid developer action is a flat AED 50 / 15-day "Feature a
  Project" boost (`/dashboard/packages`, new
  `/api/developer/feature-project-checkout` route) that sets the
  project's own `featured` flag with a `featured_until` expiry checked at
  read time (mirrors the pre-existing `ad_placements` date-range pattern
  — no background job), independent of plan tier.
- Calculators Suite (Module 24) — the pre-existing Mortgage Calculator is
  joined by ROI, Rental Yield, DLD Fee, Currency Converter, Area
  Converter, Payment Plan, and Affordability calculators
  (`src/components/public/calculators/`). A public `/calculators` hub
  page hosts all eight; the project detail page's sidebar (previously a
  single standalone Mortgage Calculator card) is now a tabbed
  `ProjectCalculatorsPanel` defaulting to the same Mortgage tab as before,
  with ROI/Yield/DLD Fee/Payment Plan tabs added alongside it, prefilled
  from that project's own price and payment plan. All of them are pure
  calculators over the user's own inputs (or, for DLD Fee, published
  government fee rates) — none state or imply an actual ROI/yield figure
  for a specific listing, consistent with the AI Investment Advisor's
  same rule.
- Marketing Platform, content-driven pass (Module 20): Homepage Banners
  turned out to already be substantially built end-to-end (`ad_placements`
  schema, developer self-request, admin approve/reject, public render) —
  the one real gap, admin's inability to originate a banner directly
  without a developer request, is closed by a new "Create Banner" form on
  `/admin/ads` that publishes any placement type immediately as `active`.
  Featured Developers and Sponsored Communities are genuinely new: a plain
  `featured` boolean (patch_100, mirroring `projects.featured`) on
  `developers` and `communities`, an admin toggle in each existing
  edit/manage UI, featured-first ordering in `getDevelopers()`/
  `getCommunities()`, and a small gold badge/star wherever they're listed
  (partner developer ticker, Developers directory, Communities grid) —
  every developer and community still shows exactly as before, just
  reordered and badged.
- Security: 2FA, Login History, Device Management (rest of Module 1 +
  core of Module 27), for all six real user roles (buyer, developer,
  broker, broker agency, salesperson, admin) — staff login is a separate,
  unrelated internal system and stays out of scope. Two-Factor
  Authentication is Supabase's own native MFA (`auth.mfa.*`, TOTP), not a
  custom implementation: an inline 6-digit challenge step is inserted
  into the single shared `LoginFormClient.tsx` right after password
  sign-in, before the existing role-based redirect (unchanged for
  accounts with no factor enrolled). A new `login_history` table
  (patch_101, owner-plus-admin-read RLS) logs every successful login
  (IP + user agent) via a new `/api/auth/login-history` route. A shared
  `SecurityPanel` component (2FA enroll/manage, Login History table, and
  a Devices section with "Sign Out of All Other Devices" /
  "Sign Out Everywhere") is mounted in a new Security tab on the buyer's
  `/account` page and four new portal pages
  (`/admin/security`, `/broker-agency/security`, `/dashboard/security`,
  `/salesperson/security`, each with a new nav link). Brokers already had
  their own single-device-session `/broker/security` page (patch_34) —
  left completely untouched, with the new 2FA + Login History sections
  added alongside it (Devices section hidden there since it would
  duplicate what brokers already have). Failed-login tracking, account
  lockout, and IP restrictions stay pending — this pass only covers
  successful-login history.
- Account Lockout & Failed-Login Tracking (rest of Module 27): reuses
  `login_history` for failed attempts too (patch_102 loosens `user_id` to
  nullable, since a failed attempt happens before authentication
  succeeds and there's no `auth.uid()` to attribute it to) instead of a
  separate table. Two new pre-auth routes using the service-role client
  (`/api/auth/login-lockout-check`, `/api/auth/login-failure`) — checked
  in `LoginFormClient.tsx` *before* every sign-in attempt (so a locked
  account is blocked even on a correct password) and again right after a
  genuine `invalid_credentials` failure. Lockout is a 15-minute sliding
  window, 5 attempts (`src/lib/authLockout.ts`), self-resolving as old
  failures age out — no separate unlock step. A second RLS policy lets a
  user see their own failed attempts in their existing Login History tab
  via the email claim on their JWT (a null `user_id` can't match the
  original owner policy). Known, accepted tradeoff of any email-keyed
  lockout, called out in the route's own comment: anyone who knows a
  real user's email — not just that user — can trigger this endpoint, so
  it stops password brute-forcing but can't stop a malicious caller
  deliberately locking someone else's account out; this pass doesn't try
  to close that, it's inherent to the pattern.
- IP Restrictions (Module 27): an admin-configurable IP allowlist gating `/admin/*` and
  `/api/admin/*`, exact-match only (no CIDR ranges), off by default.
  Enforced in `src/proxy.ts` (this project's `middleware.ts` renamed per
  Next.js 16 convention) via a new cached fetcher reading two new tables
  (patch_103) with the service-role key — unlike the pre-existing
  `site_access_settings` precedent, these have no public RLS read policy
  at all, since they list which IPs bypass admin-panel protection.
  `/admin/settings` is deliberately exempted from the gate so a
  super-admin can never fully lock themselves out — it stays reachable
  regardless of the allowlist (still gated by the existing role check and
  by `is_super_admin()` RLS on any actual write), while `/api/admin/*` is
  included since those routes don't go through the page-level role check
  at all. A new `IpRestrictionsPanel` on `/admin/settings` shows the
  viewing admin's own current IP and manages the list, mirroring
  `NavLinksManager`'s add/delete pattern with `logAudit` on every change.
  A design-review pass caught and fixed a redirect-loop bug before this
  shipped (the naive path match would have caught the new
  `/admin-ip-blocked` block page itself).

**Not yet built (net-new from this document):**
- Module 27 "Security" — 2FA, Device Tracking, Login History, Account
  Lockout, and IP Restrictions are now built (see "Substantially built"
  above); Activity Logs and Audit Logs already existed before this
  session (`admin_audit_log` + `/admin/audit-log`); Data Encryption and
  Backup & Recovery are Supabase/infra-level (TLS, managed Postgres
  backups), not app features to build. API Security and Role Security
  aren't distinct dedicated features anywhere in this codebase — every
  API route does its own auth check and every table's RLS policy is the
  de facto "role security" layer, but there's no single dedicated
  admin-facing surface for either, so calling them "done" would overstate
  it.
- Unlimited custom roles/permissions beyond the fixed user types (Module
  2).
- Community Explorer's investment score / ROI / rental yield / market
  trends panels (Module 6).
- Calendar/Meetings, Email History, Call Logs, WhatsApp History
  (rest of Module 15's Built-in CRM — see "Substantially built" above for
  Client Management/Notes/Tasks, which are now done), Connect-Any-CRM
  integrations, ERP/marketing/storage/payment integrations beyond Stripe.
- Live inventory sync automation (Module 16).
- AI Voice Assistant (last remaining item in Module 17 — see
  "Substantially built" above for everything else, which is now done).
- Business-intelligence-grade reports beyond what's in admin/reports
  today (Module 19).
- Push/Email/SMS marketing campaigns and standalone landing pages (rest of
  Module 20 — see "Substantially built" above for Homepage Banners,
  Featured Developers, and Sponsored Communities, which are now done).
- Digital contracts / e-signatures (Module 25).
- Formal analytics/tracking integrations, heatmaps, conversion tracking
  (Module 26).
- Multi-language / Arabic / RTL support (Module 29).

This snapshot is a starting point for scoping "what's next," not a
commitment — confirm with the user before treating any line as decided
priority.
