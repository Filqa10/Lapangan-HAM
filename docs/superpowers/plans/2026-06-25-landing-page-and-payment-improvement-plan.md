# Landing Page and Payment Flow Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the landing page hero and navbar to a light style, add an interactive 5-day booking availability schedule grid, lock booking creation to a single field (Stadion HAM), support full payment alongside 30% DP options for customer checkouts, add admin actions to mark bookings as paid offline, and integrate maps using `mapcn`.

**Architecture:** 
1. **Database layer**: Update the PostgreSQL migration file with modifications to `admin_approve_dp` and add a new `admin_complete_payment_offline` secure RPC.
2. **Action layer**: Add the payment option parsing in booking utils, and create a server action for offline payment completion.
3. **UI layer**: Clean up client forms to hide field selection, support DP/Full payment options, and build the 5-day dynamic schedule grid on the landing page alongside the `@mapcn/map` component.

**Tech Stack:** Next.js 16 (App Router), React 19, Supabase JS, MapLibre GL, Tailwind CSS v4.

## Global Constraints
- Do not bypass RLS policies or PostgreSQL RPC boundaries.
- Keep UI components responsive and match the premium design system (`PAPER` `#ffffff`, `LIMESTONE` `#f4f2f0`, `OBSIDIAN` `#0c0a08`, `SLATE` `#4d505d`).
- Run validation commands (`npm run lint`, `npx tsc --noEmit`, `npm test`) at the end of each task.

---

### Task 1: Initialize Shadcn UI and Install Mapcn Component

**Files:**
- Create: `components.json`
- Create: `src/components/ui/map.tsx`
- Modify: `package.json`

**Interfaces:**
- Produces: `Map` and `MapControls` components from `@/components/ui/map`

- [ ] **Step 1: Install maplibre-gl and initialize shadcn**

Run:
```bash
npm install maplibre-gl
npx shadcn@latest init -y
```

- [ ] **Step 2: Add mapcn component**

Run:
```bash
npx shadcn@latest add @mapcn/map
```
*Note: If the shadcn registry fails, manually create [map.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/components/ui/map.tsx) with the content fetched from the mapcn registry.*

- [ ] **Step 3: Verify build and lint**

Run:
```bash
npm run lint
npx tsc --noEmit
```
Expected: Successfully pass type checking and linting.

- [ ] **Step 4: Commit**

Run:
```bash
git add package.json package-lock.json components.json src/components/ui/map.tsx
git commit -m "chore: initialize shadcn and install mapcn map component"
```

---

### Task 2: Database Migration Updates for Payment Flows

**Files:**
- Modify: `database/migration.sql`

**Interfaces:**
- Produces: Update `admin_approve_dp(bigint)` and add `admin_complete_payment_offline(bigint)` Postgres functions.

- [ ] **Step 1: Update database functions in migration.sql**

