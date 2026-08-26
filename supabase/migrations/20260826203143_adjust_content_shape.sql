alter table "public"."content_items"
  drop constraint "content_items_game_id_fkey";

alter table "public"."content_items"
  drop column "game_id";

alter table "public"."content_items"
  add column "game_ids" text[] not null default '{}'::text[];

alter table "public"."content_downloads"
  alter column "date" drop default;

alter table "public"."content_downloads"
  alter column "date" type text using "date"::text;

alter table "public"."content_downloads"
  alter column "date" set default ''::text;

alter table "public"."content_downloads"
  alter column "date" set default ''::text;
