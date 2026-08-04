# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Admin dashboard for "Rede Peças" — an auto-parts ordering system for the Angolan market. Admins review WhatsApp customer orders (approve/reject, confirm stock), manage supplier inventory (Excel/CSV import), and view customers and revenue analytics. Next.js 16 (App Router) + React 19 + TypeScript + Redux Toolkit + Tailwind CSS v4. Talks to a separate backend API (not in this repo).

**Note:** this rewrote a prior Vite SPA version of the app (single `src/App.tsx`). If you find references to that architecture elsewhere (docs, old branches), they're stale — this is now a Next.js App Router project with Redux state.

## Commands

```bash
npm run dev       # next dev -p 3000 — backend must be running separately for the app to work
npm run build      # next build
npm run lint       # eslint .
npm run start       # serve the production build (-p 3000)
```

There is no test suite.

Set `NEXT_PUBLIC_API_URL` (and `BACKEND_API_URL`, unused by client code but kept for parity) in `.env.local` — see `.env.example`. Defaults to `http://localhost:4000/v1` if unset.

## Architecture

### Routing (App Router, two route groups)

- `app/(auth)/` — login, forgot-password, reset-password. Each page is a thin server wrapper around a `*Form.tsx` client component. Layout has no auth guard (these pages are for logged-out users).
- `app/(dashboard)/` — dashboard, orders, inventory, customers. `app/(dashboard)/layout.tsx` is a client component that gates all dashboard routes: it waits for client mount (to avoid SSR/CSR hydration mismatch against `localStorage`-backed auth state), then redirects to `/login` if there's no access token in the Redux store.
- Each dashboard feature folder follows the same internal pattern: `page.tsx` (client component, connects to Redux, owns local UI state) + `types.ts` (page-local view types, often re-exporting/narrowing a slice's domain type) + `adapters.ts` (maps Redux/API shapes to the page's view-row shape).

### State: Redux Toolkit, one slice per domain

`store/{auth,orders,inventory,customers,analytics}/` — each domain has a `*Service.ts` (raw axios calls) and a `*Slice.ts` (createAsyncThunk wrapping the service calls + createSlice with `status`/`error` fields). `store/index.ts` combines all five reducers. `store/hooks.ts` exports typed `useAppDispatch`/`useAppSelector`. `store/provider.tsx` wraps the app in `<Provider>` from `app/layout.tsx`.

When adding a new domain, follow the existing service+slice pair pattern rather than calling `api` directly from components.

### API client (`lib/api.ts`)

Single shared axios instance. Request interceptor attaches `Bearer <token>` from `tokens.access.token`, read from whichever of `localStorage`/`sessionStorage` holds the `auth` blob (see below). Response interceptor globally handles 401s: clears both storages, shows a full-page loading overlay, and hard-redirects to `/login` — guarded against firing more than once per page load. All API calls must go through this instance.

### Auth persistence: "remember me" controls storage, not just duration

`authSlice.ts` writes the `{ admin, tokens }` blob to `localStorage` if `rememberMe` was checked at login, otherwise `sessionStorage` — never both. Reads (`lib/api.ts`, `authSlice`'s `readStoredAuth`) always check both, since which one holds the data isn't known ahead of time. Keep this in sync if you touch login/logout logic — writing to the wrong storage silently breaks "remember me" or leaks sessions across browser restarts.

### Shared `Grid` component (`components/Grid/Grid.tsx`)

Presentational, domain-agnostic sortable/paginated table used by orders, inventory, and customers pages. It only sorts and paginates rows it's given — callers own filtering/search and must pass a referentially stable `rows` array (page auto-resets to 1 whenever `rows` changes identity, so an unstable reference from e.g. polling will unexpectedly reset pagination). Column defs are `GridColumn<T>[]` (`components/Grid/types.ts`): `cell`/`sortValue` are render/sort functions per column, not field accessors.

### Inventory upload

`app/(dashboard)/inventory/adapters.ts` parses uploaded Excel/CSV rows client-side (via `xlsx`, loaded elsewhere in the upload flow), matching many Portuguese/English header name variants (`COLUMN_ALIASES`) before normalizing to `UploadItemPayload`. Rows missing a reference or name are dropped and counted in `skippedCount`; columns with no matching header anywhere are reported in `missingColumns` for the UI to surface.

## Conventions

- **UI text and code identifiers are English**, unlike the prior Vite version. The one Portuguese-locale holdout is currency formatting: `lib/format.ts`'s `formatKwanza` uses `Intl.NumberFormat('pt-AO', { currency: 'AOA' })`. Don't reintroduce Portuguese domain names in new code.
- Styling is Tailwind v4 utility classes inline in JSX (`app/globals.css` defines the theme via `@theme`/`@import "tailwindcss"` — no separate `tailwind.config.js`). No CSS modules or styled-components.
- Path alias `@/*` maps to the repo root (see `tsconfig.json`), e.g. `@/store/hooks`, `@/lib/api`.
- Client components are explicitly marked `'use client'`; pages default to server components unless they need hooks/Redux, in which case the interactive part is usually split into a separate `*Form.tsx`/component.
- Orders are polled every 15s (`setInterval` in `OrdersPage`), matching the old app's polling behavior.
