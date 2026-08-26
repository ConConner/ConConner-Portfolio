# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Conner's personal portfolio site — a showcase for GBA/SNES ROM hacks and tools he's authored, plus an in-browser ROM patcher that lets visitors apply his patches to their own ROMs. React + TypeScript SPA built with Vite, deployed to Vercel (see `vercel.json` SPA rewrite, `CNAME`).

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — typecheck (`tsc -b`) then `vite build`
- `npm run lint` — ESLint over the whole project
- `npm run preview` — serve the production build locally

There is no test suite/runner configured in this project.

## Architecture

### Content is data-driven, not hardcoded

All portfolio content (ROM hacks, tools, games, timeline events) lives in JSON, not component code:

- `src/data/database.json` — the `content` array (hacks/tools, each with `id`, `type`, `game`, `authors`, `description`, `images[]`, `downloads[]`) and a `games` map keyed by game id (`name`, `console`, `SHA-1`, `CRC32`).
- `src/data/timeline.json` — standalone timeline entries not tied to a content item.
- `src/data/types.ts` — the `ContentItem` / `Game` / `TimelineEntry` shapes those files must conform to.
- `src/data/db.ts` — the only place that reads the JSON. All lookups (`getContentById`, `getGameById`, `getContentByType`, etc.) go through here; components never import the JSON directly. `getUnifiedTimeline()` merges `content` (derives a date from `item.date` or the earliest download) and `timeline.json` entries into one reverse-chronological feed.

When adding a new hack/tool, add an entry to `database.json` (and a `games` entry if it targets a new game), not a new component or route — `Content.tsx` and the detail route render from the data automatically. Static assets referenced by `images`/`downloads` paths live under `public/data/` (`images/`, `patches/`, `logos/`, `files/`, organized per-hack by id).

### Routing

Routes are declared centrally in `src/main.tsx` (no nested/lazy routing): `/`, `/projects`, `/projects/:id`, `/patch/:hackId`. `getAllContent()`/`getAllGames()` are called once at module load in `main.tsx` and passed down as props (e.g. into `ContentDetailRoute`), rather than re-fetched per-page.

### The ROM patcher is a wrapped third-party vanilla-JS engine

`src/components/Patcher.tsx` integrates [Rom Patcher JS](https://github.com/marcrobledo/RomPatcher.js) (vendored under `public/rom-patcher-js/`, loaded as a `<script>` tag at runtime — see `rom-patcher-js.md` for the upstream API this wraps: `RomPatcherWeb.initialize`, `setEmbededPatches`, the `oninitialize`/`onloadrom`/`onvalidaterom`/`onpatch` events). This is a legacy imperative library, not a React component, so the wrapper has real constraints to preserve:

- The engine binds itself to DOM nodes by fixed ids (`rom-patcher-container`, `rom-patcher-input-file-rom`, `rom-patcher-select-patch`, `rom-patcher-button-apply`) that must exist in the DOM before `initialize()` runs; `Patcher.tsx` polls (`setInterval`) until both the script and the container are ready.
- `window.__isRomPatcherInitialized` tracks whether the engine has already bound itself for this page load. First mount calls `engine.initialize(...)`; navigating to a different patch on an already-initialized engine calls `engine.setEmbededPatches(...)` instead (the engine has no "reinitialize" path). If you land back on a fresh mount of the patcher page while the engine is already marked initialized (i.e. its container was unmounted/remounted, e.g. via back/forward nav), the code forces `window.location.reload()` rather than trying to rebind to dead DOM.
- ROM validation (CRC32 check against `Game.CRC32`) happens entirely client-side in the vendored engine; nothing is uploaded.

`PatcherPage.tsx` reads `hackId` from the route and the patch file path from the `?path=` query param, looks up the corresponding `ContentItem`/`Game` via `db.ts`, and errors out (via `Patcher`'s own `ErrorMessage` states) if the id is missing, the content isn't type `"hack"`, or no `path` was given.

### UI components

Built on shadcn/ui (`components.json`: style `radix-sera`, base color `olive`, icon library `@remixicon/react`) with Radix primitives under `src/components/ui/`. Path alias `@/*` → `src/*` (defined in `vite.config.ts` and `tsconfig.app.json`). Tailwind v4 via `@tailwindcss/vite` (config lives in `src/index.css`, not a separate `tailwind.config.js`). Theming (light/dark) goes through `theme-provider.tsx` + `mode-toggle.tsx`, wrapped around the whole app in `main.tsx`.

### Database schema (Supabase)

The Supabase Postgres schema is declared in the repo, never hand-edited in the Supabase dashboard:

- `supabase/schemas/*.sql` — the declarative source of truth for the `public` schema (tables, the `is_admin()` function, RLS policies, grants). Files load in filename order, so they're number-prefixed.
- `supabase/migrations/*.sql` — generated (or, for storage, hand-written) migrations. This is what actually gets applied to prod.
- `.github/workflows/supabase-deploy.yml` — on push to `main` touching `supabase/migrations/**`, runs `supabase db push --db-url` against the pooled connection string. Requires the repo secret `SUPABASE_DB_URL` (Supavisor session pooler connection string, not the direct `db.<ref>.supabase.co` host — GitHub-hosted runners are IPv4-only and the direct host is IPv6-only).

Workflow for a schema change (Docker must be running; the CLI is a devDependency, so use `npx`/npm scripts, not a global install):

1. Edit the relevant file under `supabase/schemas/`.
2. `npm run db:diff -- <migration_name>` (wraps `supabase db schema declarative sync --no-apply -f <name>`) — spins up a shadow Postgres, diffs the declarative tree against `supabase/migrations/`, and writes a new migration.
3. Review the generated SQL, then `npm run db:reset` to verify the whole chain applies cleanly locally.
4. Commit `supabase/schemas/` **and** the generated migration, push to `main` — the Action applies it to prod.

Two things the declarative planner does *not* manage, which therefore live in hand-written migrations (see `20260826151400_storage_buckets.sql`): DML (declarative files are rejected outright if they insert rows, which rules out `storage.buckets` inserts) and anything outside the `public` schema (e.g. policies on `storage.objects`, owned by `supabase_storage_admin`).

Local ports in `supabase/config.toml` are shifted into the 544xx range (API 54421, db 54422) so this project's local stack doesn't collide with another Supabase project running on the default 543xx ports.
