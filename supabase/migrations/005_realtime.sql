-- Enable Realtime for messages and conversations tables
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;

-- Full replica identity so UPDATE payloads contain all columns
alter table public.messages replica identity full;
alter table public.conversations replica identity full;
