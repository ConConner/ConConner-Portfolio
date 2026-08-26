create table if not exists public.content_downloads (
  id bigint generated always as identity primary key,
  content_id text not null references public.content_items (id) on delete cascade,
  name text not null,
  -- Either a Storage URL / site-relative path, or an external release link
  -- (GitHub, nightly.link) that is left untouched.
  path text not null,
  -- Free-form, not a `date`: existing entries include partial dates
  -- ("2018-12") and empty strings (external links with no release date),
  -- and the UI renders the value verbatim.
  date text not null default ''
);
