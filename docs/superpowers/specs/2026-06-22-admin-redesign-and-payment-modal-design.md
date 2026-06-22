# Admin Redesign And Payment Confirmation Modal Design

Date: 2026-06-22
Topic: Redesign Admin Panel and Add Customer Payment Confirmation Modal

## Goal
Improve the overall admin interface and synchronization of the booking workflow between customer and admin in the Lapangan HAM application. This redesign aligns the admin screens (`/admin`, `/admin/fields`, `/admin/bookings`) with the `DESIGN.md` guidelines and dual-theme supports. It also adds a premium confirmation success modal for customers when payment proofs are submitted, and refines landing page motion dynamics.

## User Review Required
No major blocking design changes require review, as the visual layouts and behaviors have been aligned and approved in the brainstorming phase:
- **Confirmation Success Modal**: Will display as a spring-animated overlay with an SVG path-draw checkmark, rather than inline form panels.
- **Adaptive Dual Theme**: Both light and dark modes will be supported in the admin panel, matching `DESIGN.md` in light mode and Obsidian/Charcoal tokens in dark mode.
- **Motion on Landing Page**: Uses lightweight `IntersectionObserver` coupled with native CSS keyframes (optimized for rendering performance and SEO readability).

## Open Questions
All initial questions have been resolved during the collaborative design phase.

## Proposed Changes

### Theme & Styling Tokens
We will refine variables in [globals.css](file:///Users/royanrosyad/Nayor/filq-proj/src/app/globals.css) to support:
- Clean Limestone backgrounds for light mode cards and Paper backgrounds for sections.
- Obsidian dark surfaces and Charcoal card overlays for dark mode.
- Complete removal of `box-shadow` values for cards, relying on borders and flat surface colors.

### Admin Dashboard Redesign
Modify [AdminDashboardClient.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/app/admin/AdminDashboardClient.tsx):
- Restructure the top banner for pending verification to use a desaturated border or dark container with a prominent `Lime Signal` (`#e4f222`) button.
- Clean up Metric Tiles to use flat Limestone backgrounds and precise type sizes.
- Clean up Trend tables, styling headers with lowercase Slate/Bone dividers.

### Admin Fields Redesign
Modify [AdminFieldsClient.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/app/admin/fields/AdminFieldsClient.tsx) and [FieldForm.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/app/admin/fields/FieldForm.tsx):
- Refine field status tags (active/inactive) using desaturated rounded badges.
- Standardize button sizes (4px border-radius, `active:scale-[0.97]`).
- Format price and address values in clear typography.

### Admin Bookings Redesign
Modify [AdminBookingsClient.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/app/admin/bookings/AdminBookingsClient.tsx) and [BookingActionForm.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/app/admin/bookings/BookingActionForm.tsx):
- Refine user lists (customer names primary, email/phone secondary).
- Improve visibility of "Proof Unavailable" warning badges with a clean, low-intensity styling.
- Align decision buttons (Approve / Cancel) into cohesive, compact button structures.

### Customer Payment Confirmation Modal
Create [PaymentSuccessModal.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/components/PaymentSuccessModal.tsx) and integrate it in:
- [BookingCreateForm.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/app/customer/booking/create/BookingCreateForm.tsx)
- [PelunasanForm.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/app/customer/booking/%5Bid%5D/pelunasan/PelunasanForm.tsx)

Modal design specs:
- Backdrop blur and dark opacity overlay.
- Spring-enter transition (`scale(0.95)` to `scale(1.0)` with `cubic-bezier(0.23, 1, 0.32, 1)`).
- Circular checkmark with SVG path dash-offset drawing animation.
- Mini summary card and confirmation navigation button.

### Landing Page Motion Polish
Modify [page.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/app/%28public%29/about/page.tsx):
- Add a lightweight client-side React helper that triggers scroll reveal animation classes (`about-motion-reveal` / `is-visible`).
- Stagger entry animations for Hero title, subtitle, CTA button, and facilities cards using short, distinct delays.
- Support `prefers-reduced-motion: reduce` by replacing all offsets/translates with simple opacity fades or instant loads.

---

## Verification Plan

### Automated Tests
- Run `npm run test` to verify no regressions in unit testing.
- Run `npm run lint` and `npm run build` to verify Next.js TypeScript correctness.

### Manual Verification
- Deploy code locally (`npm run dev`) and test the booking flow:
  1. Create a new booking as a customer $\rightarrow$ verify Payment Confirmation Modal pops up.
  2. Log in as an admin $\rightarrow$ verify Redesigned Admin Dashboard, Bookings list, and Fields list.
  3. Approve the DP $\rightarrow$ check customer receives updated state in history.
  4. Perform Pelunasan as a customer $\rightarrow$ verify final success modal pops up.
  5. Confirm final payment as an admin $\rightarrow$ check workflow resolves to `confirmed` status.
