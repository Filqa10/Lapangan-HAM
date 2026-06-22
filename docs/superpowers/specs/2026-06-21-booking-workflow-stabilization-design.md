# Booking Workflow Stabilization Design

## Status

Approved for implementation planning.

## Context

The existing redesign work has moved the app toward a Ramp-inspired visual system from `DESIGN.md`, while the previous implementation plan still emphasized a darker "Stadium at Night" interface. The immediate product risk is not visual polish. The booking workflow between customer, admin, Supabase tables, and private payment proof storage has several sync issues that can block core operations.

This spec defines a workflow-first phase. It stabilizes booking/payment data and the confirmation experience before the broader admin redesign and landing motion pass.

## Goals

- Make the customer-to-admin booking workflow reliable end to end.
- Ensure admin can see complete customer identity: name, email, and phone.
- Ensure payment proof access works with the private `payment-proofs` bucket.
- Add a clear confirmation success experience after customer submits final payment proof.
- Align upload copy, validation, and storage bucket policy.
- Include Supabase schema/security hardening discovered during audit.
- Keep visual work focused to state clarity and workflow confidence.

## Non-Goals

- Full visual redesign of `/admin`, `/admin/fields`, or `/admin/bookings`.
- Full motion choreography for the landing page.
- Replacing the current design system.
- Reworking pricing rules beyond keeping app and DB price validation consistent.
- Changing the business status model unless needed to fix a workflow blocker.

## Current Findings

### Confirmed Workflow Blockers

- `src/app/admin/bookings/page.tsx` selects `profiles(name, email)`, but the remote `public.profiles` table does not have an `email` column. Supabase API logs show this request returning `400`.
- `payment-proofs` is a private bucket, but admin booking rows currently derive proof links via `getPublicUrl`. Private proof access should use signed URLs or an authenticated preview route.
- The upload UI says `JPG, PNG, PDF`, while validator and bucket policy allow `image/jpeg`, `image/png`, and `image/webp`.
- Final payment submit returns a success action state, but the UX needs a stronger confirmation panel and path back to history.

### Supabase Audit Notes

- Remote tables exist and have RLS enabled: `profiles`, `fields`, `bookings`, `payments`.
- `bookings.slot_range` exists with a GiST exclusion constraint for no-overlap booking protection.
- Buckets exist:
  - `field-images`: public, 5MB, JPEG/PNG/WebP.
  - `payment-proofs`: private, 5MB, JPEG/PNG/WebP.
- Security advisor warns that `public.is_admin()` is callable by `authenticated` as a `SECURITY DEFINER` RPC.
- Performance advisor reports `idx_bookings_status` unused. This is informational and should not be removed during this phase unless later evidence shows it is truly unnecessary.

### Verification Baseline

- `npm test` currently passes: 61 tests across 11 files.
- `npm run lint` currently fails because ESLint scans `.agents` and `.opencode` skill files, plus app-level lint issues in `ThemeProvider`, i18n context, and one test `any`. Phase 1 should either scope lint correctly or include targeted lint cleanup if needed for a reliable verification command.

## Recommended Approach

Use a workflow-first stabilization pass:

1. Fix data model mismatch and admin query failures.
2. Fix private payment proof access.
3. Add clear success confirmation states.
4. Add focused tests around workflow-critical behavior.
5. Leave full admin polish redesign and landing motion as explicit reminders after phase 1.

This approach reduces risk because the core transaction path becomes reliable before the interface is visually elevated.

## Data Model Design

### Profiles

Add an `email` column to `public.profiles`.

Required shape:

- `id uuid primary key references auth.users`
- `name text not null`
- `email text`
- `phone text`
- `role user_role not null default 'customer'`
- `created_at timestamptz not null default timezone('utc', now())`

Email handling:

- On new auth user creation, `handle_new_user()` should insert `new.email` into `profiles.email`.
- Registration should continue passing `name` and `phone` via metadata.
- Existing rows should be backfilled from `auth.users.email` in a migration.
- Admin booking rows should display `customerName`, `customerEmail`, and `customerPhone`.

