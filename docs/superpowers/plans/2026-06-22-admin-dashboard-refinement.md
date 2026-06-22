# Admin Dashboard Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the admin dashboard layout by resolving information redundancy, making the top navigation bar useful with dynamic breadcrumbs, standardizing action buttons, and making trend tables interactive with a client-side field filter.

**Architecture:** 
- Implement dynamic breadcrumbs using `usePathname` in `AdminLayoutClient.tsx`.
- Move the state/statistics computation to the client-side `AdminDashboardClient.tsx` to support real-time reactive filtering when a field filter is changed.
- Fetch field relations in payments in `src/app/admin/page.tsx` to enable field-specific filtering.
- Remove redundant headers and button elements.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, TailwindCSS, Lucide Icons.

## Global Constraints
- Every modified file must lint cleanly via `npm run lint`.
- The application must compile successfully via `npm run build`.

---

### Task 1: Top Navigation Bar Breadcrumbs

**Files:**
- Modify: `src/components/AdminLayoutClient.tsx`

**Interfaces:**
- Consumes: Next.js `usePathname` hook.
- Produces: Dynamic breadcrumb trails next to the sidebar toggle button.

- [ ] **Step 1: Update imports in AdminLayoutClient.tsx**
  Add `usePathname` to the existing imports from `'next/navigation'`.
  Target code:
  ```typescript
  import { useState, useEffect } from 'react';
  ```
  Replacement code:
  ```typescript
  import { useState, useEffect } from 'react';
  import { usePathname } from 'next/navigation';
  ```

- [ ] **Step 2: Add breadcrumb rendering helper**
  Add a helper function inside the `AdminLayoutClient` component to generate dynamic breadcrumbs from the current pathname.
  Target location: Right after the component declaration (before `toggleSidebar`).
  Code to add:
  ```typescript
  const pathname = usePathname();

  const renderBreadcrumbs = () => {
    if (!pathname) return null;
    const segments = pathname.split('/').filter(Boolean);
    
    return (
      <nav aria-label="Breadcrumb" className="hidden items-center gap-2 text-sm font-medium sm:flex">
        <span className="text-[var(--text-muted)] font-normal">Admin</span>
        {segments.slice(1).map((segment, index) => {
          const label = segment.charAt(0).toUpperCase() + segment.slice(1);
          const isLast = index === segments.length - 2;
          
          return (
            <div key={index} className="flex items-center gap-2">
              <span className="text-[var(--text-muted)] font-normal">/</span>
              <span className={isLast ? "text-[var(--text-primary)] font-semibold" : "text-[var(--text-muted)] font-normal"}>
                {label}
              </span>
            </div>
          );
        })}
        {segments.length === 1 && (
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-muted)] font-normal">/</span>
            <span className="text-[var(--text-primary)] font-semibold">Dashboard</span>
          </div>
        )}
      </nav>
    );
  };
  ```

- [ ] **Step 3: Render breadcrumbs in the header**
  Insert the `{renderBreadcrumbs()}` call in the header.
  Target code:
  ```tsx
            <button
              onClick={toggleSidebar}
              className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-action-hover)] hover:text-[var(--text-primary)] active:scale-[0.95]"
              aria-label="Toggle sidebar"
            >
              {isOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            </button>
            <p className="text-sm font-medium text-[var(--text-secondary)] lg:hidden">Admin</p>
          </div>
  ```
  Replacement code:
  ```tsx
            <button
              onClick={toggleSidebar}
              className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-action-hover)] hover:text-[var(--text-primary)] active:scale-[0.95]"
              aria-label="Toggle sidebar"
            >
              {isOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            </button>
            <p className="text-sm font-medium text-[var(--text-secondary)] lg:hidden">Admin</p>
            {renderBreadcrumbs()}
          </div>
  ```

- [ ] **Step 4: Verify linting & compilation**
  Run: `npm run lint`

- [ ] **Step 5: Commit changes**
  ```bash
  git add src/components/AdminLayoutClient.tsx
  git commit -m "feat: add dynamic breadcrumbs to admin header top-bar"
  ```

---

### Task 2: Update Server Data Fetching for Payments

**Files:**
- Modify: `src/app/admin/page.tsx`

