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

All portfolio content (ROM hacks, tools, games, timeline events) comes from Supabase, not component code:

- `src/data/types.ts` — the `ContentItem` / `Game` / `TimelineEntry` shapes everything is mapped into.
- `src/data/db.ts` — the only place that talks to Supabase for content. `initDb()` runs once at bootstrap, fetches `content_items` (with its `content_images` / `content_downloads` rows), `games` and `timeline_entries`, and maps them into the `types.ts` shapes held in module-level state. Every getter (`getContentById`, `getGameById`, `getContentByType`, …) then reads that in-memory copy **synchronously**, so no page needs a loading state. `getUnifiedTimeline()` merges content (deriving a date from `item.date` or the earliest download) and timeline entries into one reverse-chronological feed.
- `src/lib/supabase.ts` — the browser client, built from `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (see `.env.example`).
- `src/data/database.json` / `src/data/timeline.json` — the pre-Supabase content, kept only as the input to `scripts/migrate-to-supabase.ts` and as a fallback until the live site is confirmed working.

Row shape differs from the JSON in two places, both handled in `db.ts`: `game_ids` is a `text[]` (an item can target several games) that maps back to the space-separated `ContentItem.game` string, and `content_downloads.date` is free-form `text` because real entries include partial dates (`"2018-12"`) and empty strings (external release links).

`scripts/migrate-to-supabase.ts` (`npm run migrate:supabase`, `-- --dry-run` to preview) is the one-time import: it uploads `public/data/images/**` to the `content-images` bucket re-encoded as WebP, `public/data/{patches,files}/**` to `content-patches` as-is, and inserts the rows with asset paths rewritten to public Storage URLs. External download links (GitHub, nightly.link) are left untouched. It needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` and is safe to re-run.

### Routing

Routes are declared centrally in `src/main.tsx` (no nested/lazy routing): `/`, `/projects`, `/projects/:id`, `/patch/:hackId`. `main.tsx` renders `Bootstrap` (loading/error), `await initDb()`s, then mounts the router — so `getAllContent()`/`getAllGames()` can still be called once at that point and passed down as props (e.g. into `ContentDetailRoute`), rather than re-fetched per-page.

### The ROM patcher is a wrapped third-party vanilla-JS engine

`src/components/Patcher.tsx` integrates [Rom Patcher JS](https://github.com/marcrobledo/RomPatcher.js) (vendored under `public/rom-patcher-js/`, loaded as a `<script>` tag at runtime — see `rom-patcher-js.md` for the upstream API this wraps: `RomPatcherWeb.initialize`, `setEmbededPatches`, the `oninitialize`/`onloadrom`/`onvalidaterom`/`onpatch` events). This is a legacy imperative library, not a React component, so the wrapper has real constraints to preserve:

- The engine binds itself to DOM nodes by fixed ids (`rom-patcher-container`, `rom-patcher-input-file-rom`, `rom-patcher-select-patch`, `rom-patcher-button-apply`) that must exist in the DOM before `initialize()` runs; `Patcher.tsx` polls (`setInterval`) until both the script and the container are ready.
- `window.__isRomPatcherInitialized` tracks whether the engine has already bound itself for this page load. First mount calls `engine.initialize(...)`; navigating to a different patch on an already-initialized engine calls `engine.setEmbededPatches(...)` instead (the engine has no "reinitialize" path). If you land back on a fresh mount of the patcher page while the engine is already marked initialized (i.e. its container was unmounted/remounted, e.g. via back/forward nav), the code forces `window.location.reload()` rather than trying to rebind to dead DOM.
- ROM validation (CRC32 check against `Game.CRC32`) happens entirely client-side in the vendored engine; nothing is uploaded.

`PatcherPage.tsx` reads `hackId` from the route and the patch file path from the `?path=` query param, looks up the corresponding `ContentItem`/`Game` via `db.ts`, and errors out (via `Patcher`'s own `ErrorMessage` states) if the id is missing, the content isn't type `"hack"`, or no `path` was given.

### UI components

Built on shadcn/ui (`components.json`: style `radix-sera`, base color `olive`, icon library `@remixicon/react`) with Radix primitives under `src/components/ui/`. Path alias `@/*` → `src/*` (defined in `vite.config.ts` and `tsconfig.app.json`). Tailwind v4 via `@tailwindcss/vite` (config lives in `src/index.css`, not a separate `tailwind.config.js`). Theming (light/dark) goes through `theme-provider.tsx` + `mode-toggle.tsx`, wrapped around the whole app in `main.tsx`.

### Admin panel

`/admin` is a private CRUD UI for the Supabase content, deliberately not linked from the public nav. Routes are registered in `main.tsx` alongside the public ones: `/admin/login`, `/admin` (content list), `/admin/content/new`, `/admin/content/:id/edit`, `/admin/timeline`, `/admin/games`.

- `src/admin/auth.ts` — GitHub OAuth sign-in and the `ADMIN_EMAIL` constant. The email check in `AuthGuard` is only defence in depth for the UI; the real gate is the `is_admin()` RLS policies, which reject writes from any other account even via direct `supabase-js` calls. `is_admin()` compares `auth.email()`, so the GitHub account used to sign in must have that address as its primary verified email.
- `src/admin/AuthGuard.tsx` wraps every admin route; `useSession.ts` / `useDbRefresh.ts` are separate modules only because co-locating hooks with components trips the `react-refresh/only-export-components` lint rule.
- `src/admin/storage.ts` — uploads. Images are re-encoded to WebP client-side via `canvas.toBlob(..., "image/webp")` (no dependency needed) so everything uploaded matches the migrated assets; patch files are uploaded untouched as binary.
- After any successful write the page calls `initDb()` again rather than patching local state — one admin, tiny dataset.
- `content_images` / `content_downloads` rows have generated ids, so saving a content item deletes and re-inserts both lists rather than trying to upsert them. Deleting a content item cascades to both; the uploaded files stay in Storage on purpose, so old links keep working.

Auth setup that can't be scripted: register a GitHub OAuth App (callback `https://<project-ref>.supabase.co/auth/v1/callback`), put its client id/secret into Supabase Auth → Providers → GitHub, and add the site + `localhost` URLs under Auth → URL Configuration.

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