Migration safety:

- Use idempotent `alter table ... add column if not exists`.
- Keep lowercase identifiers.
- Do not expose broader profile update permissions. Customer profile updates should remain limited to safe fields. If customers may edit email later, that should be a separate authenticated email-change flow, not a direct profile table edit.

## Booking Workflow Design

### Primary Flow

1. Customer creates booking and uploads DP proof.
2. App inserts `bookings.status = pending`.
3. App uploads DP proof to `payment-proofs/<uid>/<booking_id>/...`.
4. App inserts `payments.payment_type = dp`, `payments.status = pending`.
5. Customer sees success confirmation and can open history.
6. Admin opens `/admin/bookings`, sees customer name/email/phone and latest proof.
7. Admin approves DP via RPC.
8. Booking status becomes `dp_paid`; DP payment becomes `approved`.
9. Customer opens history and clicks complete payment.
10. Customer submits final proof.
11. Booking status becomes `payment_2_pending`; final payment row is inserted as `pending`.
12. Customer stays on the pelunasan page and sees a success panel with a primary CTA to history.
13. History shows the booking as waiting for final payment verification.
14. Admin approves final payment via RPC.
15. Booking status becomes `confirmed`; final payment becomes `approved`.

### Status Semantics

- `pending`: DP proof submitted, waiting for admin verification.
- `dp_paid`: DP approved, customer can submit final payment proof.
- `payment_2_pending`: final payment proof submitted, waiting for admin verification.
- `confirmed`: final payment approved; booking complete.
- `paid`: legacy/alternate complete state. Treat as complete in display and spending calculations.
- `cancelled`: booking cancelled.

## Payment Proof Access Design

The `payment-proofs` bucket remains private.

Preferred implementation:

- Generate short-lived signed URLs on the server for authorized admin/customer views.
- For admin bookings, map the latest relevant payment proof to a signed URL before rendering the client component.
- If signed URL generation fails, show a disabled "Proof unavailable" state instead of a broken link.

Access rules:

- Admin may view any payment proof.
- Customer may only view own payment proofs.
- No proof URL should be made public.
- Do not store signed URLs in the database.

Admin proof selection:

- For `pending`, show latest pending DP proof.
- For `payment_2_pending`, show latest pending final proof.
- For `dp_paid`, show latest approved DP proof.
- For `confirmed` or `paid`, show latest approved final proof, falling back to DP proof if no final proof exists.

## Customer Confirmation Design

### DP Booking Submit

After successful booking creation:

- Show a success panel with booking ID.
- Message: booking and DP proof were submitted and are waiting for admin verification.
- Provide CTA to booking history.
- Preserve enough context so the user understands what happens next.

### Final Payment Submit

Use the approved "both" pattern:

- Stay on the pelunasan page.
- Replace or visually elevate the form feedback with a success panel.
- Include message: final payment proof was submitted and is waiting for admin verification.
- Include primary CTA to `/customer/history`.
- History should show the updated `payment_2_pending` status.

Motion:

- Success panel enters with opacity plus small `translateY` over 180-220ms.
- Use the existing custom ease-out curve.
- Respect `prefers-reduced-motion`: no movement, instant or opacity-only reveal.

## Admin Bookings Design

Phase 1 makes admin bookings reliable, not fully redesigned.

Required table data:

- Booking ID
- Customer name
- Customer email
- Customer phone
- Field
- Date
- Time
- Price
- DP
- Latest payment proof action
- Status
- Booking date
- Actions

Required behavior:

- Page must not fail if optional customer fields are missing.
- View proof action must use a signed URL or authenticated route.
- Approve/cancel actions should show success/error state inline.
- Actions available by status:
  - `pending`: approve DP, cancel.
  - `payment_2_pending`: confirm paid, cancel.
  - `dp_paid`: cancel.
  - `confirmed`, `paid`, `cancelled`: no primary workflow action.

## Admin Fields Design

Phase 1 does not fully redesign admin fields. It should only include changes required to keep field data consistent with booking workflow.

