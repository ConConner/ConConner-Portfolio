set local check_function_bodies = off;

create table "public"."content_downloads" (
  "id"         bigint generated always as identity not null,
  "content_id" text   not null,
  "name"       text   not null,
  "path"       text   not null,
  "date"       date   not null,
  constraint "content_downloads_pkey" primary key (id)
);

alter table "public"."content_downloads"
  enable row level security;

create table "public"."content_images" (
  "id"         bigint  generated always as identity not null,
  "content_id" text    not null,
  "url"        text    not null,
  "position"   integer not null default 0,
  constraint "content_images_pkey" primary key (id)
);

alter table "public"."content_images"
  enable row level security;

create table "public"."content_items" (
  "id"          text                     not null,
  "type"        text                     not null,
  "game_id"     text,
  "name"        text                     not null,
  "authors"     text[]                   not null default '{}'::text[],
  "description" text                     not null default ''::text,
  "date"        date,
  "created_at"  timestamp with time zone not null default now(),
  "updated_at"  timestamp with time zone not null default now(),
  constraint "content_items_pkey" primary key (id),
  constraint "content_items_type_check" check ((type = ANY (ARRAY['hack'::text, 'tool'::text])))
);

alter table "public"."content_items"
  enable row level security;

create table "public"."games" (
  "id"      text not null,
  "name"    text not null,
  "console" text not null,
  "sha1"    text not null,
  "crc32"   text not null,
  constraint "games_pkey" primary key (id)
);

alter table "public"."games"
  enable row level security;

create table "public"."timeline_entries" (
  "id"          text not null,
  "date"        date not null,
  "name"        text not null,
  "description" text not null,
  "image"       text,
  constraint "timeline_entries_pkey" primary key (id)
);

alter table "public"."timeline_entries"
  enable row level security;

create or replace function public.is_admin()
  returns boolean
  language sql
  stable
  AS $function$
  select auth.email() = 'conner@conconner.com';
$function$;

alter table "public"."content_downloads"
  add constraint "content_downloads_content_id_fkey" foreign key (content_id) references public.content_items(id) on delete cascade;

alter table "public"."content_images"
  add constraint "content_images_content_id_fkey" foreign key (content_id) references public.content_items(id) on delete cascade;

alter table "public"."content_items"
  add constraint "content_items_game_id_fkey" foreign key (game_id) references public.games(id);

create policy "content_downloads are admin writable" on "public"."content_downloads"
  for all
  to "authenticated"
  using (public.is_admin())
  with check (public.is_admin());

create policy "content_downloads are publicly readable" on "public"."content_downloads"
  for select
  to PUBLIC
  using (true);

create policy "content_images are admin writable" on "public"."content_images"
  for all
  to "authenticated"
  using (public.is_admin())
  with check (public.is_admin());

create policy "content_images are publicly readable" on "public"."content_images"
  for select
  to PUBLIC
  using (true);

create policy "content_items are admin writable" on "public"."content_items"
  for all
  to "authenticated"
  using (public.is_admin())
  with check (public.is_admin());

create policy "content_items are publicly readable" on "public"."content_items"
  for select
  to PUBLIC
  using (true);

create policy "games are admin writable" on "public"."games"
  for all
  to "authenticated"
  using (public.is_admin())
  with check (public.is_admin());

create policy "games are publicly readable" on "public"."games"
  for select
  to PUBLIC
  using (true);

create policy "timeline_entries are admin writable" on "public"."timeline_entries"
  for all
  to "authenticated"
  using (public.is_admin())
  with check (public.is_admin());

create policy "timeline_entries are publicly readable" on "public"."timeline_entries"
  for select
  to PUBLIC
  using (true);

grant execute on function "public"."is_admin"() to public, "postgres";

grant maintain, references, select, trigger, truncate on table "public"."content_downloads" to "anon";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."content_downloads" to "authenticated", "postgres", "service_role";

grant maintain, references, select, trigger, truncate on table "public"."content_images" to "anon";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."content_images" to "authenticated", "postgres", "service_role";

grant maintain, references, select, trigger, truncate on table "public"."content_items" to "anon";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."content_items" to "authenticated", "postgres", "service_role";

grant maintain, references, select, trigger, truncate on table "public"."games" to "anon";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."games" to "authenticated", "postgres", "service_role";

grant maintain, references, select, trigger, truncate on table "public"."timeline_entries" to "anon";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."timeline_entries" to "authenticated", "postgres", "service_role";
