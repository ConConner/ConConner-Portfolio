-- Only Conner's account may write. Reads are public.
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select auth.email() = 'conner@conconner.com';
$$;

alter table public.games enable row level security;
alter table public.content_items enable row level security;
alter table public.content_images enable row level security;
alter table public.content_downloads enable row level security;
alter table public.timeline_entries enable row level security;
-- Storage buckets and their storage.objects policies are not managed here:
-- the declarative planner only manages the `public` schema, and
-- storage.objects is owned by supabase_storage_admin. They live in the
-- hand-written `*_storage_buckets` migration instead.

create policy "games are publicly readable" on public.games
  for select using (true);
create policy "games are admin writable" on public.games
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "content_items are publicly readable" on public.content_items
  for select using (true);
create policy "content_items are admin writable" on public.content_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "content_images are publicly readable" on public.content_images
  for select using (true);
create policy "content_images are admin writable" on public.content_images
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "content_downloads are publicly readable" on public.content_downloads
  for select using (true);
create policy "content_downloads are admin writable" on public.content_downloads
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "timeline_entries are publicly readable" on public.timeline_entries
  for select using (true);
create policy "timeline_entries are admin writable" on public.timeline_entries
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
