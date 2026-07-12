# Stadium Booking Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce operating hours (Friday and weekday mornings) via configuration-driven pricing, implement an in-app receipt preview and dedicated column on the admin bookings table, and synchronize public landing page field availability using a secure Supabase RPC function.

**Architecture:**
1. **Pricing & Validation Layer**: Modify pricing functions to return zero total price when crossing unavailable slots. Extend schema/server validation.
2. **Database Layer**: Add a `SECURITY DEFINER` RPC `public.get_booked_slots` to safely expose booked date/time slots without compromising user data.
3. **UI Layer**: Filter client booking slots, display "Tutup" (Closed) slots on the landing page, and integrate a custom receipt modal on the admin bookings dashboard.

**Tech Stack:** Next.js 16 (App Router), React 19, Supabase JS, Tailwind CSS v4, Vitest.

## Global Constraints
* Do not bypass RLS policies or PostgreSQL RPC boundaries.
* Keep UI components responsive and match the premium design system (`PAPER` `#ffffff`, `LIMESTONE` `#f4f2f0`, `OBSIDIAN` `#0c0a08`, `SLATE` `#4d505d`, `BONE` `#d2cecb`).
* Run validation commands (`npm run lint`, `npx tsc --noEmit`, `npm test`) at the end of each task.

---

### Task 1: Enforce Operating Hours in Pricing Logic

