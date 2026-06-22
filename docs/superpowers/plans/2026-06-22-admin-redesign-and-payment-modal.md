# Admin Redesign And Payment Confirmation Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the administrative interface to match the light/dark adaptive theme based on `DESIGN.md`, add a payment success modal for customers, and polish the landing page motion design.

**Architecture:** Utilize TailwindCSS v4 and CSS custom variables to implement a flat, border-led visual system. Move the inline customer success blocks to an animated modal overlay component containing SVG line animations. Create a client-side IntersectionObserver utility to orchestrate viewport motion on the landing page.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, TailwindCSS v4, Vitest, Testing Library.

## Global Constraints
- **Design Radii**: Controls (buttons/inputs) must use `4px` radius. Card containers, images, and panels must use `12px` radius.
- **Elevation**: Remove all card drop-shadows. Use background color shifts (`#f4f2f0` vs `#ffffff` in light mode) and 1px borders (`#d2cecb` / `#33302d`) for elevation layout.
- **Button Feedback**: All buttons must scale to `scale(0.97)` on active press.
- **Accessibility & Motion**: Support `prefers-reduced-motion: reduce` by disabling shifts (`translate`). Animations must not block users or hide content if JavaScript is disabled.

---

### Task 1: CSS Variables & Core Styling Tokens

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumed: CSS variables and base button transitions.
- Produced: Refined CSS custom variables, active state button scaling, and modern entry animation keyframes.

- [ ] **Step 1: Write styling rules in globals.css**
  We will update `src/app/globals.css` to refine border radius styling, button transitions, remove shadows, and add animations.

  Target content replacement (around line 5):
  ```css
  :root {
    /* Surfaces - Default: Light Mode */
    --bg-body: #F4F2F0;
    --bg-card: #FFFFFF;
    --bg-sidebar: #FFFFFF;
    --bg-input: #FFFFFF;
    --bg-hero-gradient: linear-gradient(135deg, #1E40AF 0%, #4338CA 50%, #3730A3 100%);
    --bg-action-hover: rgba(15, 23, 42, 0.05);

    /* Accents */
    --accent-blue: #0C0A08;
    --accent-blue-hover: #1A1919;
    --accent-emerald: #10B981;
    --accent-amber: #D97706;
    --accent-red: #DC2626;
    --accent-cyan: #0891B2;
    --accent-purple: #7C3AED;

    /* Text */
    --text-primary: #0C0A08;
    --text-secondary: #4D505D;
    --text-muted: #6B6D75;

    /* Borders */
    --border-subtle: #D2CECB;
    --border-focus: #0C0A08;
    --accent-lime: #E4F222;

    /* Animation */
    --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
    --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
    --duration-fast: 150ms;
    --duration-normal: 200ms;
    --duration-slow: 300ms;
  }
  ```

  And define the spring pop transitions and checkmark path-drawing animation keyframes:
  ```css
  /* Checkmark drawing keyframes */
  @keyframes pathDraw {
    to {
      stroke-dashoffset: 0;
    }
  }

  @keyframes modalSpring {
    from {
      transform: scale(0.95);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  .animate-checkmark-draw {
    stroke-dasharray: 100;
    stroke-dashoffset: 100;
    animation: pathDraw 600ms var(--ease-out) forwards;
  }

  .animate-modal-spring {
    animation: modalSpring 250ms var(--ease-out) forwards;
  }
  ```

- [ ] **Step 2: Run verification**
  Run: `npm run lint`
  Expected: PASS with no CSS build errors.

- [ ] **Step 3: Commit**
  ```bash
  git add src/app/globals.css
  git commit -m "style: refine theme tokens and add animations in globals.css"
  ```

---

### Task 2: Redesign Admin Dashboard UI

**Files:**
- Modify: `src/app/admin/AdminDashboardClient.tsx`

**Interfaces:**
- Consumed: Dashboard statistics payload and revenue data.
- Produced: Redesigned dashboard admin layout, card metrics, and desaturated operational tables.

