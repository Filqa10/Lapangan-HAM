# Admin Polish And Landing Motion Design

Date: 2026-06-22
Scope choice: Balanced premium pass

## Goal

Make the authenticated admin experience feel like a calm, trustworthy stadium operations cockpit while giving the public landing page a more premium, intentional motion layer. This phase is a visual, interaction, and responsive polish pass. It must preserve the booking workflow and data contracts stabilized in the previous phase.

## Non-Goals

- Do not change booking, payment, or approval business logic.
- Do not apply Supabase migrations or remote DB changes in this phase.
- Do not add new product features beyond UI polish, states, responsive behavior, and motion.
- Do not replace the existing brand direction or stadium image assets.
- Do not introduce heavy animation libraries unless the current code clearly benefits from them. CSS and small client helpers are preferred.

## Design Principles

- Admin UI serves repeated work. It should be dense, scannable, restrained, and predictable.
- Landing UI sells confidence. It should use real stadium imagery, strong hierarchy, and motion that guides attention.
- Motion must communicate state, reveal structure, or add premium pacing. It must not delay task flow.
- Components should share one vocabulary: small-radius controls, clear focus states, consistent icon usage, and stable table dimensions.
- Every polish change must survive mobile and desktop viewports without text overlap.

## Admin Design Direction

The admin surface should read as an operations cockpit, not a marketing dashboard. The page shell should feel quieter and more deliberate:

- Sidebar remains familiar, but active states should avoid decorative side stripes. Use filled active states, icon color, and text weight instead.
- Header areas should emphasize the current task and the next useful action.
- Cards should use restrained surfaces with one accent for priority states. Avoid a rainbow stat-card wall.
- Tables should be denser, easier to scan, and more robust on smaller screens.
- Action buttons should use consistent sizes, tones, hover/focus/disabled states, and lucide icons where useful.

### Admin Dashboard

Dashboard priority should be:

1. Verification work waiting for admin attention.
2. Operational health: active fields, total bookings, confirmed bookings.
3. Revenue snapshots: today, this month, approved payment totals.
4. Trends as supporting context, not the main visual noise.

Expected changes:

- Replace the current highly saturated stat-card grid with calmer metric tiles.
- Give pending verification a stronger but contained treatment.
- Add clearer section grouping for verification, revenue, and trends.
- Improve empty states for trend tables.
- Keep data fetching/server-client split intact.

### Admin Bookings

Bookings page should become the main verification workspace.

Expected changes:

- Keep the table and signed private proof links from the workflow stabilization phase.
- Make pending/payment verification statuses easier to filter and identify.
- Improve customer cell hierarchy: name first, email/phone secondary.
- Improve proof unavailable/error messaging so admin knows whether it is missing proof, signed URL failure, or schema/load issue.
- Use action button styling that makes approve and cancel decisions clear without shouting.
- Keep pagination/search/sort behavior working.

### Admin Fields

Fields page should feel like inventory management.

Expected changes:

- Make active/inactive state easier to scan.
- Improve price and address hierarchy.
- Use consistent edit/delete controls.
- Add better empty state copy for no fields.
- Keep create/edit routes and actions unchanged.

### Admin Forms

Field create/edit forms should receive the same polish language:

- clearer labels and helper copy,
- consistent field spacing,
- stable submit/cancel button row,
- accessible focus states,
- inline error/success behavior if already available.

## Landing Motion Direction

The landing page should keep its current content and image assets, but motion should make the page feel intentionally crafted.

Motion personality: premium/corporate hybrid.

- Admin/product surfaces: 150-250ms, crisp, mostly transition-based.
- Landing hero and section reveals: 300-600ms, smooth ease-out or existing `--ease-out`.
- Reduced motion must remove transform movement and keep content visible.
- Content must never depend on JS animation to become visible.

### Landing Hero

Expected changes:

- Hero text enters with a short stagger: eyebrow, title, paragraph, CTA.
- Stadium image reveals with opacity plus clip/scale or translate, not opacity-only.
- CTA hover/press feedback should feel responsive and match existing button press behavior.
- Nav should feel connected to the hero, with cleaner active/hover polish.

### Landing Sections

Expected changes:

- Facilities cards reveal in a small cascade when entering viewport.
- Gallery image gets a subtle reveal.
- Pricing table rows can reveal lightly or use hover/focus polish; avoid distracting row animations.
- FAQ and final CTA receive quieter reveal/interaction polish.
- Motion should use transform/opacity/clip-path only.

## Responsive And Accessibility Requirements

- Admin sidebar must not make mobile unusable. If current mobile admin is constrained, provide a pragmatic responsive fallback such as a top compact nav or collapsed layout.
- Tables must remain usable on narrow screens through horizontal scroll or compact cards.
- All interactive controls need visible focus states.
- Text contrast should meet product UI readability standards.
- `prefers-reduced-motion: reduce` must disable transform-based reveal movement.
- No text should overflow buttons, cards, table cells, or hero containers.

## Technical Approach

- Preserve existing Next.js 16 App Router patterns and server/client boundaries.
- Prefer reusable polish helpers/classes in `src/app/globals.css` only when they serve multiple surfaces.
- Prefer small component extraction only when it reduces duplication: metric tile, admin page header, empty state, or motion reveal wrapper.
- Use existing lucide icons.
- Avoid adding a large animation dependency. If scroll-triggered reveal needs JS, implement a small IntersectionObserver client utility with safe visible defaults.
- Keep Supabase queries and workflow actions unchanged unless a UI state needs existing fields already returned.

## Verification Plan

- Run `npm test`.
- Run `npm run lint`.
- Run `npm run build`.
- Start the local dev server.
- Browser QA desktop and mobile for:
  - `/admin`
  - `/admin/bookings`
  - `/admin/fields`
  - `/about`
- Capture screenshots or inspect rendered pages for:
  - non-overlapping text,
  - responsive table behavior,
  - visible focus/hover/disabled states,
  - landing motion rendering content by default,
  - reduced-motion CSS fallback.

## Acceptance Criteria

- Admin dashboard, bookings, fields, and field forms feel visually cohesive and more polished than the current state.
- Admin workflow remains intact: approve DP, approve final payment, cancel booking, view private proof via signed URL.
- Landing page has intentional hero/section motion without breaking accessibility or content visibility.
- No business logic regression.
- Final `npm test`, `npm run lint`, and `npm run build` pass.
- Browser QA does not reveal obvious layout overlap or blank animated content.

