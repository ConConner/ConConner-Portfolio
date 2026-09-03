create table if not exists public.content_items (
  id text primary key,
  type text not null check (type in ('hack', 'tool', 'project')),
  -- Space-separated in the JSON ("zm mf"), so an item can target several
  -- games. Stored as an array (like `authors`) and joined back into a single
  -- string by db.ts. No FK to games(id): the ids come from a fixed dropdown.
  game_ids text[] not null default '{}',
  name text not null,
  authors text[] not null default '{}',
  description text not null default '',
  date date,
  -- Curated display order (the order the JSON array had). Lower comes first.
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