Allowed focused changes:

- Ensure inactive fields are not bookable.
- Keep field create/edit/delete stable.
- Avoid unrelated visual refactors.

Full `/admin/fields` polish is deferred.

## Supabase Hardening Design

### `is_admin()` Advisor Warning

Supabase warns that `public.is_admin()` is callable as an authenticated SECURITY DEFINER RPC.

Preferred fix:

- Move the helper to a non-exposed schema such as `private.is_admin()`.
- Revoke direct execute from public roles.
- Update RLS policies and storage policies to call the private helper.

Fallback if a private schema migration is too broad for phase 1:

- Revoke direct execute where possible and verify policies still work.
- Document remaining advisor warning if Supabase still requires the helper callable for policy evaluation.

Security constraints:

- Keep explicit `set search_path = ''` on security definer functions.
- Keep `auth.uid()` wrapped in `select` inside RLS policies for performance.
- Do not broaden table privileges to solve UI issues.

### Storage Policy Consistency

Keep `payment-proofs` private and image-only.

Update UI and translations to say:

- JPG
- PNG
- WebP
- Max 5MB

Do not claim PDF support unless bucket policy and validator are intentionally expanded.

## Testing Design

### Automated Tests

Add or update focused tests for:

- `parseCreateBookingForm` accepts only JPEG/PNG/WebP and rejects PDF.
- payment proof path remains user-prefixed.
- final payment submit success state can render the CTA-to-history confirmation.
- admin bookings row mapping supports `name`, `email`, and `phone`.
- private proof URL mapping uses signed URL behavior or handles signed URL failure.
- registration/profile creation includes email in the profile insert/update path.

Existing tests must continue passing.

### Manual Verification

Run the full flow:

1. Customer login/register.
2. Create booking with DP proof.
3. Confirm customer sees success confirmation.
4. Confirm admin bookings page loads.
5. Confirm admin sees name, email, phone, and proof link.
6. Confirm proof opens through private/signed access.
7. Approve DP.
8. Customer history shows complete-payment action.
9. Submit final proof.
10. Confirm success panel with CTA to history.
11. Confirm history status is waiting for final verification.
12. Admin approves final payment.
13. Customer history shows confirmed/complete state.

### Verification Commands

Expected phase 1 commands:

- `npm test`
- A scoped lint command or fixed `npm run lint`
- `npm run build`

If `npm run lint` still scans skill directories, update lint configuration or script so project verification is meaningful.

## Risks

- Backfilling `profiles.email` touches auth-owned data; migration must be tested carefully.
- Moving `is_admin()` to a private schema can affect RLS and storage policies. This must be verified against remote advisors and real admin/customer access.
- Signed URL generation can add server-side complexity. The UI must handle URL generation failure gracefully.
- There is a dirty worktree with many existing redesign changes. Implementation should avoid reverting unrelated work.

## Phase 2 Reminders

After phase 1 implementation is complete, remind the user to continue with:

1. Full admin polish redesign for:
   - `/admin`
   - `/admin/fields`
   - `/admin/bookings`
2. Landing page motion polish for `/about` using:
   - `impeccable animate`
   - `motion-design`
   - Emil-style interaction details

Phase 2 should align the admin interface with `DESIGN.md`: light theme, Paper/Limestone surfaces, Obsidian text, Lime action only for primary/active states, strict 4px controls and 12px surfaces, restrained shadows, and product-UI motion under 250ms.

## Acceptance Criteria

- Admin bookings page no longer fails due to missing `profiles.email`.
- Admin booking rows display customer name, email, and phone.
- Payment proof links work without making the private bucket public.
- Customer sees clear success confirmation after DP submit.
- Customer sees clear success confirmation plus CTA to history after final proof submit.
- History reflects `payment_2_pending` after final proof submit.
- Upload copy matches actual allowed file types.
- Supabase schema and storage remain RLS-protected.
- Tests pass.
- Build passes.
- User is reminded to proceed with full admin polish redesign and landing motion after phase 1.
