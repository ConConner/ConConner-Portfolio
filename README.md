# ConConner's Crazy Content

Conner's personal portfolio site — a showcase for his GBA/SNES ROM hacks and tools, with an in-browser ROM patcher that lets visitors apply his patches to their own ROMs without uploading anything.

Live at [conconner.com](https://conconner.com).

## Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)
- [React Router](https://reactrouter.com/) for client-side routing
- [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix primitives)
- [Rom Patcher JS](https://github.com/marcrobledo/RomPatcher.js) (vendored, see `rom-patcher-js.md`) powers the client-side ROM patching tool

## Development

```bash
npm install
npm run dev       # start the dev server
npm run build     # typecheck and build for production
npm run lint      # run ESLint
npm run preview   # preview the production build locally
```

## Content

Hacks, tools, games, and timeline entries are all data-driven from JSON in `src/data/` (`database.json`, `timeline.json`) rather than hardcoded into components — see `CLAUDE.md` for how the data flows through the app.

## Deployment

Deployed on [Vercel](https://vercel.com/); `vercel.json` rewrites all routes to `index.html` for SPA routing, and `CNAME` points the custom domain.
