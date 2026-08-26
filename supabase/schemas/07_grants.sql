-- Table privileges are declared explicitly rather than relying on the
-- "grant everything to anon/authenticated" default privileges, so the
-- declarative planner has a stable target. RLS (06_auth_policies.sql) is
-- what actually decides who may write.
grant select on public.games to anon, authenticated;
grant insert, update, delete on public.games to authenticated;

grant select on public.content_items to anon, authenticated;
grant insert, update, delete on public.content_items to authenticated;

grant select on public.content_images to anon, authenticated;
grant insert, update, delete on public.content_images to authenticated;

grant select on public.content_downloads to anon, authenticated;
grant insert, update, delete on public.content_downloads to authenticated;

grant select on public.timeline_entries to anon, authenticated;
grant insert, update, delete on public.timeline_entries to authenticated;

grant select, insert, update, delete on public.games to service_role;
grant select, insert, update, delete on public.content_items to service_role;
grant select, insert, update, delete on public.content_images to service_role;
grant select, insert, update, delete on public.content_downloads to service_role;
grant select, insert, update, delete on public.timeline_entries to service_role;