- [ ] **Step 4: Update AdminDashboardClient.tsx layout and ubin cards**
  Modify the `MetricTile` component to remove shadow and apply desaturated Limestone background in light mode:
  ```tsx
  function MetricTile({ label, value, detail, icon: Icon, tone = 'default' }: MetricTileProps) {
    const toneClass = {
      default: 'bg-[var(--bg-card)] text-[var(--text-primary)]',
      attention: 'bg-[#0c0a08] text-white dark:bg-[#e4f222] dark:text-[#0c0a08]',
      success: 'bg-[var(--bg-card)] text-[var(--text-primary)]',
    }[tone];
    
    const iconClass = tone === 'success'
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      : 'bg-[var(--bg-body)] text-[var(--text-secondary)]';

    return (
      <article className="stagger-item rounded-xl border border-[var(--border-subtle)] p-5 transition-transform duration-150 active:scale-[0.98] bg-[var(--bg-card)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.02em] text-[var(--text-muted)]">{label}</p>
            <p className="mt-3 text-3xl font-normal tracking-tight text-[var(--text-primary)]">{value}</p>
          </div>
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] ${iconClass}`}>
            <Icon size={18} />
          </span>
        </div>
        {detail ? <p className="mt-4 text-xs text-[var(--text-muted)]">{detail}</p> : null}
      </article>
    );
  }
  ```

  Modify the top pending verification panel in `AdminDashboardClient` to use a strong dark header with Lime Signal button action, and render the metric grids neatly.

- [ ] **Step 5: Run tests**
  Run: `npm run test`
  Expected: PASS.

- [ ] **Step 6: Commit**
  ```bash
  git add src/app/admin/AdminDashboardClient.tsx
  git commit -m "feat: redesign admin dashboard panel and ubin cards"
  ```

---

### Task 3: Redesign Admin Fields & Forms UI

**Files:**
- Modify: `src/app/admin/fields/AdminFieldsClient.tsx`
- Modify: `src/app/admin/fields/FieldForm.tsx`

**Interfaces:**
- Consumed: Field items list.
- Produced: Standardized field inventory table, edit/delete actions, and clean input layouts.

- [ ] **Step 7: Update AdminFieldsClient.tsx**
  Refine field status tags (active/inactive) using desaturated rounded badges.
  Standardize button sizes (4px border-radius, `active:scale-[0.97]`).
  Format price and address values in clear typography.

- [ ] **Step 8: Update FieldForm.tsx**
  Standardize inputs to use 4px border-radius, clean focus shadows, and cohesive cancel/submit rows.

- [ ] **Step 9: Run tests**
  Run: `npm run test`
  Expected: PASS.

- [ ] **Step 10: Commit**
  ```bash
  git add src/app/admin/fields/AdminFieldsClient.tsx src/app/admin/fields/FieldForm.tsx
  git commit -m "feat: polish fields layout and creation forms"
  ```

---

### Task 4: Redesign Admin Bookings UI

**Files:**
- Modify: `src/app/admin/bookings/AdminBookingsClient.tsx`
- Modify: `src/app/admin/bookings/BookingActionForm.tsx`

**Interfaces:**
- Consumed: Booking verification list.
- Produced: Operations-oriented bookings verifier, customer cell hierarchy, and proof unavailable state badges.

- [ ] **Step 11: Modify AdminBookingsClient.tsx**
  Refine the customer column to stack names in medium font weight and secondary details in smaller text format. Style the payment proof links and proof unavailable warn states cleanly.
  Modify actions buttons (Approve DP, Confirm Paid, Cancel Booking) to use 4px rounded shapes, proper scale feedback, and desaturated colors.

- [ ] **Step 12: Modify BookingActionForm.tsx**
  Apply 4px radius and active scaling triggers to buttons.

- [ ] **Step 13: Run verification tests**
  Run: `npm run test`
  Expected: PASS.

- [ ] **Step 14: Commit**
  ```bash
  git add src/app/admin/bookings/AdminBookingsClient.tsx src/app/admin/bookings/BookingActionForm.tsx
  git commit -m "feat: redesign admin bookings verification board"
  ```

---

### Task 5: Customer Payment Confirmation Modal

**Files:**
- Create: `src/components/PaymentSuccessModal.tsx`
- Modify: `src/app/customer/booking/create/BookingCreateForm.tsx`
- Modify: `src/app/customer/booking/[id]/pelunasan/PelunasanForm.tsx`

**Interfaces:**
- Consumed: Booking ID, success message, close/navigate handler.
- Produced: Interactive spring success overlay with checkmark path drawing.

- [ ] **Step 15: Create PaymentSuccessModal.tsx**
  Implement the reusable overlay containing backdrop blur, checkmark draw animations, summary layout, and history navigation path. Keep the translation strings compatible with testing elements.

- [ ] **Step 16: Integrate in BookingCreateForm.tsx**
  Replace the inline `success-panel-enter` card with the new `<PaymentSuccessModal>` component when `showSuccessPanel` is true.

- [ ] **Step 17: Integrate in PelunasanForm.tsx**
  Replace the inline success panel card with the `<PaymentSuccessModal>` component when `showSuccessPanel` is true.

- [ ] **Step 18: Run test verification**
  Run: `npm run test`
  Expected: PASS.

- [ ] **Step 19: Commit**
  ```bash
  git add src/components/PaymentSuccessModal.tsx src/app/customer/booking/create/BookingCreateForm.tsx src/app/customer/booking/[id]/pelunasan/PelunasanForm.tsx
  git commit -m "feat: add payment success modal and replace inline panels"
  ```

---

### Task 6: Landing Page Motion Polish

**Files:**
- Modify: `src/app/(public)/about/page.tsx`

**Interfaces:**
- Consumed: Landing page contents.
- Produced: IntersectionObserver scroll-revealer and cascading stagger offsets.

- [ ] **Step 20: Add viewport observer to about page**
  Add a client-side layout hook that hooks onto elements with `about-motion-reveal` or similar stagger groups, applying `.is-visible` on viewport intersection.

- [ ] **Step 21: Choreograph Hero entry and card cascades**
  Style cards and hero text blocks with staggered transition delays. Support prefers-reduced-motion media settings.

- [ ] **Step 22: Run lint and build checks**
  Run: `npm run lint`
  Run: `npm run build`
  Expected: PASS.

- [ ] **Step 23: Commit**
  ```bash
  git add src/app/(public)/about/page.tsx
  git commit -m "feat: polish landing page scroll reveal and entry choreographies"
  ```
