create table if not exists public.timeline_entries (
  id text primary key,
  date date not null,
  name text not null,
  description text not null,
  image text
);
