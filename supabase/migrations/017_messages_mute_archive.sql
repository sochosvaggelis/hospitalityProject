-- Migration 017: Per-user mute and archive state for conversations.
-- Each array holds the emails of participants who muted / archived the thread,
-- so the action is independent for each side of the conversation.
alter table public.conversations add column if not exists archived_by text[] default '{}';
alter table public.conversations add column if not exists muted_by text[] default '{}';
