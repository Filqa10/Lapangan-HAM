<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# HAM Stadium Booking — agent notes

Sports-field booking app: Next.js 16 (App Router) + React 19 + Supabase (Postgres/Auth/Storage) + Tailwind v4. Customer portal + admin dashboard with a two-stage DP/final payment flow. User-facing strings are mostly Bahasa Indonesia.

## Commands & verification
- `npm run dev` — dev server on :3000
- `npm run lint` — ESLint flat config (`eslint.config.mjs`)
- `npm test` — Vitest (jsdom, globals on)
- `npm run build` — production build (also runs Next type checks)
- No `typecheck` script: use `npx tsc --noEmit` for a standalone check.
- Before claiming work done, run in order: `lint` → `npx tsc --noEmit` → `test` → `build`.
- Tests are colocated `*.test.ts(x)` next to source and cover server actions + pure logic. Run one file: `npx vitest run src/actions/bookings.test.ts`.

## Next.js 16 quirks (these differ from older Next — do not assume)
- **Middleware is `proxy.ts`, not `middleware.ts`.** The request entrypoint is `src/proxy.ts` exporting `proxy()`. `src/lib/supabase/middleware.ts` is only a helper module (`updateSession`), not the Next entrypoint. Do not "fix" this into a `middleware.ts`.
- **`cookies()` from `next/headers` is async** — it is `await cookies()` (see `src/lib/supabase/server.ts`).
- **Server Actions** are enabled with a 5mb body limit (`experimental.serverActions` in `next.config.ts`) to fit payment-proof uploads.
- When unsure about an API, read `node_modules/next/dist/docs/` (it exists in this repo) instead of guessing.

## Architecture (src/)
- `app/` — App Router. Route groups: `(public)` (landing), `(auth)` (`/auth/customer`, `/auth/admin` + register). Top-level segments: `admin/`, `customer/`, `api/`. Layouts in `admin/layout.tsx` / `customer/layout.tsx` enforce chrome.
- `actions/` — all mutations are server actions (`'use server'`): `auth.ts`, `bookings.ts`, `fields.ts`. Pure helpers split into `*-utils.ts`.
- `lib/supabase/` — three clients: `client.ts` (browser), `server.ts` (RSC/actions), `middleware.ts` (`updateSession` used by `proxy.ts`).
- `lib/i18n/` — client `I18nProvider` context; translations `en.ts` / `id.ts` (English/Indonesian toggle, client-side only, no i18n routing).
- `config/pricing.ts` — slot-based pricing (weekday/friday/weekend, IDR). DP = `max(total*0.3, 500000)`.
- `components/` — presentational + client components (ThemeProvider, sidebars, forms).
- `proxy.ts` — the real Next request entrypoint (see quirks above).
- Path alias: `@/*` → `src/*` (configured in tsconfig + vitest).

## Supabase data model & security
- **SQL source of truth:** `database/migration.sql` (schema, enums, triggers, RLS, RPCs, EXCLUDE constraint) then `database/storage.sql` (buckets). Apply with the **Supabase MCP** `apply_migration`, not the SQL editor.
- Tables: `profiles` (1:1 with `auth.users` via trigger, `role` enum `admin`/`customer`), `fields`, `bookings`, `payments`.
- **Admin payment transitions MUST go through RPCs** (`admin_approve_dp`, `admin_approve_final_payment`, `admin_cancel_booking`) — they check `is_admin()` and run as one transaction. Never mutate booking/payment status with a plain `.update()` from client code; rely on these + RLS.
- **Double-booking is prevented at the DB level**: a GiST `EXCLUDE` constraint on `bookings(slot_range)` where `status <> 'cancelled'` (half-open `[)` ranges, so adjacent slots 08–10/10–12 are allowed) plus a `prevent_double_booking` trigger. The action layer maps `DoubleBookingException` to a user message.
- Booking lifecycle (enum): `pending` → `dp_paid` → `payment_2_pending` → `paid`/`confirmed` (or `cancelled`).
- Storage buckets: `field-images` (public) and `payment-proofs` (private, user-scoped paths, 5mb limit, image MIME only).

## Routing & auth
- `proxy.ts` → `updateSession` refreshes the Supabase session and gates routes: `/admin/*` requires `role='admin'`; `/customer/*` requires login. Mismatched roles are redirected to the right area. Legacy `/login`, `/register` redirect to the new auth routes.
- Server actions re-check auth themselves (`getUser()` / `requireAdmin()`) — don't assume the proxy alone is sufficient.
- Note: `next.config.ts` permanently redirects `/about` → `/`; the landing page lives in `app/(public)/`.

## Legacy doc caveat
`STRUCTURE.md` and `INSTALLATION.md` describe the **old PHP/MySQL app** (removed). They are historical only. Trust `README.md`, `src/`, and `database/*.sql` for the current Next.js/Supabase app. `vercel.json` contains the legacy `.php` → Next.js redirects.

## Conventions
- Server actions return a state object (`{ ok, error?, bookingId?, message? }`) and call `revalidatePath(...)` after mutations.
- Keep `eslint.config.mjs` ignores intact — it excludes agent/tool caches (`.agents`, `.opencode`, `.codex`, `.claude`, `.impeccable`, `.kiro`) so they don't lint-fail the build.
- Env (`.env.local`, not committed): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required). Optional Resend: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `BOOKING_APPROVAL_EMAIL_TO` (email sending is skipped when the key is empty/placeholder).
- Test accounts (remote Supabase project): admin `admin@bookinglapangan.com` / `admin123`, customer `customer@bookinglapangan.com` / `customer123`.

## Skills & MCPs to use
Before writing code, load the matching skill and follow it:
- **`next-best-practices`** — for any App Router, RSC, server actions, async request APIs, metadata, or bundling work (this Next.js version has breaking changes).
- **`supabase-postgres-best-practices`** — before writing/reviewing queries, RLS, indexes, or the schema in `database/*.sql`.
- **`frontend-design`** — for new UI / visual changes.
- **Context7 / Exa MCP** — to look up current external best practices and library docs (Next 16, Supabase JS, Tailwind v4) when the bundled docs are insufficient.
- **Supabase MCP** — already configured in `opencode.json` (remote). Use `apply_migration` for schema changes and `execute_sql` only for non-DDL queries.
