-- Per-church engagement-button links (Request prayer, I'm new here, Plan a
-- visit, Join online community). Stored as JSONB so we can add or rename
-- buttons later without further migrations.
--
-- Idempotent — safe to re-run.

alter table public.churches
  add column if not exists engagement_links jsonb default '{}'::jsonb;