**Interfaces:**
- Consumes: Supabase database client.
- Produces: Enhanced `PaymentRow` structures that carry booking/field details, passed to `AdminDashboardClient`.

- [ ] **Step 1: Update type definitions and fetch logic in page.tsx**
  Enhance `PaymentRow` type to include relationship data, fetch bookings/fields within payments query, and pass raw data arrays directly down.
  Target code:
  ```typescript
  type PaymentRow = {
    amount: number | string;
    status: string;
    created_at: string;
  };

  export default async function AdminDashboardPage() {
    const supabase = await createClient();

    const [{ data: fieldsData }, { data: bookingsData }, { data: paymentsData }] = await Promise.all([
      supabase.from('fields').select('id, name, price, status').order('name'),
      supabase.from('bookings').select('id, booking_date, status, price, fields(name)').order('booking_date', { ascending: false }).limit(200),
      supabase.from('payments').select('amount, status, created_at'),
    ]);

    const fields = (fieldsData ?? []) as { id: number; name: string; price: number | string; status: string }[];
    const bookings = (bookingsData ?? []) as BookingRow[];
    const payments = (paymentsData ?? []) as PaymentRow[];

    const activeFieldCount = fields.filter((f) => f.status === 'active').length;
    const totalBookingCount = bookings.length;
    const pendingCount = bookings.filter((b) => ['pending', 'payment_2_pending'].includes(b.status)).length;
    const dpPaidCount = bookings.filter((b) => b.status === 'dp_paid').length;
    const confirmedCount = bookings.filter((b) => ['confirmed', 'paid'].includes(b.status)).length;

    const approvedPayments = payments.filter((p) => p.status === 'approved');
    const dpRevenue = approvedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Today's revenue
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayRevenue = approvedPayments
      .filter((p) => p.created_at?.startsWith(todayStr))
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // Last 7 days
    const last7Days = buildDailyRevenue(approvedPayments, 7);

    // Last 6 months
    const last6Months = buildMonthlyRevenue(approvedPayments, 6);

    // This month
    const monthStr = todayStr.slice(0, 7);
    const thisMonthRevenue = approvedPayments
      .filter((p) => p.created_at?.startsWith(monthStr))
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return (
      <AdminDashboardClient
        stats={{
          activeFieldCount,
          totalFieldCount: fields.length,
          totalBookingCount,
          pendingCount,
          dpPaidCount,
          confirmedCount,
          dpRevenue,
          todayRevenue,
          thisMonthRevenue,
        }}
        last7Days={last7Days}
        last6Months={last6Months}
      />
    );
  }
  ```
  Replacement code:
  ```typescript
  type PaymentRow = {
    amount: number | string;
    status: string;
    created_at: string;
    bookings: {
      field_id: number;
      fields: {
        name: string;
      } | { name: string }[] | null;
    } | {
      field_id: number;
      fields: {
        name: string;
      } | { name: string }[] | null;
    }[] | null;
  };

  export default async function AdminDashboardPage() {
    const supabase = await createClient();

    const [{ data: fieldsData }, { data: bookingsData }, { data: paymentsData }] = await Promise.all([
      supabase.from('fields').select('id, name, price, status').order('name'),
      supabase.from('bookings').select('id, booking_date, status, price, fields(name)').order('booking_date', { ascending: false }).limit(200),
      supabase.from('payments').select('amount, status, created_at, bookings(field_id, fields(name))'),
    ]);

    const fields = (fieldsData ?? []) as { id: number; name: string; price: number | string; status: string }[];
    const bookings = (bookingsData ?? []) as BookingRow[];
    const payments = (paymentsData ?? []) as PaymentRow[];

    return (
      <AdminDashboardClient
        fields={fields}
        bookings={bookings}
        payments={payments}
      />
    );
  }
  ```

- [ ] **Step 2: Remove redundant build helpers**
  Since daily and monthly revenue calculations are now moving to the client component for reactivity, delete the `buildDailyRevenue` and `buildMonthlyRevenue` helper functions from `src/app/admin/page.tsx` entirely.

- [ ] **Step 3: Commit changes**
  ```bash
  git add src/app/admin/page.tsx
  git commit -m "refactor: push admin stats computation client-side and fetch payments with field relations"
  ```

