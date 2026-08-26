create table if not exists public.content_images (
  id bigint generated always as identity primary key,
  content_id text not null references public.content_items (id) on delete cascade,
  url text not null,
  position int not null default 0
);
