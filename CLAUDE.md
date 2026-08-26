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