**Files:**
* Modify: [pricing.ts](file:///Users/royanrosyad/Nayor/filq-proj/src/config/pricing.ts)
* Modify: [pricing.test.ts](file:///Users/royanrosyad/Nayor/filq-proj/src/config/pricing.test.ts)

**Interfaces:**
* Consumes: `BOOKING_PRICE_SLOTS` array configuration.
* Produces: `calculateBookingPrice(date: Date, startHour: number, endHour: number)` returning `{ total: number; dp: number }`.

- [ ] **Step 1: Write test cases in pricing.test.ts**
  Modify [pricing.test.ts](file:///Users/royanrosyad/Nayor/filq-proj/src/config/pricing.test.ts) to verify that unavailable slot ranges return zero price:
  ```typescript
  import { calculateBookingPrice } from './pricing';

  describe('calculateBookingPrice operating hours', () => {
    it('returns zero for Friday morning closed hours (6-14)', () => {
      const friday = new Date('2026-07-17'); // Friday
      expect(calculateBookingPrice(friday, 6, 8)).toEqual({ total: 0, dp: 0 });
      expect(calculateBookingPrice(friday, 8, 10)).toEqual({ total: 0, dp: 0 });
      expect(calculateBookingPrice(friday, 10, 12)).toEqual({ total: 0, dp: 0 });
      expect(calculateBookingPrice(friday, 12, 14)).toEqual({ total: 0, dp: 0 });
      expect(calculateBookingPrice(friday, 6, 14)).toEqual({ total: 0, dp: 0 });
    });

    it('returns valid price for Friday afternoon hours (14-22)', () => {
      const friday = new Date('2026-07-17'); // Friday
      const result = calculateBookingPrice(friday, 14, 16);
      expect(result.total).toBeGreaterThan(0);
      expect(result.dp).toBe(Math.max(result.total * 0.3, 500000));
    });

    it('returns zero for Mon-Thu morning closed hours (6-8)', () => {
      const monday = new Date('2026-07-13'); // Monday
      expect(calculateBookingPrice(monday, 6, 8)).toEqual({ total: 0, dp: 0 });
    });

    it('returns valid price for Mon-Thu open hours (8-22)', () => {
      const monday = new Date('2026-07-13'); // Monday
      const result = calculateBookingPrice(monday, 8, 10);
      expect(result.total).toBeGreaterThan(0);
    });
  });
  ```

- [ ] **Step 2: Run tests to verify failure**
  Run: `npx vitest run src/config/pricing.test.ts`
  Expected: Failures because closed slots fall back to weekend prices.

- [ ] **Step 3: Modify pricing.ts**
  Replace `calculateBookingPrice` inside [pricing.ts](file:///Users/royanrosyad/Nayor/filq-proj/src/config/pricing.ts):
  ```typescript
  export function calculateBookingPrice(
    date: Date,
    startHour: number,
    endHour: number,
  ): { total: number; dp: number } {
    const day = date.getDay();
    let total = 0;

    for (const slot of BOOKING_PRICE_SLOTS) {
      if (slot.startHour >= startHour && slot.endHour <= endHour) {
        let price: number | null = slot.weekendPrice;

        if (day >= 1 && day <= 4) {
          price = slot.weekdayPrice;
        } else if (day === 5) {
          price = slot.fridayPrice;
        }

        if (price === null) {
          return { total: 0, dp: 0 };
        }

        total += price;
      }
    }

    return { total, dp: Math.max(total * 0.3, 500000) };
  }
  ```

- [ ] **Step 4: Run tests to verify pass**
  Run: `npx vitest run src/config/pricing.test.ts`
  Expected: PASS

- [ ] **Step 5: Verify build & lint**
  Run: `npm run lint && npx tsc --noEmit`
  Expected: Clean compilation.

- [ ] **Step 6: Commit**
  Run: `git add src/config/pricing.ts src/config/pricing.test.ts && git commit -m "feat: enforce operating hours in pricing calculations"`

---

### Task 2: Validate Operating Hours in Server Booking Action

**Files:**
* Modify: [bookings.test.ts](file:///Users/royanrosyad/Nayor/filq-proj/src/actions/bookings.test.ts)

**Interfaces:**
* Consumes: `createBookingAction` from `@/actions/bookings`.
* Produces: Secure validation rejection for closed slots.

- [ ] **Step 1: Add a unit test for closed slot server-side booking rejection**
  Add a test inside [bookings.test.ts](file:///Users/royanrosyad/Nayor/filq-proj/src/actions/bookings.test.ts):
  ```typescript
  it('should reject booking requests for closed slots', async () => {
    const formData = new FormData();
    formData.append('fieldId', '1');
    formData.append('bookingDate', '2026-07-17'); // Friday
    formData.append('startHour', '6'); // Closed
    formData.append('endHour', '8');
    formData.append('paymentOption', 'dp');
    formData.append('paymentProof', new File(['receipt'], 'receipt.png', { type: 'image/png' }));

    const result = await createBookingAction({ ok: false }, formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Slot yang dipilih belum tersedia');
  });
  ```

- [ ] **Step 2: Run tests to verify pass**
  Run: `npx vitest run src/actions/bookings.test.ts`
  Expected: PASS (as `total <= 0` check in `parseCreateBookingForm` already catches this via the updated pricing function).

- [ ] **Step 3: Verify overall tests and lint**
  Run: `npm run lint && npx tsc --noEmit && npm test`
  Expected: All checks PASS.

- [ ] **Step 4: Commit**
  Run: `git add src/actions/bookings.test.ts && git commit -m "test: add server validation test for closed booking slots"`

---

### Task 3: Filter & Auto-Correct Slots in Booking Creation Form

**Files:**
* Modify: [BookingCreateForm.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/app/customer/booking/create/BookingCreateForm.tsx)

**Interfaces:**
* Consumes: `BOOKING_PRICE_SLOTS` from `@/config/pricing`.
* Produces: Interactive customer dropdown selectors.

- [ ] **Step 1: Implement filtered startOptions and endOptions**
  Replace lines 79-82 in [BookingCreateForm.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/app/customer/booking/create/BookingCreateForm.tsx):
  ```typescript
    const startOptions = BOOKING_PRICE_SLOTS.filter((slot) => {
      if (!selectedDate) return true;
      const day = selectedDate.getDay();
      if (day >= 1 && day <= 4) return slot.weekdayPrice !== null;
      if (day === 5) return slot.fridayPrice !== null;
      return true;
    }).map((slot) => slot.startHour);

    const endOptions = Array.from(new Set(BOOKING_PRICE_SLOTS.map((slot) => slot.endHour)))
      .filter((hour) => hour > startHour)
      .filter((hour) => {
        if (!selectedDate) return true;
        const day = selectedDate.getDay();
        const intermediateSlots = BOOKING_PRICE_SLOTS.filter(
          (slot) => slot.startHour >= startHour && slot.endHour <= hour
        );
        return intermediateSlots.every((slot) => {
          if (day >= 1 && day <= 4) return slot.weekdayPrice !== null;
          if (day === 5) return slot.fridayPrice !== null;
          return true;
        });
      });
  ```

- [ ] **Step 2: Add auto-correction on date change**
  Modify Flatpickr `onChange` block in [BookingCreateForm.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/app/customer/booking/create/BookingCreateForm.tsx):
  ```typescript
                onChange={([date]) => {
                  setSelectedDate(date ?? null);
                  if (date) {
                    const day = date.getDay();
                    const availableSlots = BOOKING_PRICE_SLOTS.filter((slot) => {
                      if (day >= 1 && day <= 4) return slot.weekdayPrice !== null;
                      if (day === 5) return slot.fridayPrice !== null;
                      return true;
                    });
                    
                    const isStartAvailable = availableSlots.some((slot) => slot.startHour === startHour);
                    if (!isStartAvailable && availableSlots.length > 0) {
                      const firstAvailable = availableSlots[0];
                      setStartHour(firstAvailable.startHour);
                      setEndHour(firstAvailable.endHour);
                    } else {
                      const isRangeAvailable = BOOKING_PRICE_SLOTS.filter(
                        (slot) => slot.startHour >= startHour && slot.endHour <= endHour
                      ).every((slot) => {
                        if (day >= 1 && day <= 4) return slot.weekdayPrice !== null;
                        if (day === 5) return slot.fridayPrice !== null;
                        return true;
                      });
                      if (!isRangeAvailable && availableSlots.length > 0) {
                        const currentSlot = availableSlots.find((slot) => slot.startHour === startHour);
                        if (currentSlot) {
                          setEndHour(currentSlot.endHour);
                        }
                      }
                    }
                  }
                }}
  ```

- [ ] **Step 3: Verify build and lint**
  Run: `npm run lint && npx tsc --noEmit`
  Expected: Clean compilation.

- [ ] **Step 4: Commit**
  Run: `git add src/app/customer/booking/create/BookingCreateForm.tsx && git commit -m "feat: filter and auto-correct closed slots in customer booking form"`

---

### Task 4: Expose Booked Slots through Secure Database RPC

**Files:**
* None (Database Schema updates)

**Interfaces:**
* Produces: `public.get_booked_slots(date, date)` returning `TABLE (booking_date date, start_time time, end_time time)`.

- [ ] **Step 1: Execute Migration on Supabase**
  Using the **Supabase MCP** tool `execute_sql`, create the secure RPC and assign access privileges:
  ```sql
  CREATE OR REPLACE FUNCTION public.get_booked_slots(p_start_date date, p_end_date date)
  RETURNS TABLE (booking_date date, start_time time, end_time time)
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
  AS $$
  BEGIN
    RETURN QUERY
    SELECT b.booking_date, b.start_time, b.end_time
    FROM public.bookings AS b
    WHERE b.status <> 'cancelled'
      AND b.booking_date >= p_start_date
      AND b.booking_date <= p_end_date;
  END;
  $$;

  GRANT EXECUTE ON FUNCTION public.get_booked_slots(date, date) TO anon, authenticated;
  ```

- [ ] **Step 2: Verify the RPC function is available**
  Run a query through `execute_sql` to test the RPC function:
  ```sql
  SELECT * FROM public.get_booked_slots(current_date, current_date + 5);
  ```
  Expected: Success returning table columns `booking_date`, `start_time`, `end_time` (or empty if no bookings exist).

---

### Task 5: Sync Public Availability Grid & Display Closed Slots

**Files:**
* Modify: [page.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/app/(public)/page.tsx)
* Modify: [id.ts](file:///Users/royanrosyad/Nayor/filq-proj/src/lib/i18n/translations/id.ts)
* Modify: [en.ts](file:///Users/royanrosyad/Nayor/filq-proj/src/lib/i18n/translations/en.ts)

**Interfaces:**
* Consumes: `public.get_booked_slots` Supabase RPC.
* Produces: Synchronized field availability schedule.

- [ ] **Step 1: Add translation keys**
  Add `'about.schedule.closed': 'Tutup'` to [id.ts](file:///Users/royanrosyad/Nayor/filq-proj/src/lib/i18n/translations/id.ts):
  ```typescript
  // Around line 293
  'about.schedule.booked': 'Sudah Dipesan',
  'about.schedule.closed': 'Tutup',
  ```
  Add `'about.schedule.closed': 'Closed'` to [en.ts](file:///Users/royanrosyad/Nayor/filq-proj/src/lib/i18n/translations/en.ts):
  ```typescript
  // Around line 293
  'about.schedule.booked': 'Booked',
  'about.schedule.closed': 'Closed',
  ```

- [ ] **Step 2: Modify landing page fetchBookings to call RPC**
  In [page.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/app/(public)/page.tsx), replace the `fetchBookings()` supabase call:
  ```typescript
        const { data, error } = await supabase
          .rpc('get_booked_slots', {
            p_start_date: startDate,
            p_end_date: endDate,
          });
  ```

- [ ] **Step 3: Add availability check and closed slot styling**
  Inside [page.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/app/(public)/page.tsx), add a helper function above the return block:
  ```typescript
  const isSlotClosed = (date: Date, slot: typeof BOOKING_PRICE_SLOTS[number]) => {
    const day = date.getDay();
    if (day >= 1 && day <= 4) return slot.weekdayPrice === null;
    if (day === 5) return slot.fridayPrice === null;
    return false;
  };
  ```
  Inside the `dates.map` schedule grid block (around line 590), render closed slots as a gray card:
  ```tsx
                        {BOOKING_PRICE_SLOTS.map((slot) => {
                          const isBooked = isSlotBooked(dateStr, slot.startHour, slot.endHour);
                          const isClosed = isSlotClosed(date, slot);
                          const { total: slotPrice } = calculateBookingPrice(date, slot.startHour, slot.endHour);

                          if (isClosed) {
                            return (
                              <div
                                key={`${slot.startHour}-${slot.endHour}`}
                                className="flex flex-col items-start gap-1 rounded-[8px] border border-[#d2cecb]/40 p-3 select-none"
                                style={{ backgroundColor: '#e2e0de', color: '#999ba3' }}
                              >
                                <div className="flex w-full items-center justify-between">
                                  <span className="text-[13px] font-medium">
                                    {fmtHour(slot.startHour)} – {fmtHour(slot.endHour)}
                                  </span>
                                  <Minus size={14} className="text-[#999ba3]" />
                                </div>
                                <span className="text-[12px] font-medium uppercase tracking-wide opacity-80">
                                  {t('about.schedule.closed')}
                                </span>
                              </div>
                            );
                          }

                          if (isBooked) {
                            return (
                              <div
                                key={`${slot.startHour}-${slot.endHour}`}
                                className="flex flex-col items-start gap-1 rounded-[8px] border border-[#d2cecb]/40 p-3 select-none"
                                style={{ backgroundColor: '#e2e0de', color: '#999ba3' }}
                              >
                                <div className="flex w-full items-center justify-between">
                                  <span className="text-[13px] font-medium">
                                    {fmtHour(slot.startHour)} – {fmtHour(slot.endHour)}
                                  </span>
                                  <Minus size={14} className="text-[#999ba3]" />
                                </div>
                                <span className="text-[12px] font-medium uppercase tracking-wide opacity-80">
                                  {t('about.schedule.booked')}
                                </span>
                              </div>
                            );
                          }
  ```

- [ ] **Step 4: Verify build and lint**
  Run: `npm run lint && npx tsc --noEmit`
  Expected: Clean compilation.

- [ ] **Step 5: Commit**
  Run: `git add src/app/\(public\)/page.tsx src/lib/i18n/translations/id.ts src/lib/i18n/translations/en.ts && git commit -m "feat: sync public availability and render closed slots on landing page"`

---

### Task 6: Add receipt column and preview modal to Admin Booking dashboard

**Files:**
* Modify: [AdminBookingsClient.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/app/admin/bookings/AdminBookingsClient.tsx)

**Interfaces:**
* Consumes: `receiptUrl` and `receiptUnavailable` fields from rows.
* Produces: Custom modal backdrop element and key listener.

- [ ] **Step 1: Modify imports and add previewImage state**
  Add `useEffect` to react imports at the top of [AdminBookingsClient.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/app/admin/bookings/AdminBookingsClient.tsx):
  ```typescript
  import { useState, useEffect } from 'react';
  ```
  Add the state inside `AdminBookingsClient`:
  ```typescript
    const [previewImage, setPreviewImage] = useState<string | null>(null);
  ```

- [ ] **Step 2: Add receipt column to columns list**
  Add the new column object in the `columns` array between **Pembayaran** (line 220) and **Status**:
  ```typescript
      {
        key: 'receipt',
        label: 'Bukti Transfer',
        sortable: false,
        render: (row: BookingItem) => {
          if (row.receiptUrl) {
            return (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewImage(row.receiptUrl);
                }}
                className="relative h-10 w-16 overflow-hidden rounded border border-[var(--border-subtle)] bg-[var(--bg-body)] hover:opacity-80 transition cursor-pointer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={row.receiptUrl}
                  alt="Bukti Transfer"
                  className="h-full w-full object-cover"
                />
              </button>
            );
          }
          if (row.receiptUnavailable) {
            return (
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Tidak Tersedia
              </span>
            );
          }
          return <span className="text-xs text-[var(--text-muted)]">—</span>;
        }
      },
  ```

- [ ] **Step 3: Update receipt preview trigger in row expanded details**
  Locate `renderDetails` in [AdminBookingsClient.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/app/admin/bookings/AdminBookingsClient.tsx). Replace the existing "Bukti Transfer" block:
  ```tsx
          {/* Bukti Pembayaran */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Bukti Transfer
            </h4>
            <div className="mt-2">
              {row.receiptUrl ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setPreviewImage(row.receiptUrl)}
                    className="btn inline-flex items-center gap-1.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-action-hover)] cursor-pointer"
                  >
                    <ReceiptText size={12} />
                    Pratinjau Bukti
                  </button>
                  <div className="relative aspect-video max-h-24 md:max-h-28 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-body)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={row.receiptUrl}
                      alt="Bukti Transfer"
                      className="h-full w-full object-contain hover:scale-105 transition duration-200 cursor-zoom-in"
                      onClick={() => setPreviewImage(row.receiptUrl)}
                    />
                  </div>
                </div>
              ) : row.receiptUnavailable ? (
                <div className="inline-flex items-center gap-1.5 rounded-[4px] border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 font-semibold">
                  <ReceiptText size={12} />
                  Bukti Tidak Tersedia
                </div>
              ) : (
                <span className="text-xs text-[var(--text-muted)]">Belum Unggah Bukti</span>
              )}
            </div>
          </div>
  ```

- [ ] **Step 4: Implement Escape key listener and render modal portal**
  Add the Escape key event listener `useEffect` inside `AdminBookingsClient`:
  ```typescript
    useEffect(() => {
      if (!previewImage) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setPreviewImage(null);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [previewImage]);
  ```
  Add the modal markup at the end of the return block of `AdminBookingsClient`, just before the closing tag of the main container:
  ```tsx
        {previewImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg bg-slate-900 p-2 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage}
                alt="Bukti Transfer Preview"
                className="max-h-[80vh] max-w-[85vw] object-contain rounded"
              />
            </div>
          </div>
        )}
  ```

- [ ] **Step 5: Verify build & lint**
  Run: `npm run lint && npx tsc --noEmit && npm test && npm run build`
  Expected: Clean compilation and passes all tests.

- [ ] **Step 6: Commit**
  Run: `git add src/app/admin/bookings/AdminBookingsClient.tsx && git commit -m "feat: add receipt column and in-app preview modal to admin bookings page"`
