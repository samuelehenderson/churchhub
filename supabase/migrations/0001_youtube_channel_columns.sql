-- Adds the columns the YouTube channel resolver writes to.
-- Idempotent: safe to re-run.

alter table public.churches
  add column if not exists youtube_channel_id           text,
  add column if not exists youtube_channel_title        text,
  add column if not exists youtube_channel_thumbnail    text,
  add column if not exists youtube_channel_original_url text;
