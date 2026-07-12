# Stadium Booking Improvements Design Spec

Enforce operating hours, enhance admin transfer proof previewing, and synchronize slot availability status on the public landing page.

---

## 1. Operating Hours Slot Validation

### Problem
Users can select and attempt to book slots that are closed/unavailable according to our operating hours:
* **Friday**: 06:00 to 14:00 (closed)
* **Monday to Thursday**: 06:00 to 08:00 (closed)

Currently, the slot pricing config in [pricing.ts](file:///Users/royanrosyad/Nayor/filq-proj/src/config/pricing.ts) specifies `null` for these slot prices, but the pricing logic falls back to `weekendPrice`, rendering them bookable.

### Proposed Changes
1. **[pricing.ts](file:///Users/royanrosyad/Nayor/filq-proj/src/config/pricing.ts)**:
   Update `calculateBookingPrice` to loop through each individual 2-hour slot spanned by `startHour` and `endHour`. If any slot in the range has a `null` price for the given day of the week, return `{ total: 0, dp: 0 }`.
2. **[bookings-utils.ts](file:///Users/royanrosyad/Nayor/filq-proj/src/actions/bookings-utils.ts)**:
   In `parseCreateBookingForm`, validate that the calculated `total` is greater than 0. If not, fail with the message `'Slot yang dipilih belum tersedia untuk booking online.'`.
3. **[BookingCreateForm.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/app/customer/booking/create/BookingCreateForm.tsx)**:
   * **`startOptions`**: Filter out slots where the price is `null` for the selected date.
   * **`endOptions`**: Filter out end hours that cross any unavailable slot in between.
   * **Auto-Correction**: On changing the selected date, if the currently selected slot becomes unavailable (e.g. switching to Friday when 08:00-10:00 was selected), automatically reset the start and end hours to the first available slot of that day.

---

## 2. Admin Bookings "Bukti Transfer" Column & Detailed Preview

### Problem
Admins have to open the payment receipt image in a new browser tab to verify it. There is also no quick overview of receipts directly from the bookings table rows.

### Proposed Changes
1. **[AdminBookingsClient.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/app/admin/bookings/AdminBookingsClient.tsx)**:
   * Define a state variable `const [previewImage, setPreviewImage] = useState<string | null>(null);`.
   * Add a new column `"Bukti Transfer"` to the `columns` array, positioned between **Pembayaran** (Payment) and **Status**.
   * In the column render block:
     * If a `receiptUrl` is present, display a small image thumbnail button (`w-16 h-10 object-cover border rounded`). Clicking it will call `setPreviewImage(row.receiptUrl)` to open the modal (and call `e.stopPropagation()` to prevent expanding the table row).
     * If `receiptUnavailable` is true, display a text badge `"Tidak Tersedia"` in amber.
     * Otherwise, display a dash `—` in muted text.
   * Update the expanded drawer `renderDetails(row)`:
     * Replace `window.open(row.receiptUrl, '_blank')` and the external link with `setPreviewImage(row.receiptUrl)` to trigger the modal preview inside the application.
   * Add a floating modal overlay at the bottom:
     * Renders a full-screen backdrop with `fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm`.
     * Close modal on backdrop click or close button `✕` click.
     * Attach a React `useEffect` to listen to the `Escape` key and close the modal when pressed.

---

## 3. Landing Page Field Availability Synchronization

### Problem
The landing page availability grid in [page.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/app/(public)/page.tsx) uses the client-side Supabase client to query the `bookings` table directly. However, standard Supabase Row Level Security (RLS) policies prevent anonymous public users from reading bookings, resulting in an empty list and showing all slots as available (green).

### Proposed Changes
1. **Database Migration**:
   Create a new secure database RPC `public.get_booked_slots(p_start_date date, p_end_date date)` defined as `SECURITY DEFINER` and scoped to `SET search_path = ''`.
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
2. **[page.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/app/(public)/page.tsx)**:
   * Update client-side fetch inside `fetchBookings()` to call `supabase.rpc('get_booked_slots', { p_start_date: startDate, p_end_date: endDate })`.
   * Add check to determine if a slot is closed:
     ```typescript
     const isSlotClosed = (date: Date, slot: typeof BOOKING_PRICE_SLOTS[number]) => {
       const day = date.getDay();
       if (day >= 1 && day <= 4) return slot.weekdayPrice === null;
       if (day === 5) return slot.fridayPrice === null;
       return false;
     };
     ```
   * If `isSlotClosed(date, slot)` is true, render a neutral gray-colored card (similar to booked slots), with a minus icon and the text **"Tutup"** (Indonesian) or **"Closed"** (English).
3. **Translations**:
   * Add `'about.schedule.closed': 'Tutup'` to [id.ts](file:///Users/royanrosyad/Nayor/filq-proj/src/lib/i18n/translations/id.ts).
   * Add `'about.schedule.closed': 'Closed'` to [en.ts](file:///Users/royanrosyad/Nayor/filq-proj/src/lib/i18n/translations/en.ts).

---

## 4. Verification Plan

### Automated Tests
Run validation scripts locally:
* `npm run lint` — ESLint flat config
* `npx tsc --noEmit` — Standalone TypeScript check
* `npm test` — Vitest tests for actions and pricing logic
* `npm run build` — Production Next.js build

### Manual Verification
* Access the landing page and confirm that Friday 06:00–14:00 and Mon–Thu 06:00–08:00 are marked as **Tutup** (Closed).
* Create a booking on an open slot, then check the landing page to verify that the slot is now marked as **Sudah Dipesan** (Booked) for all visitors.
* Check the admin booking panel, expand a booking, and click the receipt thumbnail/button to verify the in-app preview modal works properly.
