create table if not exists public.content_downloads (
  id bigint generated always as identity primary key,
  content_id text not null references public.content_items (id) on delete cascade,
  name text not null,
  path text not null,
  date date not null
);