Edit [migration.sql](file:///Users/royanrosyad/Nayor/filq-proj/database/migration.sql):
Update the `public.admin_approve_dp` function:
```sql
create or replace function public.admin_approve_dp(p_booking_id bigint)
returns table (booking_id bigint, user_id uuid)
language plpgsql
set search_path = ''
as $$
declare
  v_booking public.bookings%rowtype;
  v_payment_id bigint;
begin
  if not public.is_admin() then
    raise exception 'Forbidden: admin role required';
  end if;

  select * into v_booking
  from public.bookings
  where id = p_booking_id and status = 'pending'
  for update;

  if not found then
    raise exception 'BookingNotPending: booking is not pending or does not exist';
  end if;

  select p.id into v_payment_id
  from public.payments as p
  where p.booking_id = p_booking_id
    and p.payment_type = 'dp'
    and p.status = 'pending'
  order by p.created_at desc
  limit 1
  for update;

  if v_payment_id is null then
    raise exception 'PendingDPPaymentNotFound: no pending DP payment found';
  end if;

  update public.payments set status = 'approved' where id = v_payment_id;

  -- Transition status directly to confirmed if booking is fully paid upfront
  if v_booking.dp_amount = v_booking.price then
    update public.bookings set status = 'confirmed' where id = p_booking_id;
  else
    update public.bookings set status = 'dp_paid' where id = p_booking_id;
  end if;

  return query select v_booking.id, v_booking.user_id;
end;
$$;
```

Add the new offline completion function:
```sql
create or replace function public.admin_complete_payment_offline(p_booking_id bigint)
returns table (booking_id bigint, user_id uuid)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_booking public.bookings%rowtype;
  v_final_amount numeric(10, 2);
begin
  if not public.is_admin() then
    raise exception 'Forbidden: admin role required';
  end if;

  select * into v_booking
  from public.bookings
  where id = p_booking_id and status = 'dp_paid'
  for update;

  if not found then
    raise exception 'BookingNotDPPaid: booking must be dp_paid to complete payment offline';
  end if;

  v_final_amount := v_booking.price - v_booking.dp_amount;

  -- Insert final payment record approved automatically
  insert into public.payments (booking_id, amount, payment_type, receipt_url, status)
  values (p_booking_id, v_final_amount, 'final', 'offline-cash', 'approved');

  -- Update booking status to confirmed
  update public.bookings set status = 'confirmed' where id = p_booking_id;

  return query select v_booking.id, v_booking.user_id;
end;
$$;

grant execute on function public.admin_complete_payment_offline(bigint) to authenticated;
revoke execute on function public.admin_complete_payment_offline(bigint) from anon;
```

- [ ] **Step 2: Apply the migration to the remote Supabase project**

Use the **Supabase MCP** tool `apply_migration` to apply these database changes, or run `execute_sql` with the queries.

- [ ] **Step 3: Commit**

Run:
```bash
git add database/migration.sql
git commit -m "db: update admin_approve_dp and add admin_complete_payment_offline rpc"
```

---

### Task 3: Support Booking Payment Options and Lock Single Field

**Files:**
- Modify: `src/actions/bookings-utils.ts`
- Modify: `src/app/customer/booking/create/BookingCreateForm.tsx`
- Modify: `src/app/customer/booking/create/BookingCreateForm.test.tsx`

**Interfaces:**
- Consumes: `calculateBookingPrice`
- Produces: Updated booking parameters including `paymentOption`

- [ ] **Step 1: Update booking utilities to parse paymentOption**

Edit [bookings-utils.ts](file:///Users/royanrosyad/Nayor/filq-proj/src/actions/bookings-utils.ts) (specifically `parseCreateBookingForm`):
```typescript
export function parseCreateBookingForm(formData: FormData): ParseResult<ParsedCreateBooking> {
  const fieldId = Number(formData.get('fieldId'));
  const bookingDate = String(formData.get('bookingDate') ?? '');
  const startHour = Number(formData.get('startHour'));
  const endHour = Number(formData.get('endHour'));
  const paymentProof = formData.get('paymentProof');
  const paymentOption = String(formData.get('paymentOption') ?? 'dp');

  if (!Number.isInteger(fieldId) || fieldId <= 0) {
    return { ok: false, error: 'Pilih lapangan terlebih dahulu.' };
  }

  const date = parseLocalDate(bookingDate);
  if (!date) {
    return { ok: false, error: 'Pilih tanggal booking yang valid.' };
  }

  if (!isValidBookingSlot(startHour, endHour)) {
    return { ok: false, error: 'Pilih jam mulai dan selesai yang valid.' };
  }

  const proof = validatePaymentProofFile(paymentProof, 'Unggah bukti pembayaran terlebih dahulu.');
  if (!proof.ok) {
    return { ok: false, error: proof.error };
  }

  const { total, dp: calculatedDp } = calculateBookingPrice(date, startHour, endHour);
  if (total <= 0) {
    return { ok: false, error: 'Slot yang dipilih belum tersedia untuk booking online.' };
  }

  // Adjust DP amount depending on payment option choice
  const dp = paymentOption === 'full' ? total : calculatedDp;

  return {
    ok: true,
    data: {
      fieldId,
      bookingDate,
      startHour,
      endHour,
      startTime: formatHour(startHour),
      endTime: formatHour(endHour),
      total,
      dp,
      paymentProof: proof.file,
    },
  };
}
```

- [ ] **Step 2: Update customer booking creation UI form**

Edit [BookingCreateForm.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/app/customer/booking/create/BookingCreateForm.tsx):
- Hide the "Field Selector" dropdown entirely and force select the first field (`fields[0]?.id`).
- Add a payment method selector in Step 2:
```tsx
const [paymentOption, setPaymentOption] = useState<'dp' | 'full'>('dp');
```
Inside Step 2 (Form Area), render a radio selector:
```tsx
<div className="space-y-3">
  <label className="block text-[13px] font-medium uppercase tracking-[0.02em] text-[#4d505d] dark:text-slate-300">
    Pilih Opsi Pembayaran
  </label>
  <div className="grid grid-cols-2 gap-3">
    <button
      type="button"
      onClick={() => setPaymentOption('dp')}
      className={`rounded-[4px] border p-3.5 text-left transition duration-150 ${
        paymentOption === 'dp'
          ? 'border-[#e4f222] bg-[#e4f222]/10 text-white'
          : 'border-[#d2cecb] dark:border-slate-800 bg-transparent text-[#999ba3]'
      }`}
    >
      <p className="text-sm font-semibold">Bayar DP 30%</p>
      <p className="mt-1 text-xs">{money.format(price.dp)}</p>
    </button>
    <button
      type="button"
      onClick={() => setPaymentOption('full')}
      className={`rounded-[4px] border p-3.5 text-left transition duration-150 ${
        paymentOption === 'full'
          ? 'border-[#e4f222] bg-[#e4f222]/10 text-white'
          : 'border-[#d2cecb] dark:border-slate-800 bg-transparent text-[#999ba3]'
      }`}
    >
      <p className="text-sm font-semibold">Bayar Lunas</p>
      <p className="mt-1 text-xs">{money.format(price.total)}</p>
    </button>
  </div>
  <input type="hidden" name="paymentOption" value={paymentOption} />
</div>
```
- Update text and labels dynamically depending on the selection:
  - Required Payment: `paymentOption === 'full' ? price.total : price.dp`
  - Upload label: `paymentOption === 'full' ? 'Bukti Pembayaran Lunas' : 'Bukti Pembayaran DP'`

- [ ] **Step 3: Update and fix unit tests**

Edit [BookingCreateForm.test.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/app/customer/booking/create/BookingCreateForm.test.tsx) to accommodate:
- No field select dropdown (mock check).
- Option toggles.

Run:
```bash
npm test
```
Expected: All tests pass.

- [ ] **Step 4: Commit**

Run:
```bash
git add src/actions/bookings-utils.ts src/app/customer/booking/create/BookingCreateForm.tsx src/app/customer/booking/create/BookingCreateForm.test.tsx
git commit -m "feat: implement customer payment option selection and lock to single field"
```

---

### Task 4: Implement Admin "Mark as Lunas" Action

**Files:**
- Modify: `src/actions/bookings.ts`
- Modify: `src/app/admin/bookings/AdminBookingsClient.tsx`

**Interfaces:**
- Produces: `completePaymentOfflineAction` server action.

- [ ] **Step 1: Add the offline payment action**

Edit [bookings.ts](file:///Users/royanrosyad/Nayor/filq-proj/src/actions/bookings.ts):
```typescript
export async function completePaymentOfflineAction(formData: FormData): Promise<BookingActionState> {
  const bookingId = parseBookingId(formData);
  if (!bookingId) return { ok: false, error: 'Booking tidak valid.' };

  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return { ok: false, error: admin.error };

  const { data, error } = await supabase
    .rpc('admin_complete_payment_offline', { p_booking_id: bookingId })
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: 'Gagal memproses pelunasan offline. Coba lagi.' };
  }

  revalidateAdminAndCustomerBookingPaths();

  return {
    ok: true,
    bookingId,
    message: 'Pembayaran offline berhasil dicatat dan booking dikonfirmasi lunas.',
  };
}

export async function completePaymentOfflineFormAction(
  _prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  return completePaymentOfflineAction(formData);
}
```

- [ ] **Step 2: Add Action button in the Admin Bookings list**

Edit [AdminBookingsClient.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/app/admin/bookings/AdminBookingsClient.tsx):
- Import `completePaymentOfflineFormAction` from `@/actions/bookings`.
- Under the `actions` column render block, add:
```tsx
{row.status === 'dp_paid' && (
  <BookingActionForm
    action={completePaymentOfflineFormAction}
    bookingId={row.id}
    label="Mark as Lunas"
    pendingLabel="..."
    tone="approve"
  />
)}
```

- [ ] **Step 3: Validate and compile**

Run:
```bash
npm run lint
npx tsc --noEmit
npm test
```
Expected: Successfully compile and pass all tests.

- [ ] **Step 4: Commit**

Run:
```bash
git add src/actions/bookings.ts src/app/admin/bookings/AdminBookingsClient.tsx
git commit -m "feat: add admin mark as lunas offline action"
```

---

### Task 5: Redesign Landing Page Hero & Navbar (Light Style)

**Files:**
- Modify: `src/app/(public)/page.tsx`

**Interfaces:**
- Consumes: Theme toggle / locale context.
- Produces: Redesigned light style hero.

- [ ] **Step 1: Modify Hero section styles**

Edit [page.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/app/(public)/page.tsx):
- Change background style of the hero section to `#ffffff` (`PAPER`).
- Change top navbar link styling from `text-white/70` to `text-[#4d505d]` (`SLATE`) and `hover:text-[#0c0a08]` (`OBSIDIAN`).
- Remove `invert dark:invert-0` styling classes from the Logo Image in `<nav>`.
- Change primary and secondary text classes in the hero area to use `text-[#0c0a08]` (`OBSIDIAN`) instead of `text-white`.
- Adjust buttons and subheadings for dark text contrast.

- [ ] **Step 2: Verify visual styling**

Check type checking and compile.
Run:
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

Run:
```bash
git add src/app/\(public\)/page.tsx
git commit -m "style: redesign landing page hero and navbar to light style"
```

---

### Task 6: Implement 5-Day Schedule Grid & mapcn Map

**Files:**
- Modify: `src/app/(public)/page.tsx`

**Interfaces:**
- Consumes: supabase, `Map` from `@/components/ui/map`

- [ ] **Step 1: Retrieve bookings on the landing page**

Edit [page.tsx](file:///Users/royanrosyad/Nayor/filq-proj/src/app/(public)/page.tsx) to fetch bookings client-side for the next 5 days from Supabase.
Add calendar date lists:
```typescript
const dates = Array.from({ length: 5 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return d;
});
```

- [ ] **Step 2: Render schedule grid layout**

Build a layout in `page.tsx` below features or pricing. Use the 5-day grid structure:
- Render columns for each of the 5 days.
- In each column, show the day and date at the top, and render the 8 slots vertically.
- Calculate prices for each slot dynamically based on the day using pricing slot logic (weekday/weekend/friday) from `pricing.ts`.
- Check if a slot is booked (matches booking date, start/end hours, and status != `'cancelled'`).
  - **Booked**: Disabled grey card styled with white minus sign.
  - **Available**: White card with green border, green plus sign. Links to `/customer/booking/create?date=YYYY-MM-DD&start=HH&end=HH`.

- [ ] **Step 3: Embed Maps Component**

Below the schedule grid, add a Container rendering:
```tsx
import { Map, MapControls, MapMarker } from "@/components/ui/map";

// Map centered around Stadion HAM coordinates
<div className="h-[400px] w-full overflow-hidden rounded-xl border border-[#d2cecb] dark:border-slate-800">
  <Map center={[112.4414, -7.2185]} zoom={15}>
    <MapControls />
    <MapMarker longitude={112.4414} latitude={-7.2185}>
      {/* Custom marker label */}
    </MapMarker>
  </Map>
</div>
```

- [ ] **Step 4: Full verification and build**

Run:
```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```
Expected: Linter, tests, types, and production build compiles cleanly without any warnings or failures.

- [ ] **Step 5: Commit**

Run:
```bash
git add src/app/\(public\)/page.tsx
git commit -m "feat: add 5-day schedule grid and embed maps on landing page"
```
