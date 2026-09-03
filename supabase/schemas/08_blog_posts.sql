create table if not exists public.blog_posts (
  id text primary key,
  title text not null,
  excerpt text not null default '',
  -- Markdown, rendered client-side via react-markdown.
  body text not null default '',
  cover_image text,
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