---

### Task 3: Reactive Client Dashboard with Field Filter

**Files:**
- Modify: `src/app/admin/AdminDashboardClient.tsx`

**Interfaces:**
- Consumes: Enhanced props: `fields`, `bookings`, and `payments`.
- Produces: Reactive stats, interactive dropdown filter, and standardized clean layout.

- [ ] **Step 1: Redefine Props in AdminDashboardClient.tsx**
  Update the types of input properties on the client.
  Target code:
  ```typescript
  type Props = {
    stats: {
      activeFieldCount: number;
      totalFieldCount: number;
      totalBookingCount: number;
      pendingCount: number;
      dpPaidCount: number;
      confirmedCount: number;
      dpRevenue: number;
      todayRevenue: number;
      thisMonthRevenue: number;
    };
    last7Days: { date: string; revenue: number }[];
    last6Months: { month: string; revenue: number }[];
  };
  ```
  Replacement code:
  ```typescript
  type BookingRow = {
    id: number;
    booking_date: string;
    status: string;
    price: number | string;
    fields: { name: string } | { name: string }[] | null;
  };

  type PaymentRow = {
    amount: number | string;
    status: string;
    created_at: string;
    bookings: {
      field_id: number;
      fields: {
        name: string;
      } | { name: string }[] | null;
    } | {
      field_id: number;
      fields: {
        name: string;
      } | { name: string }[] | null;
    }[] | null;
  };

  type FieldRow = {
    id: number;
    name: string;
    price: number | string;
    status: string;
  };

  type Props = {
    fields: FieldRow[];
    bookings: BookingRow[];
    payments: PaymentRow[];
  };
  ```

- [ ] **Step 2: Add client-side calculations and filter state**
  Add state for `selectedFieldId` (either a field ID string/number or `"all"`). Compute all stats dynamically inside `AdminDashboardClient` based on this filter state.
  Code implementation outline to insert inside `AdminDashboardClient`:
  ```typescript
  const [selectedFieldId, setSelectedFieldId] = useState<string>('all');

  // Filter payments and bookings based on selectedFieldId
  const filteredBookings = bookings.filter((b) => {
    if (selectedFieldId === 'all') return true;
    // Extract field relation to check ID
    // Bookings doesn't have field_id fetched in page.tsx currently, but wait!
    // In page.tsx: bookingsData query is: select('id, booking_date, status, price, fields(name)')
    // Wait! Let's check: does bookings select fields(id, name)? No, just fields(name).
    // Let's modify page.tsx bookings query to: select('id, field_id, booking_date, status, price, fields(name)')
    // so we can filter bookings by field_id easily!
  });
  ```
  Let's refine the plan: We will add `field_id` to bookings select in page.tsx as well! Let's update Task 2 Step 1 to fetch `field_id` in bookings:
  `supabase.from('bookings').select('id, field_id, booking_date, status, price, fields(name)')`.

  Let's update `AdminDashboardClient` body with filtering calculations:
  ```typescript
  const [selectedFieldId, setSelectedFieldId] = useState<string>('all');

  const filteredBookings = bookings.filter((b) => {
    if (selectedFieldId === 'all') return true;
    return String(b.field_id) === selectedFieldId;
  });

  const getFieldIdFromPayment = (p: PaymentRow): number | null => {
    const booking = Array.isArray(p.bookings) ? p.bookings[0] : p.bookings;
    return booking?.field_id ?? null;
  };

  const filteredPayments = payments.filter((p) => {
    if (selectedFieldId === 'all') return true;
    return String(getFieldIdFromPayment(p)) === selectedFieldId;
  });

  // Calculate dynamic stats
  const activeFieldCount = fields.filter((f) => f.status === 'active').length;
  const totalBookingCount = filteredBookings.length;
  const pendingCount = filteredBookings.filter((b) => ['pending', 'payment_2_pending'].includes(b.status)).length;
  const dpPaidCount = filteredBookings.filter((b) => b.status === 'dp_paid').length;
  const confirmedCount = filteredBookings.filter((b) => ['confirmed', 'paid'].includes(b.status)).length;

  const approvedPayments = filteredPayments.filter((p) => p.status === 'approved');
  const dpRevenue = approvedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRevenue = approvedPayments
    .filter((p) => p.created_at?.startsWith(todayStr))
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const thisMonthStr = todayStr.slice(0, 7);
  const thisMonthRevenue = approvedPayments
    .filter((p) => p.created_at?.startsWith(thisMonthStr))
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // Dynamic calculations for last 7 days and last 6 months trend
  const last7Days = buildDailyRevenue(approvedPayments, 7);
  const last6Months = buildMonthlyRevenue(approvedPayments, 6);
  ```

