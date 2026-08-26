create table if not exists public.games (
  id text primary key,
  name text not null,
  console text not null,
  sha1 text not null,
  crc32 text not null
);
