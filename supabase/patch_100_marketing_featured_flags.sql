-- Marketing Platform (Module 20, content-driven pass): Featured Developers
-- and Sponsored Communities. Mirrors the existing projects.featured
-- pattern (patch_99) -- a plain admin-curated boolean, no expiry, since
-- this is manual admin curation rather than a paid time-boxed boost like
-- the developer "Feature a Project" flow.
alter table developers add column if not exists featured boolean not null default false;
alter table communities add column if not exists featured boolean not null default false;

notify pgrst, 'reload schema';
