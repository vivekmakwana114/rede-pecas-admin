# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Admin dashboard for "Rede Peças" — an auto-parts ordering system for the Angolan market. Admins approve/reject WhatsApp customer orders and upload supplier inventory via Excel/CSV. React 19 + TypeScript + Vite SPA; talks to a separate backend API (not in this repo) at `http://localhost:3000/v1`.

## Commands

```bash
npm run dev       # Vite dev server (backend must be running on :3000 for the app to work)
npm run build     # tsc -b && vite build
npm run lint      # eslint .
npm run preview   # serve the production build
```

There is no test suite.

## Architecture

The entire app lives in two source files:

- `src/App.tsx` — the whole UI: login screen, dashboard, order approval/rejection, toast notifications, and Excel/CSV inventory upload (parsed client-side with `xlsx`, column headers normalized across many naming variants, then POSTed as JSON). No router, no state library — a single component gated on the presence of a JWT.
- `src/services/api.ts` — the shared axios instance. A request interceptor attaches the JWT from `localStorage` (key: `rp_admin_token`). All API calls must go through this instance.

Backend endpoints consumed: `POST /admin/login` (password-only auth), `GET /admin/pedidos` (returns `{ pendentes, aprovados }`, polled every 15s), `POST /admin/pedidos/:numero/aprovar|rejeitar`, `POST /admin/inventory/upload`.

## Conventions

- **Domain language is Portuguese (pt-AO / pt-PT)**: variable names (`pedidos`, `fornecedor`, `senha`), API fields, and all UI text. Currency is AOA formatted with `Intl.NumberFormat('pt-AO')`. Keep new code consistent with this — don't translate domain terms to English.
- Styling is Tailwind utility classes inline in JSX; no CSS modules or styled-components.

## Known Quirks

- **Tailwind version mismatch**: `package.json` has Tailwind v4 (`tailwindcss@^4`, `@tailwindcss/postcss`), but `src/index.css` uses v3-style `@tailwind` directives and `tailwind.config.js` is a v3 config (v4 ignores it without an `@config` directive). Custom `primary` colors defined there are likely not applied — the app only uses default palette classes (`slate`, `sky`, `emerald`, etc.). If styles break, this mismatch is the first place to look.
- The API base URL is hardcoded in `src/services/api.ts` rather than read from an env var (`import.meta.env.VITE_...`).
- `fornecedorId` options in the upload form are hardcoded in `App.tsx`, not fetched from the API.
