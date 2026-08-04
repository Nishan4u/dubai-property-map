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
  first" fallback), and AI Voice Assistant (browser-native Web Speech
  API — speech-to-text for asking by voice, text-to-speech for the
  reply — layered onto the existing chat widgets via a shared
  `src/lib/ai/useVoice.ts` hook, no paid third-party voice API or new
  npm dependency; feature-detected, so the mic button simply doesn't
  render in unsupported browsers like Firefox. A voice reply only ever
  follows a voice question — typed questions stay silent text-only —
  with a mute toggle in each widget's header. Landed in both
  `AiChatWidget` (public MapAI) and the shared `PortalAssistantWidget`
  (AI Broker/Sales Assistants), covering all three surfaces in one
  change) (Module 17 now fully done).
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
  Meetings/Appointments were added in the Module 23 pass (`crm_appointments`)
  — see "Meeting & Collaboration" below. Email History, Call Logs, and
  WhatsApp History were added in a later pass — see "CRM Communication
  History" below. Connect-Any-CRM was added in a later pass too — see
  "Connect-Any-CRM" below; only ERP/Marketing/Storage/Payment-beyond-
  Stripe integrations remain net-new for this module.
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
- Marketing Campaigns (rest of Module 20, now done except real browser
  Web Push — see below): the existing in-app NotificationBroadcast
  (`/admin/notifications`, buyers/developers/a specific developer's
  users) already covers the "push" concept and is now extended with a
  real "also send email" option — resolves each recipient's email via
  `auth.admin.getUserById()` (the first use of that API in this
  codebase) and reuses the existing `sendEmail()`/Resend pipeline, with
  zero change to its existing in-app-only behavior when left unchecked.
  A new `/admin/campaigns` page adds genuinely new Email/SMS bulk
  campaigns targeting CRM clients specifically — the only real,
  broker/salesperson-collected contact list in this schema (buyer/
  developer profiles have no phone column and no capture flow for one,
  so campaigns don't pretend to target them by SMS). SMS
  (`src/lib/sms.ts`) is a genuine Twilio REST API integration via
  `fetch`, gated behind `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/
  `TWILIO_FROM_NUMBER` — no real Twilio account exists yet, so until
  those are set it logs "not configured" per attempt rather than
  fabricating a sent message, mirroring `sendEmail()`'s own honesty
  pattern. A new `crm_clients.marketing_opt_out` flag (default false,
  patch_110) lets a client be excluded. `/admin/landing-pages` adds
  standalone public pages at `/l/<slug>`, mirroring `communities/[slug]`'s
  own server-component/`generateMetadata`/`notFound()` pattern; body
  text renders as plain paragraphs, not raw HTML, since no rich-text
  editor exists anywhere in this codebase and an admin-authored HTML
  field would be a stored-XSS surface for no real formatting benefit.
  Real browser Web Push (service worker + VAPID + permission UX) stays
  deliberately out of this pass — technically buildable without vendor
  credentials, but substantial enough to be its own unit rather than
  folded into this batch.
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
- Unit Reservation + Digital Contract (core) (Modules 14 + 25): research
  found the existing `bookings` table is only a site-visit scheduler —
  Module 14's actual Unit Reservation/Booking Approval/Payment Tracking
  never existed despite being listed as done. Given the choice, the user
  picked building a real reservation system rather than bolting a
  signature step onto the viewing scheduler, since a reservation
  agreement genuinely is the contract in practice. `crm_clients` (patch_98)
  is extended to a 3-way owner (broker/salesperson/**developer**, additive
  — existing broker/salesperson rows and RLS are unaffected), since
  developers had no client-tracking mechanism at all. A new
  `unit_reservations` table (patch_104) is the reservation *and* the
  contract in one record — no separate contract entity — with ownership
  derived via the linked client (same pattern as `crm_notes`/`crm_tasks`,
  no redundant owner column). E-signature is in-house: typed or
  hand-drawn-on-canvas (`SignatureCapture`, no new npm dependency), with
  the exact contract text frozen into `contract_snapshot_html` at
  send-time so it can never retroactively change. Buyers sign via a
  public, tokenized `/sign/[token]` link emailed to them (no account
  required — genuinely new territory, no anonymous-signer precedent
  existed before this) with a full IP/user-agent/timestamp audit trail.
  Broker and salesperson get a Reservations section on their existing
  Client detail pages; developers (who have no client UI at all) get a
  new `/dashboard/reservations` page that captures buyer contact info and
  creates the reservation together in one form; admin gets a read-only
  `/admin/reservations` list. No PDF library is installed, so the signed
  contract is styled HTML with print CSS rather than a generated PDF —
  browser print-to-PDF covers it for this pass. Individual numbered-unit
  inventory tracking (Module 16 "Live Inventory") didn't exist at the
  time, so a reservation's unit number was free text with no
  availability locking — closed by the following pass.
- Live Inventory Management (Module 16): a new `project_units` table
  (patch_105) adds real individual numbered units (unit number, floor,
  price, a 3-state `available`/`reserved`/`sold` status) within each
  existing unit-type category — `project_unit_types` (patch_79) still
  tracks categories only, this is additive underneath it, mirroring its
  exact RLS shape (public read, developer manages own, admin manages).
  The developer's `UnitTypesManager` gets a new "Units" sub-panel per
  category (list + inline add/delete), independent of the pre-existing
  Photo & Floor Plans panel. The three reservation-creation forms
  (broker/salesperson Client detail, developer `/dashboard/reservations`)
  now offer a real unit picker sourced from that category's available
  units, falling back to the original free-text field ("Other (type
  manually)") for projects with no inventory configured — existing
  reservations and free-text-only projects behave exactly as before.
  Reserving now genuinely locks a unit: the send route conditionally
  flips it to `reserved` (409 if another draft already claimed it first,
  closing the double-booking gap called out above), signing flips it to
  `sold`, and a new cancel route (replacing the previous direct-update
  calls) reverts it back to `available` — all via the service-role
  client, since `project_units` RLS only grants write access to the
  owning developer regardless of which role initiated the action. The
  public project page shows a real "X of Y units available" line
  alongside each category's existing manually-set availability badge
  (left untouched). Automatic Sync (no external inventory system exists
  to sync with) and Payment Plan Updates (already covered by the
  existing project-level payment-plan editing) are explicit non-goals,
  not gaps.
- Meeting & Collaboration, core (Module 23): two new capabilities on the
  established `crm_clients` 3-way owner pattern (patch_98/patch_104),
  covering Calendar, Appointment Booking, Video Meetings, Shared
  Collections, and Client Presentation Mode — Internal Notes was already
  built (`crm_notes`/`crm_tasks`, patch_98). A new `crm_appointments`
  table (patch_106) is a genuine internal broker/salesperson/developer
  calendar, distinct from the pre-existing `bookings` table (the public
  buyer-facing site-visit scheduler, untouched). Unlike notes/tasks, an
  appointment's `client_id` is optional with no "must link to something"
  constraint, since a personal calendar block is meaningful on its own.
  "Video Meetings" is a plain `meeting_link` URL field, not embedded
  video — no new paid dependency, same principle as the AI Voice
  Assistant pass. Each of the three portals gets its own "Calendar" nav
  page (`/broker/calendar`, `/salesperson/calendar`,
  `/dashboard/calendar`) built on a new generic `MonthCalendar` shared
  primitive (extracted from, not modifying, the existing
  `BookingsTableClient`'s inline calendar view). Shared Collections /
  Client Presentation Mode is a new `crm_collections` +
  `crm_collection_items` pair (same 3-way owner pattern; no public RLS
  policy at all) letting a broker/salesperson/developer curate a named
  shortlist of projects and share it via a public, tokenized
  `/present/[token]` link (mirrors `unit_reservations.sign_token`'s
  precedent exactly) — no login required, reuses the existing QR-code
  helper (`generateReferralQrCode`). A new "Collections" nav page per
  portal handles creation/sharing/deletion. Team Collaboration is an
  explicit non-goal for this pass — no chat/threading/mentions primitive
  exists anywhere in this codebase to extend, and the term is too broad
  to scope safely without one.
- Business Intelligence Reports, core (Module 19): `/admin/reports` —
  previously a single flat page already covering Lead/Community/Project/
  Download Reports with real data — is restructured into a tabbed
  interface (mirroring the referral program's tab pattern) adding
  Revenue, Subscriptions, Sales, People (Developer/Broker/Agency
  Analytics), and Activity, without changing the existing Overview tab's
  content at all (relocated byte-identical into its own component). Six
  of the seven new report types aggregate data that already existed but
  was never surfaced: Revenue reuses the existing
  `getPaymentsOverviewStats()` for current-state totals and adds a real
  month-by-month trend from `broker_payments`/`broker_agency_payments`
  (Stripe ledgers) and approved `subscription_bank_transfers` — the UI
  states plainly that salesperson subscriptions and developer flat fees
  have no historical payment ledger to trend, rather than fabricating
  one. Sales is genuinely new: `unit_reservations` where `status =
  'signed'` is the real closing/deal-value record in this schema.
  Developer/Broker/Agency Analytics are ranked `DataTable`s built from
  existing tables (`crm_clients`, `property_requests`, signed
  reservations, `brokers.brokerage_id`). User Activity surfaces
  `login_history` (built in the Security pass, never reported on before)
  as a logins-over-time trend and most-active-users list, alongside a
  signups-over-time trend from `profiles.created_at`. Search Analytics
  and AI Usage Reports (the two remaining Module 19 types) needed real
  instrumentation added, not just aggregation — see the next entry.
- Search & AI Usage Analytics (Module 19, now fully done): a new
  `useSearchTracking` hook (`src/lib/useSearchTracking.ts`) — debounced
  800ms, mirrors `trackProjectEvent`'s fire-and-forget insert shape —
  is wired into all four independent public search surfaces
  (`AllProjectsClient`, `HomeClient`'s map search, `CommunitiesPageClient`,
  and the header's `GlobalSearchBox`), each a one-line addition passing
  its own already-computed query/result-count state; no existing filter
  logic changed. Only free-text keyword search is tracked, not every
  filter dropdown. AI usage tracking reads `final.usage` from the
  Anthropic SDK response inside `runToolLoop` (`src/lib/ai/core.ts`) —
  already present on every response but never read before — via a new
  optional `onUsage` callback, summed across tool-calling turns and
  reported once per request; each of the three assistant wrappers
  (MapAI, AI Broker Assistant, AI Sales Assistant) passes its own
  already-available identity through a small closure. Both land in new
  tables (`search_log`, `ai_usage_log`, patch_107) and surface as two
  more tabs ("Search", "AI Usage") on `/admin/reports`. Real token
  counts are shown, never a fabricated dollar cost — no pricing data
  exists anywhere in this codebase to derive one from.
- Community Explorer enrichment (Module 6, now fully done): each
  community page gets an Investment Score panel (a genuine average of
  each listing's own transparent, already-computed score — rating,
  review volume, the "high-roi" tag — reusing `getInvestmentScore()` as-
  is, never a new score formula) and a Market Trends panel (off-plan vs.
  ready split, top developers, top tags — reusing `getMarketInsights()`,
  already built for MapAI's Market Insights tool, now scoped to the
  community by name for the first time on a public page). ROI and
  Rental Yield deliberately do **not** show a fabricated real figure —
  this schema has no historical rental/resale data, the same rule
  already enforced for the AI Investment Advisor and the Calculators
  Suite — instead the community page embeds the existing
  `RoiCalculator`/`RentalYieldCalculator` components pre-filled with the
  community's own real average listing price, so a buyer models their
  own scenario rather than being shown an invented number. All of this
  sits between the pre-existing Price Overview and the Projects grid,
  inside the same `ProjectAccessGate` subscription gate as the rest of
  the community's project data — nothing existing on the page changed.
- Analytics & Tracking (Module 26, now fully done): three of the seven
  listed items turned out to already exist — Google Analytics (GA4/GTM/
  Meta/TikTok Pixel, `AnalyticsScripts.tsx` + the admin-editable
  `platform_settings.google_analytics_id` on `/admin/settings`), Search
  Analytics (the prior batch), and Click Tracking (`project_events`,
  now also feeding the new Conversion tab below). Two new tabs added to
  `/admin/reports`: **Conversion** chains every real funnel stage this
  schema already captures (project views as a current total — no
  timestamp exists to trend it — clicks, leads, bookings, signed deals
  with real value) plus ad placement click performance; **Map
  Analytics** is a real Mapbox heatmap (a new, standalone map instance,
  not an extension of the public `DubaiMap.tsx`) weighted by each
  project's actual view count — genuine engagement density, not an
  invented "hot area" claim, and unrelated to Module 5's still-pending
  ROI/rental-yield map layers, which this pass deliberately didn't
  touch since those would require exactly the kind of fabricated
  per-listing return figures this codebase has repeatedly refused to
  invent. Ad placement click-through is genuinely new: a
  `ad_placement_events` table (patch_108) plus a public redirect route
  (`/api/ads/click/[id]`, mirroring the existing `/s/[code]` staff-
  referral-link precedent) that all five existing banner render sites
  now route through — each only when `target_url` is actually set, so
  the pre-existing no-target `"#"` fallback behaves exactly as before.
  Ad impression tracking stays out of scope (would need client-side
  visibility detection on what are today plain server-rendered links).
- CRM Communication History (part of Module 15 — see "Connect-Any-CRM"
  below for the rest): Email
  History is purely additive read-only RLS on the existing `email_logs`
  table (patch_109), matched by `to_email = crm_clients.email` rather
  than adding a new `client_id` column — the latter would have meant
  threading a new parameter through `sendEmail()`'s ~41 existing call
  sites for a benefit only the reservation flow could realistically
  populate well, not worth the blast radius on an already-shipped,
  working send path (zero diff to `src/lib/email.ts` in this pass).
  Call Logs and WhatsApp History are a new `crm_communication_logs`
  table — one table with a `channel` enum (`call`/`whatsapp`) rather
  than two near-duplicate tables, mirroring `project_events`' own
  `event_type` enum precedent — a manually-entered contact record, not
  a fabricated live telephony/WhatsApp Business API integration (no
  vendor credentials exist anywhere in this codebase for either). Both
  land as two new read-only/append-only sections on the existing Broker
  and Salesperson client-detail pages, mirroring the existing Notes
  section's exact form/list shape; no developer client-detail page
  exists yet, an already-established non-goal repeated from two earlier
  batches, not newly introduced here.
- Connect-Any-CRM (last piece of Module 15, now fully done except ERP/
  Marketing/Storage/Payment-beyond-Stripe — see below): a self-service
  outbound-webhook + secret-authenticated JSON pull-feed framework
  (`crm_integrations`/`crm_integration_logs`, patch_111) a broker,
  salesperson, or developer can point at their own real CRM (its native
  webhook receiver, or a Zapier/Make/n8n workflow) — not a fake named-
  vendor connector, since no real CRM vendor account exists for this
  platform and no vendor's OAuth credentials can be genuinely
  fabricated. Every webhook POST is HMAC-SHA256 signed with the
  integration's own secret; every attempt (success or failure, with
  HTTP status/error) is logged. Two real events dispatch today —
  `lead.created` (a new `property_requests` row, wired inline into the
  existing `/api/broker/property-requests` route's own "best-effort,
  doesn't affect the already-committed insert" block) and
  `client.created` (a new `crm_clients` row, relayed through a small new
  `/api/integrations/dispatch-client-created` route since that insert
  happens client-side and the signing secret must never reach the
  browser) — deliberately not the full "Leads, Clients, Projects, Units,
  Availability, Prices, Payment Plans, Salespersons, Property Requests,
  Reservations, Tasks, Notes, Appointments, Documents" sync-data list
  from the original spec, which is straightforward to extend later with
  the same pattern. The existing narrow per-developer `sendLeadWebhook`
  (`developers.lead_webhook_url`, patch_22) is completely untouched — a
  different, already-shipped mechanism this pass is additive to, not a
  replacement for. Self-service UI lives at `/broker/integrations`,
  `/salesperson/integrations`, `/dashboard/integrations` (developer);
  `/admin/integrations` is a read-only oversight table across every
  owner. OAuth 2.0, GraphQL, two-way sync, and CSV/XML feed formats stay
  out of this pass — real gaps, but meaningfully bigger scope than a
  first pass, noted here rather than silently dropped.
- Multi-language / Arabic / RTL Support (Module 29, now substantially
  built): a cookie-based locale/currency preference
  (`src/lib/i18n/`) — deliberately **not** a `src/app/[locale]/**`
  URL-routing restructuring, since that would touch every existing
  route, link, `sitemap.ts`/`robots.ts` entry, and the DB-driven
  redirect logic already in `src/proxy.ts` across the whole codebase,
  a blast radius wildly out of proportion for one architectural choice.
  Every existing URL stays byte-identical; English/AED remains the
  default with zero visible change when no preference is set. Real RTL
  support: `dir="rtl"`/`lang="ar"` set dynamically on `<html>`
  (`src/app/layout.tsx`) from the cookie, logical-property layout
  fixes applied to the shared header/footer (`PublicShell.tsx`), and a
  language/currency switcher in the header. The shared chrome (footer
  copyright, switcher labels) is genuinely translated via a small
  dictionary system; full per-page body-copy translation across the
  50+ public components stays out of this pass — a bounded, real slice
  now beats a mechanical sweep that would touch nearly every existing
  page in one batch. Currency: all 15 real public-facing
  `formatAed()` call sites (project/community cards, map popups, the
  community/project detail pages) now convert through the currency
  cookie and `CurrencyConverter.tsx`'s own existing indicative rates
  (reused, not duplicated); the 6 internal/admin financial-reporting
  call sites (revenue/sales/conversion reports, the developer
  dashboard's pipeline value) deliberately stay in AED, since silently
  converting an admin's own revenue figures based on their personal
  currency preference would be actively confusing, not a feature.
  Content: `name_ar`/`description_ar` columns (patch_112) on
  `communities`/`developers`/`projects`, with **real AI-translated
  Arabic names for all 159 existing communities** (genuine, well-
  documented Dubai place names) and the ~30 major, widely-recognized
  developer brands — the other ~200 smaller/boutique developer entries
  (several visibly test/QA rows) deliberately keep `name_ar` null and
  fall back to English, since inventing a plausible-sounding Arabic
  transliteration for a company whose actual branding isn't known
  would be exactly the kind of fabrication this codebase has
  repeatedly refused elsewhere (Investment Score, ROI/rental yield).
  Community and Developer detail pages show the Arabic name/
  description when present, always falling back to English — never a
  blank field. Timezone: not a new picker — every date in this
  codebase already renders via `Date.toLocaleString()` client-side,
  which already shows the browser's own local time for free on a
  platform whose users are overwhelmingly in one timezone anyway.

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
- ERP, Marketing (Meta/Google Ads), Storage (Drive/OneDrive/Dropbox/S3),
  and Payment-beyond-Stripe integrations — last remaining piece of
  Module 15 (see "Substantially built" above for Client Management/
  Notes/Tasks/Calendar/Appointments/Email History/Call Logs/WhatsApp
  History/Connect-Any-CRM, all of which are now done). Each of these
  fundamentally requires a real registered OAuth app/vendor credential
  from that specific provider to function at all — unlike a generic
  webhook or Twilio's REST API, there's no genuine placeholder config
  that would work once filled in, since each vendor's app must be
  registered against this exact deployed domain.
- Real browser Web Push (service worker + VAPID + permission UX) — last
  remaining piece of Module 20 (see "Substantially built" above for
  Homepage Banners, Featured Developers, Sponsored Communities, and
  Marketing Campaigns, all of which are now done).

This snapshot is a starting point for scoping "what's next," not a
commitment — confirm with the user before treating any line as decided
priority.
