alter table "public"."content_items"
  drop constraint "content_items_type_check";

create table "public"."blog_posts" (
  "id"          text                     not null,
  "title"       text                     not null,
  "excerpt"     text                     not null default ''::text,
  "body"        text                     not null default ''::text,
  "cover_image" text,
  "date"        date                     not null,
  "created_at"  timestamp with time zone not null default now(),
  "updated_at"  timestamp with time zone not null default now(),
  constraint "blog_posts_pkey" primary key (id)
);

alter table "public"."blog_posts"
  enable row level security;

alter table "public"."content_items"
  add constraint "content_items_type_check" check ((type = ANY (ARRAY['hack'::text, 'tool'::text, 'project'::text])));

create policy "blog_posts are admin writable" on "public"."blog_posts"
  for all
  to "authenticated"
  using (public.is_admin())
  with check (public.is_admin());

create policy "blog_posts are publicly readable" on "public"."blog_posts"
  for select
  to PUBLIC
  using (true);

grant maintain, references, select, trigger, truncate on table "public"."blog_posts" to "anon";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."blog_posts" to "authenticated", "postgres", "service_role";
