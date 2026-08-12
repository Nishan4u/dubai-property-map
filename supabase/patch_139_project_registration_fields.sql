-- Presentation Studio 2.0, item 1: DLD/RERA/Trakheesi/Madmoun fields.
-- UAE real-estate credibility fields flagged as missing during a platform
-- review -- RERA fields already exist on `brokers` (patch_30: brn/orn/
-- rera_card_path), but nothing exists on `projects` (permit-level) or
-- `developers` (organization-level registration). All 4 are nullable,
-- manual-entry-only text fields -- never auto-populated/validated against
-- any real DLD/RERA/Madmoun API, exactly like brokers.brn/orn already are.
alter table projects add column if not exists dld_permit_number text;
alter table projects add column if not exists trakheesi_number text;
alter table projects add column if not exists madmoun_qr_url text;

-- Developer-level RERA registration number -- distinct from brokers.brn/
-- orn, which belong to the individual broker, not the developer
-- organization itself.
alter table developers add column if not exists rera_registration_number text;

notify pgrst, 'reload schema';
