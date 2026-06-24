# Spec: Landing Page and Payment Flow Improvements

This document outlines the design and database changes required to redesign the landing page hero, integrate a 5-day availability schedule grid, limit booking selection to a single field, support full upfront payments alongside 30% DP, and add maps using `mapcn`.

## 1. Hero & Navbar Redesign (Light Style)
The landing page hero will transition from a dark gradient to a clean, light aesthetic.

*   **Hero Background**: Pure white background (`#ffffff` / `PAPER`) or warm limestone (`#f4f2f0` / `LIMESTONE`).
*   **Hero Typography & Elements**:
    *   Change heading "Stadion H. Abdul Malik" and description text color to `#0c0a08` (`OBSIDIAN`).
    *   Change primary action buttons and badge styling to match the light background.
*   **Navbar Styling**:
    *   Links (`#facilities`, `#pricing`, etc.) will change from `text-white/70` to `#4d505d` (`SLATE`) and `#0c0a08` (`OBSIDIAN`) on hover.
    *   Logo container will render `Logo-HAM-fix.png` with original colors (no `.invert` filter class).
    *   Language toggle and Sign In links will use dark borders and text colors.

## 2. 5-Day Schedule Grid & mapcn Integration
We will replace static pricing/calendar hints on the landing page with an interactive, live-updated 5-day schedule grid.

*   **Schedule Layout**:
    *   Render a horizontal list of 5 columns (starting from today).
    *   Each column represents a single day, formatted with day name and date (e.g., "Kamis, 25 Jun").
    *   Under each day, render the 8 standard booking slots (06:00 to 22:00) vertically.
*   **Card Status & Interactions**:
    *   **Available**: Green border, green "+", displays pricing calculated from `pricing.ts`, clickable link to `/customer/booking/create?date=YYYY-MM-DD&start=HH&end=HH`.
    *   **Booked**: Solid gray background, white "-", "Sudah Dipesan" status, non-clickable.
*   **Live Data Fetching**:
    *   The landing page client component will fetch active bookings between today and today + 4 days.
    *   Any booking status that is not `cancelled` will count as booked.
*   **Map Integration**:
    *   Initialize shadcn/ui: Run `npx shadcn@latest init`.
    *   Install mapcn: Run `npx shadcn@latest add @mapcn/map`.
    *   Add a map section above the footer rendering the geographic location of Stadion HAM (`[-7.xxxxx, 112.xxxxx]` or equivalent maps coordinates derived from `https://maps.app.goo.gl/zWhDSF6oPnzU7vvQ7`).

## 3. Single Field Booking Focus
To focus customer bookings purely on the internal "Stadion HAM" field:
*   Remove the "Pilih Lapangan" dropdown selection from the customer booking page.
*   Preselect the first active field (or the one named "Stadion HAM") and send its ID automatically in the booking payload.
*   Retain the "Field Details" CRUD options inside the Admin Sidebar for configuration (pricing, address, status) by administrators.

## 4. Payment Flow Refinement (DP vs Full Payment)
*   **Metode Pembayaran**:
    *   Add selection tabs or radio buttons in customer booking step 2 for "DP 30%" or "Bayar Lunas (100%)".
    *   If "Bayar Lunas" is selected, the client sets `dp_amount = total_price` in the payload.
*   **Database state machine (`admin_approve_dp` RPC)**:
    *   Update `public.admin_approve_dp` in `database/migration.sql`:
        ```sql
        -- If the payment represents a full payment (dp_amount equals total price), transition status to confirmed directly
        if v_booking.dp_amount = v_booking.price then
          update public.bookings set status = 'confirmed' where id = p_booking_id;
        else
          update public.bookings set status = 'dp_paid' where id = p_booking_id;
        end if;
        ```
*   **Admin Offline Completion**:
    *   Allow the admin to click a "Mark as Lunas" button for bookings with status `dp_paid`.
    *   This will trigger a server action inserting an approved `final` payment record in the `payments` table and updating the booking status to `confirmed`.

## 5. Verification Plan
*   **Automated Tests**:
    *   Update `BookingCreateForm.test.tsx` to handle payment options and mock fields.
    *   Ensure all tests in `npm test` execute successfully.
*   **Manual Verification**:
    *   Verify landing page hero visual appearance.
    *   Test scheduling grid (making bookings and verifying that the slot immediately shows as "Booked").
    *   Test "Full Payment" lifecycle and "DP 30%" + admin complete payment offline.