- [ ] **Step 3: Add helper calculation functions inside AdminDashboardClient.tsx**
  Include the `buildDailyRevenue` and `buildMonthlyRevenue` calculations inside `AdminDashboardClient.tsx`.
  ```typescript
  function buildDailyRevenue(payments: PaymentRow[], limit: number) {
    const dailyMap: Record<string, number> = {};
    payments.forEach((p) => {
      if (!p.created_at) return;
      const datePart = typeof p.created_at === 'string' ? p.created_at.slice(0, 10) : new Date(p.created_at).toISOString().slice(0, 10);
      const [y, m, d] = datePart.split('-');
      const label = `${d}/${m}/${y}`;
      dailyMap[label] = (dailyMap[label] ?? 0) + Number(p.amount);
    });
    return Object.entries(dailyMap)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => {
        const [da, ma, ya] = a.date.split('/').map(Number);
        const [db, mb, yb] = b.date.split('/').map(Number);
        return new Date(yb, mb - 1, db).getTime() - new Date(ya, ma - 1, da).getTime();
      })
      .slice(0, limit);
  }

  function buildMonthlyRevenue(payments: PaymentRow[], limit: number) {
    const monthlyMap: Record<string, { label: string; revenue: number }> = {};
    payments.forEach((p) => {
      if (!p.created_at) return;
      const datePart = typeof p.created_at === 'string' ? p.created_at.slice(0, 10) : new Date(p.created_at).toISOString().slice(0, 10);
      const [y, m] = datePart.split('-').map(Number);
      const dateObj = new Date(y, m - 1, 1);
      const key = `${y}-${String(m).padStart(2, '0')}`;
      const label = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!monthlyMap[key]) {
        monthlyMap[key] = { label, revenue: 0 };
      }
      monthlyMap[key].revenue += Number(p.amount);
    });
    return Object.keys(monthlyMap)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => ({
        month: monthlyMap[key].label,
        revenue: monthlyMap[key].revenue,
      }))
      .slice(0, limit);
  }
  ```

- [ ] **Step 4: Remove redundant stats from the "Pending Verification" card**
  Delete lines 166-179 containing the bottom sub-stat row (`DP PAID`, `CONFIRMED / PAID`, `TOTAL BOOKING` row) from the "Pending Verification" card.

- [ ] **Step 5: Remove the redundant "Verify Payments" header action**
  Remove the black "Verify Payments" button from the top right header (lines 135-137). Keep only the "Fields" button in the header.

- [ ] **Step 6: Render the Field dropdown filter**
  Add a `<select>` dropdown next to the "Fields" button in the header so admins can filter the entire page's metrics by a specific field.
  Code:
  ```tsx
  <select
    value={selectedFieldId}
    onChange={(e) => setSelectedFieldId(e.target.value)}
    className="rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-lime)]"
  >
    <option value="all">All Fields</option>
    {fields.map((field) => (
      <option key={field.id} value={String(field.id)}>
        {field.name}
      </option>
    ))}
  </select>
  ```

- [ ] **Step 7: Commit changes**
  ```bash
  git add src/app/admin/AdminDashboardClient.tsx
  git commit -m "feat: make admin dashboard fully reactive with client-side field filter and clean redundant layouts"
  ```

---

### Task 4: Verify Quality and Build

- [ ] **Step 1: Run linter**
  Run: `npm run lint`
  Expected: Clean compilation with zero lint errors.

- [ ] **Step 2: Run build**
  Run: `npm run build`
  Expected: Successful production build.

- [ ] **Step 3: Manual check in browser**
  Use `browser_subagent` to view `http://localhost:3000/admin`, verify breadcrumbs, check the dropdown filter works, and inspect the cleaner card layouts.
