-- Run this file ALONE, then run patch_30_broker_salesperson_core.sql
-- separately afterward. Postgres will not let a new enum value be
-- referenced by any statement in the same transaction block it was added
-- in, and the Supabase SQL Editor runs a pasted file as one block.

alter type user_role add value 'broker';
alter type user_role add value 'salesperson';
