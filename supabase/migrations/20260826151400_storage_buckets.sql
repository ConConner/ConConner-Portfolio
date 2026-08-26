-- Storage is not covered by the declarative schema tree in supabase/schemas:
-- the planner only manages the `public` schema, bucket rows are DML (which
-- declarative files reject), and storage.objects is owned by
-- supabase_storage_admin. So storage lives in this hand-written migration.

insert into storage.buckets (id, name, public)
values
  ('content-images', 'content-images', true),
  ('content-patches', 'content-patches', true)
on conflict (id) do nothing;

-- storage.objects already has RLS enabled by Supabase.
drop policy if exists "portfolio assets are publicly readable" on storage.objects;
create policy "portfolio assets are publicly readable" on storage.objects
  for select
  using (bucket_id in ('content-images', 'content-patches'));

drop policy if exists "portfolio assets are admin writable" on storage.objects;
create policy "portfolio assets are admin writable" on storage.objects
  for all
  to authenticated
  using (bucket_id in ('content-images', 'content-patches') and public.is_admin())
  with check (bucket_id in ('content-images', 'content-patches') and public.is_admin());
