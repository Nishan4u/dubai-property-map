-- patch_53_invitations.sql included these two ALTER statements, but the
-- salespersons one apparently never actually applied to the live database
-- (confirmed: no invitation_id column, no FK) -- pre-existing gap, found
-- while debugging an unrelated 500 on the developer salespersons page
-- (its query joins salespersons -> invitations, which PostgREST correctly
-- reported as a nonexistent relationship). Both lines are exactly as
-- written in patch_53 and are safe to re-run (if not exists).
alter table team_members add column if not exists invitation_id uuid references invitations(id) on delete set null;
alter table salespersons add column if not exists invitation_id uuid references invitations(id) on delete set null;

notify pgrst, 'reload schema';
