create table if not exists public.content_items (
  id text primary key,
  type text not null check (type in ('hack', 'tool')),
  game_id text references public.games (id),
  name text not null,
  authors text[] not null default '{}',
  description text not null default '',
  date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
