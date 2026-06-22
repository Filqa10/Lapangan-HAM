# HAM Stadium Booking

Next.js booking app for HAM field reservations with Supabase Auth, Postgres, Storage, role-based customer/admin areas, two-stage payment proof uploads, and admin verification flows.

## Features

- Public landing/about experience for booking guidance and field imagery.
- Customer dashboard, booking creation, booking history, DP proof upload, and final payment proof upload.
- Admin dashboard, field creation/update/deactivation, booking verification, payment proof review, and cancellation flows.
- Supabase-backed auth/profile roles, row-level security, storage policies, and RPCs for admin payment transitions.
- Indonesian pricing rules and status labels for local field operations.

## Stack

- Next.js 16 App Router with React 19 and TypeScript.
- Tailwind CSS v4 via PostCSS.
- Supabase SSR client, Postgres, Auth, and Storage.
- Vitest for unit and action tests.
- Resend for optional booking approval email notifications.

## Requirements

- Node.js 20 or newer.
- npm.
- A Supabase project with Auth, Postgres, and Storage enabled.
- Optional: a Resend API key if approval notification emails should be sent.

## Environment Variables

Create `.env.local` for local development. Keep it local; do not commit real secrets.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key

# Optional email notifications
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL="HAM Futsal <booking@example.com>"
BOOKING_APPROVAL_EMAIL_TO=ops@example.com
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required by the browser client, server client, and Next proxy. Resend variables are optional; the app skips email sending when `RESEND_API_KEY` is empty.

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful routes:

- `/about` - public booking overview.
- `/customer` - customer dashboard, protected by Supabase session.
- `/customer/booking/create` - customer booking form.
- `/customer/history` - customer booking history.
- `/admin` - admin dashboard, protected by Supabase role.
- `/admin/fields` - field management.
- `/admin/bookings` - payment verification and booking operations.

Protected customer/admin routes redirect unauthenticated visitors to `/login`. Make sure your Supabase Auth UI or login route is wired before production use.

## Supabase Database And Storage

The SQL sources of truth live in `database/`:

- `database/migration.sql` - Postgres schema, enums, indexes, triggers, RLS policies, and admin RPCs.
- `database/storage.sql` - `field-images` and `payment-proofs` buckets, storage RLS, allowed image MIME types, and 5 MB object limit.

Apply both migrations to a fresh Supabase project before using the app. In managed Supabase workflows, apply them through your migration tool or Supabase MCP. If applying manually for local development, run `migration.sql` first, then `storage.sql`.

After migration:

- Create user accounts through Supabase Auth.
- Promote staff users by setting `public.profiles.role = 'admin'` for the matching auth user.
- Store field images in the public `field-images` bucket.
- Customer payment proofs are stored in the private `payment-proofs` bucket under user-owned folders.

## Scripts

```bash
npm run dev      # Start the local Next.js dev server
npm test         # Run Vitest tests
npm run build    # Run production build and Next type checks
npm run start    # Serve a built app locally
npm run lint     # Run ESLint
npx tsc --noEmit # Optional standalone TypeScript check
```

## Vercel Deployment Prep

This repo includes `vercel.json` for deployment defaults:

- Next.js framework detection.
- Legacy PHP URL redirects to the matching Next.js routes where possible.
- Long-lived cache headers for static assets.
- Conservative security headers that should not interfere with Supabase Auth or image optimization.

Before deploying on Vercel:

- Add the environment variables from this README in the Vercel project settings.
- Use production Supabase URL/key values; never paste service-role keys into browser-exposed variables.
- Apply `database/migration.sql` and `database/storage.sql` to the production Supabase project.
- Configure Supabase Auth redirect URLs for the Vercel domain and any preview domains you intend to test.
- Run `npm test` and `npm run build` locally before creating a preview or production deployment.

## Notes

- `.env.local` is ignored by git and should stay local.
- The legacy PHP/MySQL app has been removed from the top-level runtime paths. New Next/Supabase source lives under `src/`, `database/migration.sql`, and `database/storage.sql`.
- Existing legacy documentation files may be historical only; prefer this README and the SQL files above for the current Next.js/Supabase app.
